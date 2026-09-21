import type { GetServerSidePropsContext } from "next";
import { encode } from "next-auth/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_SECRET } from "./authSecret";
import { withAuth } from "./serverAuth";

/**
 * `getToken` picks the cookie name from the environment: `__Secure-` prefixed when
 * NEXTAUTH_URL is https or VERCEL is set. Pin it to the plain name so these tests assert
 * the auth logic rather than whatever env the suite happens to run in.
 */
beforeEach(() => {
  vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
  vi.stubEnv("VERCEL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const contextWithCookie = (cookie?: string) =>
  ({
    req: { cookies: cookie ? { "next-auth.session-token": cookie } : {}, headers: {} },
    res: {},
  }) as unknown as GetServerSidePropsContext;

const sign = (secret: string) =>
  encode({
    secret,
    token: { sub: "uid-123", name: "Jimi", email: "jimi@example.com" },
  });

describe("withAuth", () => {
  it("reads an identity out of a validly signed session cookie", async () => {
    const result = (await withAuth()(contextWithCookie(await sign(AUTH_SECRET)))) as {
      props: { isAuthenticated: boolean; session: { user: { id: string; name: string } } };
    };

    expect(result.props.isAuthenticated).toBe(true);
    expect(result.props.session.user.id).toBe("uid-123");
    expect(result.props.session.user.name).toBe("Jimi");
  });

  it("treats a missing cookie as logged out", async () => {
    const result = (await withAuth()(contextWithCookie())) as {
      props: { isAuthenticated: boolean; session: null };
    };

    expect(result.props.isAuthenticated).toBe(false);
    expect(result.props.session).toBeNull();
  });

  /**
   * The point of verifying rather than merely detecting the cookie: a token someone else
   * signed must not authenticate anyone.
   */
  it("rejects a cookie signed with a different secret", async () => {
    const forged = await sign("not-the-real-secret");
    const result = (await withAuth()(contextWithCookie(forged))) as {
      props: { isAuthenticated: boolean };
    };

    expect(result.props.isAuthenticated).toBe(false);
  });

  it("redirects an anonymous visitor when the page asks for it", async () => {
    const result = await withAuth({ redirectIfUnauthenticated: "/login" })(contextWithCookie());

    expect(result).toEqual({ redirect: { destination: "/login", permanent: false } });
  });

  it("redirects a signed-in visitor away from anonymous-only pages", async () => {
    const context = contextWithCookie(await sign(AUTH_SECRET));
    const result = await withAuth({ redirectIfAuthenticated: "/dashboard" })(context);

    expect(result).toEqual({ redirect: { destination: "/dashboard", permanent: false } });
  });
});
