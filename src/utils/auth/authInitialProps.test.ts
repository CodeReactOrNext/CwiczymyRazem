// @vitest-environment node
import type { NextPageContext } from "next";
import { encode } from "next-auth/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { withAuthInitialProps } from "./authInitialProps";
import { AUTH_SECRET } from "./authSecret";

// Same cookie-name pinning as serverAuth.test.ts.
beforeEach(() => {
  vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
  vi.stubEnv("VERCEL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const makeContext = (cookie?: string) => {
  const res = { writeHead: vi.fn(), end: vi.fn() };
  const context = {
    req: { cookies: cookie ? { "next-auth.session-token": cookie } : {}, headers: {} },
    res,
  } as unknown as NextPageContext;
  return { context, res };
};

const sign = () =>
  encode({ secret: AUTH_SECRET, token: { sub: "uid-123", name: "Jimi", email: "jimi@example.com" } });

describe("withAuthInitialProps", () => {
  it("hands the session to SessionProvider on a signed-in page load", async () => {
    const { context, res } = makeContext(await sign());
    const props = await withAuthInitialProps()(context);

    expect(props).toMatchObject({ isAuthenticated: true, session: { user: { id: "uid-123" } } });
    expect(res.writeHead).not.toHaveBeenCalled();
  });

  it("sends an anonymous page load to the login page", async () => {
    const { context, res } = makeContext();
    await withAuthInitialProps()(context);

    expect(res.writeHead).toHaveBeenCalledWith(307, { Location: "/login" });
    expect(res.end).toHaveBeenCalled();
  });

  /** The reason this exists: in-app navigation must not wait on the server. */
  it("does nothing in the browser", async () => {
    vi.stubGlobal("window", {});
    const { context, res } = makeContext();

    expect(await withAuthInitialProps()(context)).toEqual({});
    expect(res.writeHead).not.toHaveBeenCalled();
  });
});
