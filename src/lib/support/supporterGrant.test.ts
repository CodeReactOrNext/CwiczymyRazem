import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Firestore stand-in only supports what this module actually does:
 * `collection().doc()`, `collection().where().limit().get()` and a `set` on the
 * roster document. Data lives in a plain map keyed `collection/id`.
 */
const store = new Map<string, Record<string, any>>();
const deleted: string[] = [];
const authUsers = new Map<string, { email: string | null }>();

/** Resolves the FieldValue.increment markers the way Firestore would. */
const applyPatch = (
  base: Record<string, any>,
  patch: Record<string, any>,
): Record<string, any> => {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    next[key] =
      value && typeof value === "object" && "__increment" in value
        ? (next[key] ?? 0) + value.__increment
        : value;
  }
  return next;
};

const docApi = (path: string) => ({
  id: path.split("/").slice(1).join("/"),
  ref: {
    update: async (patch: Record<string, any>) => {
      store.set(path, applyPatch(store.get(path) ?? {}, patch));
    },
  },
  get exists() {
    return store.has(path);
  },
  data: () => store.get(path),
  get: async () => docApi(path),
  set: async (value: Record<string, any>, options?: { merge?: boolean }) => {
    store.set(
      path,
      options?.merge ? applyPatch(store.get(path) ?? {}, value) : value,
    );
  },
  update: async (patch: Record<string, any>) => {
    store.set(path, applyPatch(store.get(path) ?? {}, patch));
  },
  delete: async () => {
    deleted.push(path);
    store.delete(path);
  },
});

const collectionApi = (name: string) => {
  const query = (filter?: { field: string; value: unknown }) => ({
    limit: () => query(filter),
    get: async () => {
      const docs = [...store.entries()]
        .filter(([path]) => path.startsWith(`${name}/`))
        .filter(([, data]) => !filter || data[filter.field] === filter.value)
        .map(([path]) => docApi(path));
      return { docs, empty: docs.length === 0 };
    },
  });

  return {
    doc: (id: string) => docApi(`${name}/${id}`),
    where: (field: string, _op: string, value: unknown) =>
      query({ field, value }),
    get: query().get,
  };
};

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: { collection: (name: string) => collectionApi(name) },
  auth: {
    getUser: async (uid: string) => {
      const user = authUsers.get(uid);
      if (!user) throw new Error("no such user");
      return user;
    },
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: () => "SERVER_TS",
    delete: () => "DELETE",
    increment: (by: number) => ({ __increment: by }),
  },
}));

const {
  claimPendingSupporter,
  grantSupporterByEmail,
  listPendingSupporters,
  removePendingSupporter,
} = await import("./supporterGrant");

const PENDING = "bmcPendingSupporters/ola%40gmail.com";

beforeEach(() => {
  store.clear();
  deleted.length = 0;
  authUsers.clear();
});

