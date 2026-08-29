import type { PlayerSession } from "lib/support/supporterAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Fake Firestore with subcollections and a collection-group lookup. */
const store = new Map<string, Record<string, any>>();

interface Ref {
  __path: string;
  id: string;
}

const ref = (path: string): Ref => ({
  __path: path,
  id: path.split("/").pop()!,
});

const snapshot = (path: string) => ({
  id: ref(path).id,
  exists: store.has(path),
  data: () => store.get(path),
  ref: {
    ...ref(path),
    // .../guilds/{guildId}/applications/{uid} → the guild document above it.
    parent: { parent: { id: path.split("/").slice(-3, -2)[0] } },
  },
});

const childrenOf = (prefix: string) =>
  [...store.keys()].filter(
    (path) =>
      path.startsWith(`${prefix}/`) &&
      !path.slice(prefix.length + 1).includes("/"),
  );

const collectionApi = (prefix: string): any => ({
  doc: (id: string) => ({
    ...ref(`${prefix}/${id}`),
    get: async () => snapshot(`${prefix}/${id}`),
    collection: (sub: string) => collectionApi(`${prefix}/${id}/${sub}`),
    delete: async () => store.delete(`${prefix}/${id}`),
  }),
  limit: () => collectionApi(prefix),
  get: async () => ({ docs: childrenOf(prefix).map((p) => snapshot(p)) }),
});

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: {},
  firestore: {
    collection: (name: string) => collectionApi(name),
    collectionGroup: (name: string) => ({
      where: (_field: string, _op: string, value: string) => ({
        limit: () => ({
          get: async () => ({
            docs: [...store.keys()]
              .filter((path) => path.includes(`/${name}/`))
              .filter((path) => store.get(path)?.uid === value)
              .map((path) => snapshot(path)),
          }),
        }),
      }),
    }),
    runTransaction: async (fn: (tx: any) => Promise<unknown>) =>
      fn({
        get: async (target: Ref) => snapshot(target.__path),
        set: (target: Ref, value: Record<string, any>) =>
          store.set(target.__path, value),
        update: (target: Ref, patch: Record<string, any>) =>
          store.set(target.__path, {
            ...(store.get(target.__path) ?? {}),
            ...patch,
          }),
        delete: (target: Ref) => store.delete(target.__path),
      }),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => new Date("2026-08-29T00:00:00.000Z") },
}));

const {
  applyToGuild,
  decideApplication,
  findMyApplication,
  readApplications,
  withdrawApplication,
} = await import("./guildApplications");

const session = (uid: string): PlayerSession => ({
  uid,
  supportTotal: 0,
  displayName: uid,
  avatar: null,
  isOwner: false,
  isSupporter: false,
});

const GUILD = "riff-raiders";
const application = (uid: string) =>
  store.get(`guilds/${GUILD}/applications/${uid}`);
const members = (): any[] => store.get(`guilds/${GUILD}`)?.members ?? [];

beforeEach(() => {
  store.clear();
  store.set(`guilds/${GUILD}`, {
    founderUid: "founder",
    members: [{ uid: "founder", displayName: "founder", avatar: null }],
  });
  store.set("users/founder", { displayName: "founder", guildId: GUILD });
  store.set("users/hopeful", { displayName: "hopeful" });
});

