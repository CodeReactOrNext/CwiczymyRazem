/**
 * The secret the session JWT is signed with.
 *
 * Shared deliberately: `[...nextauth]` signs the cookie with it and `withAuth` verifies
 * the cookie with it. If the two ever disagree, every request reads as logged out and
 * nothing errors — so the development fallback lives in exactly one place.
 */
export const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "development-secret-change-me";
