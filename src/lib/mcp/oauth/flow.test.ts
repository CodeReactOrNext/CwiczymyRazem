import { createHash, randomBytes } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- An in-memory Firestore, just enough of the Admin API for the OAuth code ---
// Document, query and collection refs hand out each other, so they can't all
// be defined before first use.
/* eslint-disable @typescript-eslint/no-use-before-define */

type Data = Record<string, unknown>;
const store = new Map<string, Data>();
let autoId = 0;

/** Copies plain objects and arrays; class instances (Timestamps) are kept as they are. */
const copy = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(copy) as T;
  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, field]) => [key, copy(field)]),
    ) as T;
  }
  return value;
};

const snapshot = (path: string) => {
  const data = store.get(path);
  return {
    id: path.split("/").pop()!,
    exists: data !== undefined,
    data: () => (data ? copy(data) : undefined),
    ref: docRef(path),
  };
};

function docRef(path: string) {
  return {
    id: path.split("/").pop()!,
    path,
    get: async () => snapshot(path),
    set: async (data: Data) => void store.set(path, copy(data)),
    update: async (data: Data) =>
      void store.set(path, { ...store.get(path), ...copy(data) }),
    delete: async () => void store.delete(path),
    collection: (name: string) => collectionRef(`${path}/${name}`),
  };
}

function query(path: string, filters: [string, unknown][]) {
  return {
    where: (field: string, _op: "==", value: unknown) =>
      query(path, [...filters, [field, value]]),
    get: async () => {
      const docs = Array.from(store.keys())
        .filter(
          (key) =>
            key.startsWith(`${path}/`) &&
            !key.slice(path.length + 1).includes("/"),
        )
        .filter((key) =>
          filters.every(
            ([field, value]) => (store.get(key)![field] ?? null) === value,
          ),
        )
        .map(snapshot);
      return { docs, size: docs.length };
    },
  };
}

function collectionRef(path: string) {
  return {
    ...query(path, []),
    doc: (id?: string) => docRef(`${path}/${id ?? `auto${++autoId}`}`),
    add: async (data: Data) => {
      const ref = docRef(`${path}/auto${++autoId}`);
      await ref.set(data);
      return ref;
    },
  };
}

type Ref = ReturnType<typeof docRef>;

const fakeFirestore = {
  collection: collectionRef,
  // Reads go straight through; writes wait for the callback to return, and a
  // throw discards them — the part of a transaction the code relies on.
  runTransaction: async <T>(body: (transaction: unknown) => Promise<T>) => {
    const writes: (() => Promise<void>)[] = [];
    const transaction = {
      get: (ref: Ref) => ref.get(),
      set: (ref: Ref, data: Data) => void writes.push(() => ref.set(data)),
      update: (ref: Ref, data: Data) =>
        void writes.push(() => ref.update(data)),
      delete: (ref: Ref) => void writes.push(() => ref.delete()),
    };
    const result = await body(transaction);
    for (const write of writes) await write();
    return result;
  },
};

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: fakeFirestore,
  auth: {},
}));
vi.mock("dns/promises", () => ({
  lookup: vi.fn(async (host: string) =>
    host === "internal.example"
      ? [{ address: "10.0.0.5", family: 4 }]
      : [{ address: "160.79.104.10", family: 4 }],
  ),
}));

const { authenticateMcpRequest } = await import("../auth");
const {
  checkAuthorizationRequest,
  decideAuthorization,
  describeAuthorization,
} = await import("./authorize");
const { registerClient, resolveClient } = await import("./clients");
const {
  exchangeAuthorizationCode,
  listConnectedApps,
  refreshAccessToken,
  revokeConnectedApp,
} = await import("./grants");

const ORIGIN = "https://riff.quest";
const pkcePair = () => {
  const verifier = randomBytes(32).toString("base64url");
  return {
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
  };
};

const mcpRequest = (token: string, origin = ORIGIN) =>
  new Request(`${origin}/api/mcp`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      host: new URL(origin).host,
      "x-forwarded-proto": "https",
    },
  });

/** Runs consent → code → tokens for a client, as claude.ai would. */
async function connect(
  clientId: string,
  redirectUri: string,
  scope = "read write offline_access",
  allowWrite = true,
) {
  const { verifier, challenge } = pkcePair();
  const check = await checkAuthorizationRequest(
    {
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: challenge,
      code_challenge_method: "S256",
      scope,
      state: "xyz",
      resource: `${ORIGIN}/api/mcp`,
    },
    ORIGIN,
  );
  if (!check.ok) throw new Error(JSON.stringify(check));
  const redirect = new URL(
    await decideAuthorization(
      check.request,
      { uid: "player-1", approve: true, allowWrite },
      ORIGIN,
    ),
  );
  expect(redirect.searchParams.get("state")).toBe("xyz");
  expect(redirect.searchParams.get("iss")).toBe(ORIGIN);
  const code = redirect.searchParams.get("code")!;
  const tokens = await exchangeAuthorizationCode({
    code,
    clientId,
    redirectUri,
    codeVerifier: verifier,
    resource: `${ORIGIN}/api/mcp`,
  });
  return { tokens, code, verifier, check };
}

