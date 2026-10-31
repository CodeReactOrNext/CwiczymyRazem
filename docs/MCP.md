# MCP server

riff.quest exposes a [Model Context Protocol](https://modelcontextprotocol.io)
server so a player can connect their own AI app (Claude Code, Claude Desktop,
Cursor…) to their account. **riff.quest runs no model for it** — all reasoning
happens in the player's client; the server only reads and writes data.

## How it fits together

```
AI client ──POST JSON-RPC, Authorization: Bearer rq_…──▶ src/app/api/mcp/route.ts
                                                             │ WebStandardStreamableHTTPServerTransport
                                                             │ (stateless, JSON responses, one server per request)
                                                             ├─ lib/mcp/auth.ts      token (personal or OAuth) → { uid, scopes } + 60 req/min
                                                             ├─ lib/mcp/server.ts    tools, prompts, resource
                                                             └─ lib/mcp/tools/*      Firestore via Admin SDK, scoped to uid
```

- **No tool takes a user id.** The Admin SDK bypasses `firestore.rules`, so the
  `uid` from the token is the only access control. Keep it that way.
- Tokens: `mcpTokens/{sha256(token)}`, created in Settings → AI assistants
  (`/api/mcp-tokens`). The token is shown once; only the hash is stored. Up to 5
  per player, read-only or read + write.
- Daily write limits per player: `mcpUsage/{uid}` — 20 changes, of which 10 new
  exercises. Both collections are Admin-only (the default deny in
  `firestore.rules` covers them — no rules change).

## Tools

| Group | Tools |
| --- | --- |
| Progress (read) | `get_profile_summary`, `get_practice_history`, `get_calendar`, `get_skill_breakdown`, `get_weak_spots`, `get_goals`, `get_exercise_stats` |
| Catalog (read) | `list_exercise_taxonomy`, `list_exercises`, `get_exercise`, `list_songs`, `get_song`, `get_daily_exercise`, `get_monthly_challenge`, `search_wiki` |
| Plans (write) | `list_my_plans`, `create_practice_plan`, `update_practice_plan`, `add_song_to_list`, `set_exercise_goal` |
| Own exercises | `get_tab_format`, `validate_tablature`, `get_exercise_tablature`, `get_my_exercises`, `create_exercise`, `update_exercise` |

Prompts: `weekly_review`, `plan_next_session`, `write_exercise`.
Resource: `riffquest://docs/tab-format` (same text as `get_tab_format`).

For the Claude connector directory review (enforced in `server.test.ts`): every
tool has a `title`; read tools carry `readOnlyHint: true`, write tools
`WRITE_TOOL_ANNOTATIONS` (`destructiveHint: true`, so Claude asks before each
call). Tool descriptions and the server instructions describe what a tool
does and never tell the model how to behave. Unexpected errors come back with
the cause in plain words and a reference that matches the server log.

Deliberately left out: anything social (leaderboard, guilds, duels, chat),
publishing exercises, marking songs learned (awards points), logging practice
(points must come from real playing), roadmaps and the OpenAI-backed searches.

## Tabs

`lib/mcp/tablature/validateTablature.ts` checks a tab before it is saved:
measure length = time signature, strings 1–6 (1 = high e), frets 0–24, real note
values, one note per string per beat, then a dry run through
`tablatureToAlphaTex`. Its test runs it over every built-in exercise — a rule
that rejects a shipped exercise is the rule's fault. The guide the model reads
lives in `lib/mcp/content/tabFormat.ts`; its example is tested to pass.

The Claude skill for players is in `docs/mcp/riff-quest-tabs/SKILL.md`.

## Connecting

- **claude.ai / Claude Desktop / mobile**: Settings → Connectors → Add custom
  connector → `https://riff.quest/api/mcp`. The player signs in through OAuth.
- **Claude Code**: `claude mcp add --transport http riff-quest https://riff.quest/api/mcp`,
  then `/mcp` to sign in — or skip OAuth with a personal token:
  `--header "Authorization: Bearer rq_…"`.
- Anything else: OAuth if it supports it, a personal token in the header otherwise.

## OAuth

riff.quest is its own OAuth 2.1 authorization server, built to the
[MCP authorization spec (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
and [Claude's connector requirements](https://claude.com/docs/connectors/building/authentication).
Public clients only — PKCE is the proof, there are no client secrets.

```
client ──POST /api/mcp (no token)──▶ 401  WWW-Authenticate: Bearer resource_metadata="…/.well-known/oauth-protected-resource"
       ──GET  /.well-known/oauth-protected-resource──▶ { resource: …/api/mcp, authorization_servers: [origin] }
       ──GET  /.well-known/oauth-authorization-server──▶ endpoints, S256, CIMD + DCR, auth method none
       ── client_id = its metadata URL (CIMD)   or   POST /api/oauth/register (DCR)
browser──GET  /oauth/authorize?…──▶ consent screen (login if needed) ──▶ redirect_uri?code=…&state=…&iss=…
       ──POST /api/oauth/token (form) code + code_verifier──▶ access (1 h) + refresh (90 d) token
       ──POST /api/mcp  Authorization: Bearer rq_…  (same check as personal tokens + expiry + audience)
```

| Piece | Where |
| --- | --- |
| Metadata | `src/app/.well-known/*/route.ts`, built in `lib/mcp/oauth/config.ts` from the request origin (works on previews and localhost) |
| Clients | `lib/mcp/oauth/clients.ts` — CIMD fetched with an SSRF guard (https, default port, DNS name resolving only to public IPs, 5 s, 64 KB) and cached 1 h; DCR stored as `rqc_…` |
| Consent | `/oauth/authorize` (`feature/settings/components/OAuthConsentView.tsx`) + `/api/oauth/authorize` — the request is checked on `describe` and again on `decide`; the redirect host is always shown, with a warning for loopback-only clients |
| Codes & tokens | `lib/mcp/oauth/grants.ts` — one-time codes (5 min), access tokens in `mcpTokens` with `grantId` / `expiresAt` / `resource`, refresh tokens rotated on every use; a reused refresh token revokes the whole grant |
| Settings | Settings → AI assistants lists connected apps; Disconnect kills their tokens at once |

Redirect URIs: exact match, except loopback (`localhost`, `127.0.0.1`), where
the port is ignored — Claude Code listens on a fresh port each session. The
hosted Claude apps use `https://claude.ai/api/mcp/auth_callback`.

New collections, all Admin SDK only and covered by the default deny in
`firestore.rules`: `oauthClients`, `oauthCodes`, `oauthGrants`,
`oauthRefreshTokens`, `oauthRateLimits`. No env variables. Expired codes and
spent refresh tokens stay behind; a Firestore TTL policy on `expiresAt` for
`oauthCodes` and `oauthRefreshTokens` would clean them up.

A player who has to sign in on the consent screen is sent back to it after
login (`lib/mcp/oauth/postLoginRedirect.ts`, read in the login thunk).

Tests: `lib/mcp/oauth/flow.test.ts` runs the whole flow on an in-memory
Firestore (DCR and CIMD, PKCE, code reuse, refresh rotation and reuse
detection, disconnect, audience and expiry); `security.test.ts` the helpers.
To try it by hand: `npx @modelcontextprotocol/inspector`, point it at
`http://localhost:3000/api/mcp` and pick OAuth.