describe("applyToGuild", () => {
  it("files a pending request under the applicant's own id", async () => {
    expect(
      await applyToGuild(session("hopeful"), GUILD, "  let me in  "),
    ).toEqual({ ok: true });

    expect(application("hopeful")).toMatchObject({
      uid: "hopeful",
      status: "pending",
      message: "let me in",
    });
    // Asking is not joining.
    expect(members()).toHaveLength(1);
    expect(store.get("users/hopeful")?.guildId).toBeUndefined();
  });

  it("refuses somebody already in a guild", async () => {
    store.set("users/hopeful", {
      displayName: "hopeful",
      guildId: "elsewhere",
    });

    expect(await applyToGuild(session("hopeful"), GUILD, "")).toMatchObject({
      ok: false,
      status: 409,
    });
    expect(application("hopeful")).toBeUndefined();
  });

  it("404s on a guild that is gone", async () => {
    expect(await applyToGuild(session("hopeful"), "ghosts", "")).toMatchObject({
      ok: false,
      status: 404,
    });
  });

  it("re-applying overwrites rather than stacking", async () => {
    await applyToGuild(session("hopeful"), GUILD, "first");
    await applyToGuild(session("hopeful"), GUILD, "second");

    expect(await readApplications(GUILD)).toHaveLength(1);
    expect(application("hopeful")?.message).toBe("second");
  });
});

describe("decideApplication", () => {
  beforeEach(async () => {
    await applyToGuild(session("hopeful"), GUILD, "let me in");
  });

  it("seats the applicant and clears the request", async () => {
    expect(
      await decideApplication(session("founder"), GUILD, "hopeful", true),
    ).toEqual({ ok: true });

    expect(members().map((m) => m.uid)).toEqual(["founder", "hopeful"]);
    expect(store.get("users/hopeful")?.guildId).toBe(GUILD);
    expect(application("hopeful")).toBeUndefined();
  });

  it("keeps a rejection visible instead of deleting it", async () => {
    expect(
      await decideApplication(session("founder"), GUILD, "hopeful", false),
    ).toEqual({ ok: true });

    // The applicant has to be able to see they were answered.
    expect(application("hopeful")?.status).toBe("rejected");
    expect(members()).toHaveLength(1);
  });

  it("refuses anyone who is not the founder — members included", async () => {
    store.set(`guilds/${GUILD}`, {
      ...store.get(`guilds/${GUILD}`),
      members: [
        { uid: "founder", displayName: "founder", avatar: null },
        { uid: "member", displayName: "member", avatar: null },
      ],
    });
    store.set("users/member", { displayName: "member", guildId: GUILD });

    const result = await decideApplication(
      session("member"),
      GUILD,
      "hopeful",
      true,
    );

    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(members()).toHaveLength(2);
    expect(store.get("users/hopeful")?.guildId).toBeUndefined();
  });

  it("cannot seat the same person twice", async () => {
    await decideApplication(session("founder"), GUILD, "hopeful", true);
    const second = await decideApplication(
      session("founder"),
      GUILD,
      "hopeful",
      true,
    );

    expect(second).toMatchObject({ ok: false, status: 404 });
    expect(members()).toHaveLength(2);
  });

  it("catches an applicant who joined elsewhere while the request sat", async () => {
    store.set("users/hopeful", {
      displayName: "hopeful",
      guildId: "elsewhere",
    });

    const result = await decideApplication(
      session("founder"),
      GUILD,
      "hopeful",
      true,
    );

    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(members()).toHaveLength(1);
  });
});

describe("withdrawApplication", () => {
  it("lets the applicant pull their own request", async () => {
    await applyToGuild(session("hopeful"), GUILD, "");

    expect(await withdrawApplication(session("hopeful"), GUILD)).toEqual({
      ok: true,
    });
    expect(application("hopeful")).toBeUndefined();
  });
});

describe("findMyApplication", () => {
  it("finds an outstanding request without reading every guild", async () => {
    await applyToGuild(session("hopeful"), GUILD, "");

    expect(await findMyApplication("hopeful")).toEqual({
      guildId: GUILD,
      status: "pending",
    });
  });

  it("reports a rejection, so it can be shown rather than silently dropped", async () => {
    await applyToGuild(session("hopeful"), GUILD, "");
    await decideApplication(session("founder"), GUILD, "hopeful", false);

    expect(await findMyApplication("hopeful")).toMatchObject({
      status: "rejected",
    });
  });

  it("returns nothing for somebody who has not applied", async () => {
    expect(await findMyApplication("stranger")).toBeNull();
  });
});
