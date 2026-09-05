/**
 * Where to send someone after they sign in or sign up, when the link that
 * brought them in asked for somewhere specific — a song card in the public
 * library, say, so the song they picked isn't lost at the sign-up form.
 *
 * Only same-origin paths are honoured. `//evil.com` and `/\evil.com` are read by
 * browsers as protocol-relative URLs, so they are rejected along with anything
 * that isn't a plain absolute path.
 */
export const safeNextPath = (
  value: unknown,
  fallback = "/dashboard"
): string => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return fallback;

  const path = raw.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
  // Whitespace and control characters can smuggle a second URL past a check
  // like this one once the browser normalises them away.
  if (/\s/.test(path) || [...path].some((char) => char.charCodeAt(0) < 0x20)) {
    return fallback;
  }

  return path;
};
