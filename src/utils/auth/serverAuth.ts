import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import type { JWT } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";

import { AUTH_SECRET } from "./authSecret";

type WithAuthOptions = {
  redirectIfAuthenticated?: string;
  redirectIfUnauthenticated?: string;
  translations?: string[];
};

/**
 * Rebuilds the shape `getSession` used to return, so the props contract of every page
 * behind `withAuth` is unchanged. `id` mirrors what the `session` callback in
 * `[...nextauth]` puts there.
 */
const toSession = (token: JWT) => ({
  user: {
    id: token.sub ?? null,
    name: token.name ?? null,
    email: token.email ?? null,
    image: token.picture ?? null,
  },
  expires: typeof token.exp === "number" ? new Date(token.exp * 1000).toISOString() : "",
});

export function withAuth(options: WithAuthOptions = {}) {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<any>> => {
    // `getToken` verifies the session cookie in-process. The obvious-looking
    // `getSession` from `next-auth/react` is the *client* helper: called here it issues a
    // real HTTP request back to /api/auth/session, so every page view cost two function
    // invocations and billed the page for the whole round-trip while it waited.
    // `getServerSession` would also work but drags in `authOptions`, and that module
    // initializes firebase-admin at import time — a cold-start tax on all 33 pages.
    const token = await getToken({ req: context.req, secret: AUTH_SECRET });
    const isAuthenticated = !!token;

    if (isAuthenticated) {
      if (options.redirectIfAuthenticated) {
        return {
          redirect: {
            destination: options.redirectIfAuthenticated,
            permanent: false,
          },
        };
      }
    } else {
      if (options.redirectIfUnauthenticated) {
        return {
          redirect: {
            destination: options.redirectIfUnauthenticated,
            permanent: false,
          },
        };
      }
    }

    return {
      props: {
        isAuthenticated,
        session: token ? toSession(token) : null,
      },
    };
  };
}
