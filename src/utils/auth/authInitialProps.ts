import type { NextPageContext } from "next";

// Type-only: erased from the bundle, unlike a value import of the server module.
import type { authenticatePageLoad } from "./serverAuth";

type AuthInitialProps = Awaited<ReturnType<typeof authenticatePageLoad>>;

/**
 * Login gate for pages inside the app — the `getInitialProps` counterpart of
 * `withAuth({ redirectIfUnauthenticated })`.
 *
 * `getServerSideProps` runs on the server for every visit, in-app clicks included:
 * each sidebar link waited for a Vercel function round-trip (~250 ms warm, more on a
 * cold start) before the page could even start to swap. `getInitialProps` runs on
 * the server only for a full page load and in the browser for in-app navigation,
 * where there is nothing left to check — SessionProvider already holds the session
 * and `AppLayout` sends a signed-out user away.
 *
 * Full loads (typed URL, refresh, a crawler) keep the server-side gate: no cookie →
 * 307 to the login page, so nothing behind it is served to an anonymous visitor.
 *
 * The server half is imported lazily inside the `typeof window` branch, which Next
 * folds to a constant per build: `next-auth/jwt` stays out of the page's browser JS.
 */
export const withAuthInitialProps =
  (redirectIfUnauthenticated = "/login") =>
  async (context: NextPageContext): Promise<AuthInitialProps> => {
    if (typeof window === "undefined") {
      const serverAuth = await import("./serverAuth");
      return serverAuth.authenticatePageLoad(context, redirectIfUnauthenticated);
    }
    return {};
  };
