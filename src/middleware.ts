import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * `skipTrailingSlashRedirect: true` in next.config.js exists for one reason:
 * PostHog's proxied API calls under /ingest arrive with a trailing slash and
 * must not be redirected. The flag is global, though, so it also switched off
 * Next's own /about/ -> /about redirect for the whole site — every page became
 * reachable at two URLs (SEO audit 2026-09-16). Canonical tags papered over it
 * on the marketing pages; the app pages have no canonical at all.
 *
 * This restores the redirect everywhere except the paths that need the slash.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/" || !pathname.endsWith("/")) {
    return NextResponse.next();
  }

  // clone() carries the query string over, so ?utm_source survives the hop.
  const url = request.nextUrl.clone();
  url.pathname = pathname.replace(/\/+$/, "");
  return NextResponse.redirect(url, 308);
}

export const config = {
  /**
   * Everything except the PostHog proxy, API routes, Next's own assets and
   * files with an extension (a trailing slash there is not a page URL).
   */
  matcher: ["/((?!ingest|api|_next|monitoring|.*\\.).*)"],
};
