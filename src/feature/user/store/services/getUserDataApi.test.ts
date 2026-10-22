import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const docGet = vi.fn();
const docSet = vi.fn();
const docUpdate = vi.fn();
const docFor = vi.fn();
const hasPendingSupporter = vi.fn();
const claimPendingSupporter = vi.fn();
const sendWelcomeEmail = vi.fn();

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: { verifyIdToken: (token: string) => verifyIdToken(token) },
  firestore: {
    collection: () => ({
      doc: (uid: string) => {
        docFor(uid);
        return { get: docGet, set: docSet, update: docUpdate };
      },
    }),
  },
}));

vi.mock("lib/support/supporterGrant", () => ({
  hasPendingSupporter: (email: string) => hasPendingSupporter(email),
  claimPendingSupporter: (uid: string, email: string) => claimPendingSupporter(uid, email),
}));

vi.mock("lib/email/send", () => ({
  sendWelcomeEmail: (args: unknown) => sendWelcomeEmail(args),
}));
vi.mock("lib/email/cooldown", () => ({ todayKey: () => "2026-10-22" }));
vi.mock("lib/email/cooldownStore", () => ({ markCooldown: vi.fn() }));

import handler from "../../../../pages/api/user/getUserData";

const call = async (body: unknown) => {
  const res = {
    statusCode: 0,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
    end() {
      return this;
    },
  };
  await handler(
    { method: "POST", body } as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  return res;
};

const existingDoc = (data: object) => ({ exists: true, data: () => data });

describe("POST /api/user/getUserData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPendingSupporter.mockResolvedValue(false);
    sendWelcomeEmail.mockResolvedValue(undefined);
  });

  it("refuses a request without a token", async () => {
    const res = await call({ user: { uid: "victim" } });

    expect(res.statusCode).toBe(401);
    expect(docFor).not.toHaveBeenCalled();
  });

  it("refuses a token that does not verify", async () => {
    verifyIdToken.mockRejectedValue(new Error("bad token"));

    const res = await call({ idToken: "forged" });

    expect(res.statusCode).toBe(401);
    expect(docFor).not.toHaveBeenCalled();
  });

  it("reads the profile of the token's uid, never one named in the body", async () => {
    verifyIdToken.mockResolvedValue({ uid: "uid-1", email: "a@b.c" });
    docGet.mockResolvedValue(existingDoc({ displayName: "Riffer", email: "a@b.c", statistics: { points: 5 } }));

    const res = await call({ idToken: "token", user: { uid: "victim" } });

    expect(res.statusCode).toBe(200);
    expect(docFor).toHaveBeenCalledWith("uid-1");
    expect(res.payload).toMatchObject({ userAuth: "uid-1", userInfo: { displayName: "Riffer" } });
    // An existing document is read once.
    expect(docGet).toHaveBeenCalledTimes(1);
  });

  it("still accepts the serialized Firebase user sent by older clients", async () => {
    verifyIdToken.mockResolvedValue({ uid: "uid-1", email: "a@b.c" });
    docGet.mockResolvedValue(existingDoc({ email: "a@b.c" }));

    const res = await call({ user: { uid: "uid-1", stsTokenManager: { accessToken: "legacy" } } });

    expect(verifyIdToken).toHaveBeenCalledWith("legacy");
    expect(res.statusCode).toBe(200);
  });

  it("sends the welcome email to the verified address, not one from the body", async () => {
    verifyIdToken.mockResolvedValue({ uid: "uid-1", email: "real@b.c" });
    docGet
      .mockResolvedValueOnce({ exists: false, data: () => undefined })
      .mockResolvedValueOnce(existingDoc({ email: "real@b.c" }));

    await call({ idToken: "token", displayName: "NewNick", user: { email: "other@b.c" } });

    expect(docSet).toHaveBeenCalledWith(
      expect.objectContaining({ email: "real@b.c", displayName: "NewNick" }),
    );
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "real@b.c" }),
    );
  });

  it("claims a parked donation only when one is waiting", async () => {
    verifyIdToken.mockResolvedValue({ uid: "uid-1", email: "a@b.c" });
    docGet.mockResolvedValue(existingDoc({ email: "a@b.c" }));

    await call({ idToken: "token" });
    expect(claimPendingSupporter).not.toHaveBeenCalled();

    hasPendingSupporter.mockResolvedValue(true);
    await call({ idToken: "token" });
    expect(claimPendingSupporter).toHaveBeenCalledWith("uid-1", "a@b.c");
  });
});
