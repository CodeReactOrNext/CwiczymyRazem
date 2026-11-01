import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

// AI assistants are a supporter perk. These tests cover the two doors outside
// the MCP server itself: creating a personal token and approving the consent
// screen. (The server's own door is in server.test.ts and oauth/flow.test.ts.)

let profile: Record<string, unknown> | undefined;

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: {
    verifyIdToken: async (token: string) => {
      if (token !== "good-token") throw new Error("bad token");
      return { uid: "player-1" };
    },
  },
  firestore: {
    collection: () => ({
      doc: () => ({ get: async () => ({ data: () => profile }) }),
    }),
  },
}));

const createMcpToken = vi.fn(async () => ({
  token: "rq_new",
  summary: { id: "t1" },
}));
vi.mock("lib/mcp/tokens", () => ({
  createMcpToken: (...args: unknown[]) => createMcpToken(...(args as [])),
  listMcpTokens: async () => [],
  revokeMcpToken: async () => true,
  MAX_TOKENS_PER_USER: 5,
  McpTokenLimitError: class extends Error {},
}));

const decideAuthorization = vi.fn(async () => "https://claude.ai/cb?code=x");
vi.mock("lib/mcp/oauth/grants", () => ({
  listConnectedApps: async () => [],
  revokeConnectedApp: async () => true,
}));
vi.mock("lib/mcp/oauth/authorize", () => ({
  checkAuthorizationRequest: async () => ({ ok: true, request: {} }),
  describeAuthorization: () => ({}),
  decideAuthorization: (...args: unknown[]) =>
    decideAuthorization(...(args as [])),
}));

const { hasMcpAccess, MCP_SUPPORTERS_ONLY_ERROR } =
  await import("./supporterPerk");
const { default: tokensHandler } = await import("../../pages/api/mcp-tokens");
const { default: authorizeHandler } =
  await import("../../pages/api/oauth/authorize");

const call = async (
  handler: (req: NextApiRequest, res: NextApiResponse) => unknown,
  body: Record<string, unknown>,
) => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader() {
      return this;
    },
  };
  await handler(
    { method: "POST", body, headers: { host: "riff.quest" } } as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  return res;
};

describe("hasMcpAccess", () => {
  it("takes the supporter badge or the owner, nothing else", () => {
    expect(hasMcpAccess({ isSupport: true })).toBe(true);
    expect(hasMcpAccess({ role: "admin" })).toBe(true);
    expect(hasMcpAccess({ isSupport: false, role: "master" })).toBe(false);
    expect(hasMcpAccess({ isSupport: "true" })).toBe(false);
    expect(hasMcpAccess(undefined)).toBe(false);
  });
});

describe("/api/mcp-tokens", () => {
  beforeEach(() => createMcpToken.mockClear());

  it("won't create a token without the badge, but still lists", async () => {
    profile = { isSupport: false };
    const created = await call(tokensHandler, {
      idToken: "good-token",
      action: "create",
    });
    expect(created.statusCode).toBe(403);
    expect(created.body).toEqual({ error: MCP_SUPPORTERS_ONLY_ERROR });
    expect(createMcpToken).not.toHaveBeenCalled();

    const listed = await call(tokensHandler, {
      idToken: "good-token",
      action: "list",
    });
    expect(listed.statusCode).toBe(200);
    expect(listed.body).toMatchObject({ hasAccess: false });
  });

  it("creates one for a supporter", async () => {
    profile = { isSupport: true };
    const created = await call(tokensHandler, {
      idToken: "good-token",
      action: "create",
    });
    expect(created.statusCode).toBe(200);
    expect(createMcpToken).toHaveBeenCalledOnce();
  });
});

describe("/api/oauth/authorize", () => {
  beforeEach(() => decideAuthorization.mockClear());

  it("says up front whether the player may connect", async () => {
    profile = undefined;
    const res = await call(authorizeHandler, {
      action: "access",
      idToken: "good-token",
      params: {},
    });
    expect(res.body).toEqual({ hasAccess: false });
  });

  it("refuses Allow without the badge, but lets Cancel through", async () => {
    profile = { isSupport: false };
    const allowed = await call(authorizeHandler, {
      action: "decide",
      idToken: "good-token",
      approve: true,
      params: {},
    });
    expect(allowed.statusCode).toBe(403);
    expect(allowed.body).toEqual({ error: MCP_SUPPORTERS_ONLY_ERROR });

    const cancelled = await call(authorizeHandler, {
      action: "decide",
      idToken: "good-token",
      approve: false,
      params: {},
    });
    expect(cancelled.statusCode).toBe(200);
    expect(decideAuthorization).toHaveBeenCalledOnce();
  });

  it("lets a supporter allow", async () => {
    profile = { isSupport: true };
    const res = await call(authorizeHandler, {
      action: "decide",
      idToken: "good-token",
      approve: true,
      params: {},
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ redirect: "https://claude.ai/cb?code=x" });
  });
});
