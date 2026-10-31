/**
 * Brings a player who had to sign in mid-OAuth back to the consent screen.
 *
 * /oauth/authorize stores its own URL here before sending them to /login, and
 * the login thunk asks for it instead of going to the dashboard. Only a path
 * on the consent screen is ever returned, and only for a few minutes — this is
 * not a general "return to" that could be pointed anywhere.
 */
const KEY = "riffquest.oauth.returnTo";
const MAX_AGE_MS = 15 * 60 * 1000;
const ALLOWED_PREFIX = "/oauth/authorize?";

export const rememberOAuthReturn = (path: string) => {
  if (!path.startsWith(ALLOWED_PREFIX)) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    // private mode: the player just lands on the dashboard and reconnects
  }
};

/** The stored consent URL, once — or null. */
export const takeOAuthReturn = (now = Date.now()): string | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof path !== "string" || !path.startsWith(ALLOWED_PREFIX))
      return null;
    if (typeof at !== "number" || now - at > MAX_AGE_MS) return null;
    return path;
  } catch {
    return null;
  }
};
