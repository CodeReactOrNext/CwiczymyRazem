import type * as McpAuth from "lib/mcp/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: { collection: vi.fn() },
  auth: {},
}));

const authenticate = vi.fn();
vi.mock("lib/mcp/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof McpAuth>()),
  authenticateMcpRequest: (request: Request) => authenticate(request),
}));

import { GET, POST } from "./route";

const rpc = (method: string, params: Record<string, unknown> = {}, id = 1) =>
  new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: "Bearer rq_test",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });

const initialize = rpc("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "test", version: "1.0.0" },
});

describe("POST /api/mcp", () => {
  beforeEach(() => {
    authenticate.mockResolvedValue({
      ok: true,
      context: { uid: "player-1", tokenId: "t", scopes: ["read"] },
    });
  });

  it("answers initialize with the server's name and instructions", async () => {
    const response = await POST(initialize);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.result.serverInfo.name).toBe("riff-quest");
    expect(body.result.instructions).toMatch(/one signed-in player/);
    expect(response.headers.get("mcp-session-id")).toBeNull();
  });

  it("lists the tools and runs one, statelessly, request by request", async () => {
    const list = await (await POST(rpc("tools/list"))).json();
    expect(list.result.tools.length).toBe(26);

    const call = await (
      await POST(
        rpc(
          "tools/call",
          { name: "list_exercises", arguments: { text: "legato", limit: 3 } },
          2,
        ),
      )
    ).json();
    const data = JSON.parse(call.result.content[0].text);
    expect(data.exercises.length).toBeGreaterThan(0);
  });

  it("is a 401 with a Bearer challenge without a valid token", async () => {
    authenticate.mockResolvedValue({
      ok: false,
      status: 401,
      error: "Unknown or revoked token",
    });
    const response = await POST(rpc("tools/list"));
    expect(response.status).toBe(401);
    // what makes claude.ai start the sign-in: a pointer to the OAuth metadata
    expect(response.headers.get("www-authenticate")).toBe(
      'Bearer resource_metadata="http://localhost/.well-known/oauth-protected-resource", scope="read write", error="invalid_token"',
    );
  });

  it("is a 429 with Retry-After over the rate limit", async () => {
    authenticate.mockResolvedValue({
      ok: false,
      status: 429,
      error: "Too many requests",
    });
    const response = await POST(rpc("tools/list"));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("has no event stream to GET, but challenges a GET without a token", async () => {
    expect((await GET(rpc("tools/list"))).status).toBe(405);
    const anonymous = await GET(new Request("http://localhost/api/mcp"));
    expect(anonymous.status).toBe(401);
    expect(anonymous.headers.get("www-authenticate")).not.toMatch(/error=/);
  });
});
