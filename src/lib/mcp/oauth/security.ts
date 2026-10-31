import { createHash, randomBytes, timingSafeEqual } from "crypto";

/** A random opaque secret — codes, access and refresh tokens. Only its hash is stored. */
export const randomSecret = (prefix: string) =>
  `${prefix}${randomBytes(32).toString("base64url")}`;

export const sha256Hex = (value: string) =>
  createHash("sha256").update(value).digest("hex");

/** PKCE S256: base64url(sha256(verifier)) must equal the challenge sent to /authorize. */
export const verifyPkce = (verifier: string, challenge: string) => {
  // RFC 7636 §4.1: 43–128 characters from the unreserved set.
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false;
  const computed = Buffer.from(
    createHash("sha256").update(verifier).digest("base64url"),
  );
  const expected = Buffer.from(challenge);
  return (
    computed.length === expected.length && timingSafeEqual(computed, expected)
  );
};

export const isValidCodeChallenge = (challenge: string) =>
  /^[A-Za-z0-9\-_]{43}$/.test(challenge);

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const parse = (uri: string) => {
  try {
    return new URL(uri);
  } catch {
    return null;
  }
};

const isLoopback = (url: URL) =>
  url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);

/**
 * Whether a client may register this redirect URI at all: https anywhere, or
 * http on a loopback address for native apps (RFC 8252). No fragments, and no
 * custom schemes — an app scheme can be claimed by any app on the device.
 */
export const isAllowedRedirectUri = (uri: string) => {
  const url = parse(uri);
  if (!url || url.hash || uri.length > 500) return false;
  return url.protocol === "https:" || isLoopback(url);
};

/**
 * Whether the redirect URI on an authorization request is one the client
 * registered. Exact match, except loopback URIs, where the port is ignored:
 * Claude Code and other native clients listen on a fresh port every session
 * (RFC 8252 §7.3), for `localhost` as well as `127.0.0.1`.
 */
export const redirectUriMatches = (
  registered: readonly string[],
  requested: string,
) => {
  const target = parse(requested);
  if (!target || !isAllowedRedirectUri(requested)) return false;
  return registered.some((candidate) => {
    if (candidate === requested) return true;
    const url = parse(candidate);
    if (!url || !isLoopback(url) || !isLoopback(target)) return false;
    return (
      url.hostname === target.hostname &&
      url.pathname === target.pathname &&
      url.search === target.search
    );
  });
};

/** Only loopback redirects — anything on the device could be listening, worth saying on the consent screen. */
export const isLoopbackOnly = (uris: readonly string[]) =>
  uris.length > 0 &&
  uris.every((uri) => {
    const url = parse(uri);
    return !!url && isLoopback(url);
  });