describe("grantSupporterByEmail", () => {
  it("flags the account behind the donation and republishes the roster", async () => {
    store.set("users/u1", { displayName: "Ola", email: "ola@gmail.com" });

    const outcome = await grantSupporterByEmail({ email: "Ola@Gmail.com" });

    expect(outcome).toEqual({ status: "granted", uid: "u1" });
    expect(store.get("users/u1")?.isSupport).toBe(true);
    expect(store.get("config/supportTeam")?.members).toEqual([
      { uid: "u1", displayName: "Ola", avatar: null, title: null },
    ]);
  });

  it("finds an account stored with the casing typed at sign-up", async () => {
    store.set("users/u1", { displayName: "Ola", email: "Ola@Gmail.com" });

    expect(await grantSupporterByEmail({ email: "Ola@Gmail.com" })).toEqual({
      status: "granted",
      uid: "u1",
    });
  });

  it("leaves a custom badge title alone on a repeat donation", async () => {
    store.set("users/u1", {
      displayName: "Ola",
      email: "ola@gmail.com",
      isSupport: true,
      supportTitle: "Patron",
    });

    expect(await grantSupporterByEmail({ email: "ola@gmail.com" })).toEqual({
      status: "already",
      uid: "u1",
    });
    expect(store.get("users/u1")?.supportTitle).toBe("Patron");
  });

  it("adds every donation to the lifetime total the panel spends", async () => {
    store.set("users/u1", { displayName: "Ola", email: "ola@gmail.com" });

    await grantSupporterByEmail({ email: "ola@gmail.com", amount: 5 });
    await grantSupporterByEmail({ email: "ola@gmail.com", amount: 15 });

    expect(store.get("users/u1")?.supportTotal).toBe(20);
  });

  it("accrues donations made before the account exists", async () => {
    await grantSupporterByEmail({ email: "ola@gmail.com", amount: 5 });
    await grantSupporterByEmail({ email: "ola@gmail.com", amount: 3 });

    expect(store.get(PENDING)?.amount).toBe(8);
  });

  it("parks the donation when nobody signed up with that address", async () => {
    const outcome = await grantSupporterByEmail({
      email: "Ola@Gmail.com",
      supporterName: "Ola",
      amount: 15,
    });

    expect(outcome).toEqual({ status: "pending", email: "ola@gmail.com" });
    expect(store.get(PENDING)).toMatchObject({
      email: "ola@gmail.com",
      supporterName: "Ola",
      amount: 15,
    });
  });

  it("skips an anonymous donation instead of parking a null address", async () => {
    expect(await grantSupporterByEmail({ email: null })).toEqual({
      status: "skipped",
    });
    expect(store.size).toBe(0);
  });
});

describe("claimPendingSupporter", () => {
  beforeEach(() => {
    store.set(PENDING, {
      email: "ola@gmail.com",
      supporterName: "Ola",
      amount: 12,
    });
    store.set("users/u1", { displayName: "Ola", email: "ola@gmail.com" });
  });

  it("carries the parked amount onto the account", async () => {
    authUsers.set("u1", { email: "ola@gmail.com" });

    await claimPendingSupporter("u1", "ola@gmail.com");

    expect(store.get("users/u1")?.supportTotal).toBe(12);
  });

  it("hands out the badge and clears the parked donation", async () => {
    authUsers.set("u1", { email: "Ola@Gmail.com" });

    expect(await claimPendingSupporter("u1", "ola@gmail.com")).toBe("granted");
    expect(store.get("users/u1")?.isSupport).toBe(true);
    expect(deleted).toContain(PENDING);
    expect(store.get("config/supportTeam")?.members).toHaveLength(1);
  });

  it("refuses an address Firebase Auth does not back", async () => {
    authUsers.set("u1", { email: "someone.else@gmail.com" });

    expect(await claimPendingSupporter("u1", "ola@gmail.com")).toBe("mismatch");
    expect(store.get("users/u1")?.isSupport).toBeUndefined();
    expect(store.get(PENDING)).toBeDefined();
  });

  it("does nothing for an account with no donation waiting", async () => {
    authUsers.set("u2", { email: "nobody@gmail.com" });

    expect(await claimPendingSupporter("u2", "nobody@gmail.com")).toBe("none");
  });

  it("skips a login with no address at all", async () => {
    expect(await claimPendingSupporter("u1", null)).toBe("skipped");
    expect(store.get(PENDING)).toBeDefined();
  });
});

describe("the pending list", () => {
  it("reads back the parked donations, newest first", async () => {
    store.set("bmcPendingSupporters/a%40x.com", {
      email: "a@x.com",
      supporterName: null,
      amount: 5,
      createdAt: { toDate: () => new Date("2026-01-01T00:00:00.000Z") },
    });
    store.set("bmcPendingSupporters/b%40x.com", {
      email: "b@x.com",
      supporterName: "B",
      amount: null,
      createdAt: { toDate: () => new Date("2026-02-01T00:00:00.000Z") },
    });

    expect((await listPendingSupporters()).map((p) => p.email)).toEqual([
      "b@x.com",
      "a@x.com",
    ]);
  });

  it("drops one by address, whatever casing the admin pasted", async () => {
    store.set(PENDING, { email: "ola@gmail.com" });

    expect(await removePendingSupporter("OLA@gmail.com ")).toBe(true);
    expect(store.get(PENDING)).toBeUndefined();
  });
});
