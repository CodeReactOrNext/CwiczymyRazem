import type { GetServerSidePropsContext, GetServerSidePropsResult, NextPageContext } from "next";
import type { JWT } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";

import { AUTH_SECRET } from "./authSecret";

type WithAuthOptions = {
  redirectIfAuthenticated?: string;
  redirectIfUnauthenticated?: string;
  /**
   * Accepted and ignored. Pages are rendered in English and the chosen language
   * is applied in the browser (see `lib/i18n`), so there is nothing for the server
   * to preload — but ~40 pages pass this, and dropping it would touch all of them.
   */
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

/**
 * Server half of `withAuthInitialProps` (see `authInitialProps.ts`) — a full page load
 * of a page inside the app. Same gate as `withAuth({ redirectIfUnauthenticated })`: no
 * valid cookie → 307 to `redirectTo`, otherwise the props `withAuth` would have returned.
 */
export async function authenticatePageLoad(context: NextPageContext, redirectTo: string) {
  const { req, res } = context;
  if (!req || !res) return {};

  // Next sets `req.cookies` before any data method runs, `getInitialProps` included.
  const token = await getToken({ req: req as GetServerSidePropsContext["req"], secret: AUTH_SECRET });

  if (!token) {
    res.writeHead(307, { Location: redirectTo });
    res.end();
    return {};
  }

  return { isAuthenticated: true, session: toSession(token) };
}

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
