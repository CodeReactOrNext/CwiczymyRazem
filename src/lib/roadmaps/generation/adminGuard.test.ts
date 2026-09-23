import type { NextApiRequest } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSupporter = vi.fn();
vi.mock("lib/support/supporterAuth", () => ({
  requireSupporter: (...args: unknown[]) => requireSupporter(...args),
}));

const { authorizeGeneration, isAdminRequest } = await import("./adminGuard");

const makeReq = (overrides: Partial<NextApiRequest> = {}): NextApiRequest =>
  ({ headers: {}, body: {}, ...overrides }) as NextApiRequest;

const ORIGINAL_PASSWORD = process.env.ADMIN_PASSWORD;

beforeEach(() => {
  requireSupporter.mockReset();
  process.env.ADMIN_PASSWORD = "s3cret";
});

describe("isAdminRequest", () => {
  it("accepts the header or the body password", () => {
    expect(
      isAdminRequest(makeReq({ headers: { "x-admin-password": "s3cret" } })),
    ).toBe(true);
    expect(isAdminRequest(makeReq({ body: { password: "s3cret" } }))).toBe(
      true,
    );
  });

  it("rejects a wrong or missing password", () => {
    expect(
      isAdminRequest(makeReq({ headers: { "x-admin-password": "nope" } })),
    ).toBe(false);
    expect(isAdminRequest(makeReq())).toBe(false);
  });

  it("rejects everyone when ADMIN_PASSWORD is unset", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(
      isAdminRequest(makeReq({ headers: { "x-admin-password": "s3cret" } })),
    ).toBe(false);
    process.env.ADMIN_PASSWORD = ORIGINAL_PASSWORD;
  });
});

describe("authorizeGeneration", () => {
  it("passes the admin queue without touching requireSupporter", async () => {
    const result = await authorizeGeneration(
      makeReq({ headers: { "x-admin-password": "s3cret" } }),
    );

    expect(result).toEqual({ ok: true, uid: null });
    expect(requireSupporter).not.toHaveBeenCalled();
  });

  it("falls back to a supporter's idToken and returns their uid", async () => {
    requireSupporter.mockResolvedValue({
      ok: true,
      session: { uid: "u1", isSupporter: true },
    });

    const result = await authorizeGeneration(
      makeReq({ body: { idToken: "tok" } }),
    );

    expect(result).toEqual({ ok: true, uid: "u1" });
  });

  it("carries the status and message when neither auth path works", async () => {
    requireSupporter.mockResolvedValue({
      ok: false,
      status: 403,
      error: "Supporters only",
    });

    const result = await authorizeGeneration(makeReq());

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: "Supporters only",
    });
  });
});