beforeEach(() => {
  store.clear();
});

describe("OAuth flow, as claude.ai runs it", () => {
  it("registers a client, gets consent, issues tokens the MCP server accepts", async () => {
    const client = await registerClient({
      client_name: "Claude",
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    expect(client.token_endpoint_auth_method).toBe("none");

    const { tokens, check } = await connect(
      client.client_id,
      "https://claude.ai/api/mcp/auth_callback",
    );
    expect(describeAuthorization(check.request)).toMatchObject({
      clientName: "Claude",
      redirectHost: "claude.ai",
      loopback: false,
      scopes: ["read", "write"],
    });
    expect(tokens).toMatchObject({
      token_type: "Bearer",
      expires_in: 3600,
      scope: "read write",
    });

    const auth = await authenticateMcpRequest(mcpRequest(tokens.access_token));
    expect(auth).toMatchObject({
      ok: true,
      context: { uid: "player-1", scopes: ["read", "write"] },
    });

    const apps = await listConnectedApps("player-1");
    expect(apps).toHaveLength(1);
    expect(apps[0]).toMatchObject({
      name: "Claude",
      redirectHost: "claude.ai",
    });
  });

  it("spends a code once and checks PKCE, client and redirect", async () => {
    const client = await registerClient({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const { code, verifier } = await connect(
      client.client_id,
      "https://claude.ai/api/mcp/auth_callback",
    );
    await expect(
      exchangeAuthorizationCode({
        code,
        clientId: client.client_id,
        redirectUri: "https://claude.ai/api/mcp/auth_callback",
        codeVerifier: verifier,
      }),
    ).rejects.toMatchObject({ code: "invalid_grant" });

    // a fresh code with the wrong verifier is refused — and spent all the same
    const { challenge } = pkcePair();
    const check = await checkAuthorizationRequest(
      {
        response_type: "code",
        client_id: client.client_id,
        redirect_uri: "https://claude.ai/api/mcp/auth_callback",
        code_challenge: challenge,
        code_challenge_method: "S256",
      },
      ORIGIN,
    );
    if (!check.ok) throw new Error("check failed");
    const second = new URL(
      await decideAuthorization(
        check.request,
        { uid: "player-1", approve: true, allowWrite: false },
        ORIGIN,
      ),
    ).searchParams.get("code")!;
    const attempt = {
      code: second,
      clientId: client.client_id,
      redirectUri: "https://claude.ai/api/mcp/auth_callback",
      codeVerifier: pkcePair().verifier,
    };
    await expect(exchangeAuthorizationCode(attempt)).rejects.toMatchObject({
      code: "invalid_grant",
    });
    await expect(
      exchangeAuthorizationCode({ ...attempt, codeVerifier: verifier }),
    ).rejects.toThrow(/already used/);
  });

  it("rotates refresh tokens and revokes the grant when an old one comes back", async () => {
    const client = await registerClient({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const { tokens } = await connect(
      client.client_id,
      "https://claude.ai/api/mcp/auth_callback",
    );

    const next = await refreshAccessToken({
      refreshToken: tokens.refresh_token,
      clientId: client.client_id,
    });
    expect(next.refresh_token).not.toBe(tokens.refresh_token);
    expect(
      (await authenticateMcpRequest(mcpRequest(tokens.access_token))).ok,
    ).toBe(false);
    expect(
      (await authenticateMcpRequest(mcpRequest(next.access_token))).ok,
    ).toBe(true);

    // the spent one again: someone else has it — everything goes
    await expect(
      refreshAccessToken({
        refreshToken: tokens.refresh_token,
        clientId: client.client_id,
      }),
    ).rejects.toMatchObject({ code: "invalid_grant" });
    expect(
      (await authenticateMcpRequest(mcpRequest(next.access_token))).ok,
    ).toBe(false);
    await expect(
      refreshAccessToken({
        refreshToken: next.refresh_token,
        clientId: client.client_id,
      }),
    ).rejects.toMatchObject({ code: "invalid_grant" });
    expect(await listConnectedApps("player-1")).toEqual([]);
  });

  it("disconnecting an app kills its tokens at once", async () => {
    const client = await registerClient({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const { tokens } = await connect(
      client.client_id,
      "https://claude.ai/api/mcp/auth_callback",
    );
    const [app] = await listConnectedApps("player-1");

    expect(await revokeConnectedApp("someone-else", app.id)).toBe(false);
    expect(await revokeConnectedApp("player-1", app.id)).toBe(true);
    expect(
      (await authenticateMcpRequest(mcpRequest(tokens.access_token))).ok,
    ).toBe(false);
  });

  it("grants read only when the player switches writes off", async () => {
    const client = await registerClient({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const { tokens } = await connect(
      client.client_id,
      "https://claude.ai/api/mcp/auth_callback",
      "read write",
      false,
    );
    expect(tokens.scope).toBe("read");
  });

  it("refuses an access token bound to another server", async () => {
    const client = await registerClient({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const { tokens } = await connect(
      client.client_id,
      "https://claude.ai/api/mcp/auth_callback",
    );
    const elsewhere = await authenticateMcpRequest(
      mcpRequest(tokens.access_token, "https://evil.example"),
    );
    expect(elsewhere).toMatchObject({ ok: false, status: 401 });
  });

  it("refuses an expired access token", async () => {
    const client = await registerClient({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const { tokens } = await connect(
      client.client_id,
      "https://claude.ai/api/mcp/auth_callback",
    );
    const later = new Date(Date.now() + 2 * 60 * 60 * 1000);
    expect(
      await authenticateMcpRequest(mcpRequest(tokens.access_token), later),
    ).toMatchObject({
      ok: false,
      error: "Token expired",
    });
  });
});

describe("authorization request checks", () => {
  it("never redirects to an unregistered redirect URI", async () => {
    const client = await registerClient({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const check = await checkAuthorizationRequest(
      {
        response_type: "code",
        client_id: client.client_id,
        redirect_uri: "https://evil.example/cb",
        code_challenge: pkcePair().challenge,
        code_challenge_method: "S256",
      },
      ORIGIN,
    );
    expect(check).toMatchObject({ ok: false, fatal: true });
  });

  it("sends a missing PKCE back to the client as invalid_request", async () => {
    const client = await registerClient({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const check = await checkAuthorizationRequest(
      { response_type: "code", client_id: client.client_id, state: "s1" },
      ORIGIN,
    );
    if (check.ok || check.fatal) throw new Error("expected a redirect");
    const url = new URL(check.redirect);
    expect(url.searchParams.get("error")).toBe("invalid_request");
    expect(url.searchParams.get("state")).toBe("s1");
  });

  it("refuses a resource that isn't this server", async () => {
    const client = await registerClient({
      redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    });
    const check = await checkAuthorizationRequest(
      {
        response_type: "code",
        client_id: client.client_id,
        code_challenge: pkcePair().challenge,
        code_challenge_method: "S256",
        resource: "https://other.example/mcp",
      },
      ORIGIN,
    );
    if (check.ok || check.fatal) throw new Error("expected a redirect");
    expect(new URL(check.redirect).searchParams.get("error")).toBe(
      "invalid_target",
    );
  });

  it("rejects registrations with unsafe redirect URIs or a client secret", async () => {
    await expect(
      registerClient({ redirect_uris: ["http://evil.example/cb"] }),
    ).rejects.toThrow(/https/);
    await expect(registerClient({ redirect_uris: [] })).rejects.toThrow(
      /non-empty/,
    );
    await expect(
      registerClient({
        redirect_uris: ["https://a.example/cb"],
        token_endpoint_auth_method: "client_secret_basic",
      }),
    ).rejects.toThrow(/none/);
  });
});

describe("Client ID Metadata Documents", () => {
  const CLAUDE_CODE = "https://claude.ai/oauth/claude-code-client-metadata";

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: string) =>
          new Response(
            JSON.stringify({
              client_id: url,
              client_name: "Claude Code",
              redirect_uris: [
                "http://localhost/callback",
                "http://127.0.0.1/callback",
              ],
              token_endpoint_auth_method: "none",
            }),
            { status: 200 },
          ),
      ),
    );
  });

  it("fetches, validates and caches the document, and matches loopback on any port", async () => {
    const client = await resolveClient(CLAUDE_CODE);
    expect(client).toMatchObject({ kind: "cimd", name: "Claude Code" });
    await resolveClient(CLAUDE_CODE);
    expect(fetch).toHaveBeenCalledTimes(1);

    const { tokens, check } = await connect(
      CLAUDE_CODE,
      "http://localhost:51234/callback",
    );
    expect(describeAuthorization(check.request)).toMatchObject({
      loopback: true,
      clientHost: "claude.ai",
    });
    expect(tokens.access_token).toMatch(/^rq_/);
  });

  it("won't fetch a client_id on a private network", async () => {
    await expect(
      resolveClient("https://internal.example/client.json"),
    ).rejects.toThrow(/public address/);
    await expect(
      resolveClient("https://127.0.0.1/client.json"),
    ).rejects.toThrow(/public host/);
    // not https, so not a CIMD id — and no registered client has it either
    await expect(resolveClient("http://claude.ai/client.json")).rejects.toThrow(
      /unknown client_id/,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a document whose client_id isn't its own URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          client_id: "https://other.example/x",
          redirect_uris: ["https://a.example/cb"],
        }),
      ),
    );
    await expect(
      resolveClient("https://claude.ai/fake-metadata"),
    ).rejects.toThrow(/doesn't match/);
  });
});
