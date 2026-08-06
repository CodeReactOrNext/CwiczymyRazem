/**
 * Turns a `returnTo`-style query param into a path that is safe to `router.push`.
 *
 * Only same-origin paths are honoured — anything else (an absolute URL, a
 * protocol-relative "//evil.com") falls back, so a crafted link cannot bounce
 * the user off-site.
 */
export const resolveInternalPath = (
  value: string | string[] | undefined,
  fallback: string
): string => {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) return fallback;
  // "//evil.com" and "/\evil.com" are protocol-relative URLs, not local paths.
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return fallback;
  }

  return candidate;
};
