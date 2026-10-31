import { createHash } from "crypto";
import { describe, expect, it } from "vitest";

import {
  bearerChallenge,
  parseScopes,
  requestOrigin,
  sameResource,
} from "./config";
import {
  isAllowedRedirectUri,
  isLoopbackOnly,
  isValidCodeChallenge,
  redirectUriMatches,
  verifyPkce,
} from "./security";

const challengeFor = (verifier: string) =>
  createHash("sha256").update(verifier).digest("base64url");

describe("PKCE", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

  it("accepts the RFC 7636 example pair", () => {
    expect(challengeFor(verifier)).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
    expect(
      verifyPkce(verifier, "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"),
    ).toBe(true);
    expect(
      isValidCodeChallenge("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"),
    ).toBe(true);
  });

  it("rejects a wrong or malformed verifier", () => {
    expect(verifyPkce(`${verifier}x`, challengeFor(verifier))).toBe(false);
    expect(verifyPkce("short", challengeFor("short"))).toBe(false);
  });
});

describe("redirect URIs", () => {
  it("allows https and loopback http, nothing else", () => {
    expect(
      isAllowedRedirectUri("https://claude.ai/api/mcp/auth_callback"),
    ).toBe(true);
    expect(isAllowedRedirectUri("http://localhost:3118/callback")).toBe(true);
    expect(isAllowedRedirectUri("http://127.0.0.1/callback")).toBe(true);
    expect(isAllowedRedirectUri("http://evil.example/callback")).toBe(false);
    expect(isAllowedRedirectUri("myapp://callback")).toBe(false);
    expect(isAllowedRedirectUri("https://claude.ai/cb#frag")).toBe(false);
  });

  it("matches https exactly", () => {
    const registered = ["https://claude.ai/api/mcp/auth_callback"];
    expect(
      redirectUriMatches(registered, "https://claude.ai/api/mcp/auth_callback"),
    ).toBe(true);
    expect(
      redirectUriMatches(
        registered,
        "https://claude.ai/api/mcp/auth_callback/",
      ),
    ).toBe(false);
    expect(
      redirectUriMatches(
        registered,
        "https://claude.ai.evil.com/api/mcp/auth_callback",
      ),
    ).toBe(false);
  });

  it("ignores the port on loopback, for localhost and 127.0.0.1 alike", () => {
    const registered = [
      "http://localhost/callback",
      "http://127.0.0.1/callback",
    ];
    expect(
      redirectUriMatches(registered, "http://localhost:3118/callback"),
    ).toBe(true);
    expect(
      redirectUriMatches(registered, "http://127.0.0.1:50123/callback"),
    ).toBe(true);
    expect(redirectUriMatches(registered, "http://localhost:3118/other")).toBe(
      false,
    );
    expect(
      redirectUriMatches(
        ["http://localhost/callback"],
        "http://127.0.0.1:1/callback",
      ),
    ).toBe(false);
  });

  it("knows a loopback-only client", () => {
    expect(isLoopbackOnly(["http://localhost/callback"])).toBe(true);
    expect(
      isLoopbackOnly(["http://localhost/callback", "https://claude.ai/cb"]),
    ).toBe(false);
  });
});

describe("config helpers", () => {
  it("builds the origin from forwarded headers", () => {
    expect(
      requestOrigin({ host: "riff.quest", "x-forwarded-proto": "https" }),
    ).toBe("https://riff.quest");
    expect(requestOrigin({ host: "localhost:3000" })).toBe(
      "http://localhost:3000",
    );
    expect(requestOrigin(new Headers({ host: "Riff.Quest" }))).toBe(
      "https://riff.quest",
    );
  });

  it("compares resources case-blind and without a trailing slash", () => {
    expect(
      sameResource("https://riff.quest/api/mcp", "HTTPS://RIFF.QUEST/api/mcp/"),
    ).toBe(true);
    expect(
      sameResource(
        "https://riff.quest/api/mcp",
        "https://riff.quest/api/other",
      ),
    ).toBe(false);
    expect(sameResource("not a url", "not a url")).toBe(false);
  });

  it("always grants read, write only when asked", () => {
    expect(parseScopes(undefined)).toEqual(["read"]);
    expect(parseScopes("read write offline_access")).toEqual(["read", "write"]);
    expect(parseScopes("write")).toEqual(["read", "write"]);
    expect(parseScopes("admin")).toEqual(["read"]);
  });

  it("points a 401 at the protected resource metadata", () => {
    expect(bearerChallenge("https://riff.quest")).toBe(
      'Bearer resource_metadata="https://riff.quest/.well-known/oauth-protected-resource", scope="read write"',
    );
  });
});
