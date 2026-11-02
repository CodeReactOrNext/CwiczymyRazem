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
                                                             ├─ lib/mcp/tools/*      Firestore via Admin SDK, scoped to uid
                                                             ├─ lib/mcp/data.ts      reads the tool groups share (user, own exercise, skills, days)
                                                             └─ lib/mcp/results.ts   answers, annotations, paging, size limit, errors
```

The rate limit is per player, not per token (`withinRequestLimit` in
`auth.ts`): one doc per player and minute, `mcpRateLimits/{uid}_{minute}`,
counted in a transaction. A plain read-then-increment let parallel requests
all read the same count and pass; a burst so dense the transaction gives up
retrying counts as over the limit. Per player, so connecting the same account
again and again doesn't multiply it.

- **No tool takes a user id.** The Admin SDK bypasses `firestore.rules`, so the
  `uid` from the token is the only access control. Keep it that way.
- **Supporters only** (`lib/mcp/supporter.ts`, constants in `supporterPerk.ts`):
  the `isSupport` badge (or `role: "admin"`) is the ticket. Three doors check
  it on the server: approving the consent screen (`/api/oauth/authorize`
  `decide`, plus an `access` action so the screen can say so up front),
  creating a personal token (`/api/mcp-tokens` `create`), and every MCP
  request (`authenticateMcpRequest`): without the badge every MCP request,
  `initialize` and `tools/list` included, is a 403 whose JSON-RPC error
  carries the perk notice — no `WWW-Authenticate`, since signing in again
  wouldn't help. The badge is re-read on every request, so losing it ends
  access at once. Listing, revoking and disconnecting stay open for lapsed
  supporters. The directory reviewers' test account needs the badge.
- **Origin check** (DNS rebinding, required by the MCP transport spec): a
  browser's `Origin` must be `https://riff.quest` / `https://www.riff.quest`,
  or a localhost / `*.vercel.app` origin equal to the request's own; anything
  else gets a 403 before the token is looked at. Comparing with the Host
  header alone wouldn't stop rebinding (both carry the attacker's name).
  Server-side clients send no `Origin` and pass.
- **Deleting a player's account by hand** (the privacy policy promises it on
  request): their MCP data is keyed by token hash, not under `users/{uid}`.
  Delete by `uid` from `mcpTokens`, `oauthGrants`, `oauthRefreshTokens`,
  `oauthCodes`, plus the doc `mcpUsage/{uid}`.
- Tokens: `mcpTokens/{sha256(token)}`, created in Settings → AI assistants
  (`/api/mcp-tokens`). The token is shown once; only the hash is stored. Up to 5
  per player, read-only or read + write, each valid for a year. Creating one
  (and approving the consent screen) verifies the Firebase id token with
  `checkRevoked`, so an ended session can't mint access that outlives it.
- Daily write limits per player: `mcpUsage/{uid}` — 20 changes, of which 10 new
  exercises. Every write answer carries `changesLeftToday` and
  `newExercisesLeftToday` (`countWrite` in `auth.ts`), so a client knows before
  it hits the limit. Both collections are Admin-only (the default deny in
  `firestore.rules` covers them — no rules change).

## Tools

Every tool name starts with `riffquest_`, so it can't clash with another
server's `list_exercises` or `get_goals` in clients that don't namespace tools
per server.

| Group | Tools |
| --- | --- |
| Progress (read) | `riffquest_get_profile_summary`, `riffquest_get_practice_history`, `riffquest_get_calendar`, `riffquest_get_skill_breakdown`, `riffquest_get_weak_spots`, `riffquest_get_goals`, `riffquest_get_exercise_stats`, `riffquest_get_recent_runs` |
| Catalog (read) | `riffquest_list_exercise_taxonomy`, `riffquest_list_exercises`, `riffquest_get_exercise`, `riffquest_list_songs`, `riffquest_get_song`, `riffquest_get_daily_exercise`, `riffquest_get_monthly_challenge`, `riffquest_search_wiki` |
| Plans (write) | `riffquest_list_my_plans`, `riffquest_create_practice_plan`, `riffquest_update_practice_plan`, `riffquest_add_song_to_list`, `riffquest_set_exercise_goal` |
| Own exercises | `riffquest_get_tab_format`, `riffquest_validate_tablature`, `riffquest_preview_tab`, `riffquest_get_exercise_tablature`, `riffquest_get_my_exercises`, `riffquest_create_exercise`, `riffquest_update_exercise` |

Prompts: `weekly_review`, `plan_next_session`, `write_exercise`.
Resource: `riffquest://docs/tab-format` (same text as `riffquest_get_tab_format`).

For the Claude connector directory review (enforced in `server.test.ts`): every
tool has a `title` and all four annotations spelled out (a missing
`openWorldHint` reads as `true`). Read tools use `READ_TOOL_ANNOTATIONS`, writes
`WRITE_TOOL_ANNOTATIONS` (`destructiveHint: true`, so Claude asks before each
call), or `IDEMPOTENT_WRITE_TOOL_ANNOTATIONS` for the four that leave the
account as it was when repeated. Tool descriptions and the server instructions
describe what a tool does and never tell the model how to behave — only the
prompts, which the player starts, ask for anything. Unexpected errors come back
with the cause in plain words and a reference that matches the server log.

How tools answer (`results.ts`, all tested):

- **Strict input** (`strictInput`): an argument a tool doesn't take is an error,
  not silently dropped — a misspelt filter would come back as unfiltered results.
- **Structured output**: every answer is JSON text plus the same object as
  `structuredContent`. The Firestore-free tools also declare an `outputSchema`
  (`get_exercise`, `list_exercises`, `list_exercise_taxonomy`,
  `get_daily_exercise`, `search_wiki`, `validate_tablature`); the SDK checks
  every answer against it, so `server.test.ts` fits every library exercise in.
- **Paging**: lists take `offset` / `limit` and answer `total`, `hasMore`,
  `nextOffset` (`pageOf`).
- **Size**: an answer over 25 000 characters is cut from the end and says how to
  get the rest (`fittedResult`) — long histories, long tabs. The tool list
  itself goes into every conversation, so `server.test.ts` holds it to a budget
  (35 000 characters; 33 600 now): descriptions say what a tool does in a line,
  limits that apply to every write live once in the server instructions, and
  `outputSchema` isn't repeated (`get_daily_exercise` answers in
  `get_exercise`'s shape without declaring it again).
- **Recent runs** (`get_recent_runs`): every run scored with the mic is kept
  under its exercise (`users/{uid}/exerciseRuns/{exerciseId}/runs`, the last 30
  — `RUN_HISTORY_LIMIT`), with no player or exercise field to query across
  them. Each saved run stamps its exercise in `users/{uid}/settings/runHistory`
  (`exercises.{id}`: `title`, `lastRunAt`, `count`), so the tool reads that one
  doc to find the recently played exercises, then reads each one's runs (at
  most 25 exercises, one query each). Runs saved before the index existed are
  still found the old way: the rotation doc's `lastPracticed.exercise` stamps
  and the open goals.
- **Clean runs**: a run carries `clean` when a goal judged it — every goal-mode
  run, and a run played anywhere else that lasted the exercise's full time at
  the goal's milestone tempo or faster (`takesPracticeRun`). Other runs have
  `clean: null`.
- **Days** in history, calendar and weak spots are the player's own days, in
  `statistics.timeZone` from the profile; a `timeZone` argument overrides it.
- **ChatGPT**: OpenAI's function calling refuses `"items": [ … ]` (a tuple) in an
  input schema and ChatGPT then hides the whole tool — that is what once hid
  every tab tool there. A test keeps tuples out of every input schema.

Deliberately left out: anything social (leaderboard, guilds, duels, chat),
publishing exercises, marking songs learned (awards points), logging practice
(points must come from real playing), roadmaps and the OpenAI-backed searches.

## Tabs

Clients don't see the app's `TablatureMeasure`. They read and write the format
in `lib/mcp/tablature/tabJson.ts`, which names things the way musicians do:

```json
{ "timeSignature": "4/4", "measures": [ { "beats": [
  { "duration": "eighth", "pick": "down", "notes": [{ "string": 3, "fret": 5 }] },
  { "duration": "eighth", "notes": [{ "string": 3, "fret": 7, "techniques": ["hammer-on"] }] },
  { "duration": "quarter", "dots": 1, "notes": [{ "string": 2, "fret": 8, "bend": { "semitones": 2 } }] },
  { "duration": "eighth", "rest": true },
  { "duration": "half", "chord": "C", "notes": [ … ] } ] } ] }
```

`tabToMeasures` / `measuresToTab` map it to the stored form and back; the test
carries every library tab there and back without changing what's played.
What the format has no words for (`midiNote`, bend curves, loop-only measures)
stays out of what clients read. `renderAsciiTab` draws the plain-text tab every
tab tool returns as `asciiTab` — what the player sees instead of the JSON.

`lib/mcp/tablature/validateTablature.ts` checks a tab before it is saved:
measure length = time signature, strings 1–6 (1 = high e), frets 0–24, real note
values, one note per string per beat, then a dry run through
`tablatureToAlphaTex`. Its test runs it over every built-in exercise — a rule
that rejects a shipped exercise is the rule's fault. The guide the model reads
lives in `lib/mcp/content/tabFormat.ts`; its example is tested to pass.

`riffquest_preview_tab` is an MCP App (`lib/mcp/apps/tabPreview.ts`): the
practice session's tab board in its default look, with notation one tab away.
The board is the session's own `TablatureViewer.worker`, run on the page's
thread and bundled with a small driver (`lib/mcp/apps/tabBoard/`) into
`lib/mcp/apps/generated/tabBoardBundle.ts` by `node scripts/buildMcpTabBoard.mjs`
— rerun it after touching the worker or the board; `tabBoardBundle.test.ts`
fails while the committed bundle is stale. AlphaTab draws the notation and
plays the sound for both views; the board's cursor follows its player. Every
file the view loads comes from riff.quest itself, never a public CDN (the
directory policy requires owning every resource the UI fetches):
`public/alphatab/`, `public/soundfont/` and `public/mcp-app/ext-apps-<version>.js`,
sent with CORS by `next.config.js`. After bumping `@coderline/alphatab` or
`@modelcontextprotocol/ext-apps`, copy the new dist files there and update the
versions in `tabPreviewHtml.ts` — `tabPreviewAssets.test.ts` fails until the
copies match npm byte for byte. The model gets only the check and the `asciiTab`; the board's data and
the alphaTex go in `structuredContent` for the view.

## Talking to players

Players are guitarists. The server instructions say that tabs travel as JSON and
players read them as `asciiTab`; the prompts ask for no JSON, tool or field
names. Two Claude skills go further — `docs/mcp/riff-quest-coach/SKILL.md`
(how to talk about practice) and `docs/mcp/riff-quest-tabs/SKILL.md` (writing
exercises). Skills only reach Claude, and only when the player adds them; every
other client gets the instructions, descriptions, prompts and tool answers.

The wiki text `riffquest_search_wiki` returns keeps the words inside wiki
components (`FaqList`, `ProgressLadder`, `StepList`…): that is where the
numbers players ask about live.

## Evaluation

`docs/mcp/evals/riff-quest.xml` — 10 read-only questions a model answers with
the tools alone (library, wiki and tab tools, same answer for every account).
`lib/mcp/evals.test.ts` solves each one through the tools and fails when an
answer in the file no longer holds. To score a model on them, use
`scripts/evaluation.py` from the mcp-builder skill against a running server
with a personal token; it calls the Anthropic API, so it needs
`ANTHROPIC_API_KEY` in your shell (local only — nothing in hosting):

```
python .agents/skills/mcp-builder/scripts/evaluation.py docs/mcp/evals/riff-quest.xml \
  -t http -u http://localhost:3000/api/mcp -H "Authorization: Bearer rq_…" \
  -m claude-sonnet-5-5
```

## Connecting

- **claude.ai / Claude Desktop / mobile**: Settings → Connectors → Add custom
  connector → `https://riff.quest/api/mcp`. The player signs in through OAuth.
- **Claude Code**: `claude mcp add --transport http riff-quest https://riff.quest/api/mcp`,
  then `/mcp` to sign in — or skip OAuth with a personal token:
  `--header "Authorization: Bearer rq_…"`.
- Anything else: OAuth if it supports it, a personal token in the header otherwise.

The player-facing version is the wiki article `src/content/wiki/ai-assistants.md`
(`/wiki/ai-assistants`, in all four languages) — the documentation URL for the
connector directory listing, and what `service_documentation` /
`resource_documentation` in the OAuth metadata point at. The privacy policy
has a matching section (5. AI Assistants). Change the tools, limits or token
lifetimes → update both.

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
| Clients | `lib/mcp/oauth/clients.ts` — CIMD fetched by `cimdFetch.ts`: https on the default port, no redirects, 5 s for the whole exchange, body cut off past 64 KB, and the public-address check runs inside the socket's own DNS lookup (no DNS-rebinding gap between check and connect); only global unicast addresses pass (`isPublicAddress`). Cached 1 h; lookups from the consent endpoint are limited to 60 per IP and hour. DCR stored as `rqc_…`; client names lose control and bidi characters |
| Consent | `/oauth/authorize` (`feature/settings/components/OAuthConsentView.tsx`) + `/api/oauth/authorize` — the request is checked on `describe` and again on `decide`; the redirect host is always shown, with a warning for loopback-only clients and for DCR clients (their name is self-chosen); writes are off until the player turns them on. A wrong request from a known client goes back to it only on the player's click — never on load, or the page would be an open redirector for any registered redirect. Never framed: `frame-ancestors 'none'` + `X-Frame-Options: DENY` on `/oauth/*` (next.config.js) |
| Codes & tokens | `lib/mcp/oauth/grants.ts` — one-time codes (5 min), access tokens in `mcpTokens` with `grantId` / `expiresAt` / `resource`, refresh tokens rotated on every use; a reused refresh token or a reused code revokes the whole grant (a spent code stays as a tombstone with its `grantId` until it would have expired) |
| Settings | Settings → AI assistants lists connected apps; Disconnect kills their tokens at once |

Redirect URIs: exact match, except loopback (`localhost`, `127.0.0.1`), where
the port is ignored — Claude Code listens on a fresh port each session. The
hosted Claude apps use `https://claude.ai/api/mcp/auth_callback`.

New collections, all Admin SDK only and covered by the default deny in
`firestore.rules`: `oauthClients`, `oauthCodes`, `oauthGrants`,
`oauthRefreshTokens`, `oauthRateLimits`, plus `mcpRateLimits`. No env variables.
Expired docs stay behind until a Firestore TTL policy on `expiresAt` is set
(console → Firestore → TTL) for `oauthCodes`, `oauthRefreshTokens`,
`mcpTokens` and `mcpRateLimits` — not configured from code.

A player who has to sign in on the consent screen is sent back to it after
login (`lib/mcp/oauth/postLoginRedirect.ts`, read in the login thunk).

Tests: `lib/mcp/oauth/flow.test.ts` runs the whole flow on an in-memory
Firestore (DCR and CIMD, PKCE, code reuse, refresh rotation and reuse
detection, disconnect, audience and expiry); `security.test.ts` the helpers.
To try it by hand: `npx @modelcontextprotocol/inspector`, point it at
`http://localhost:3000/api/mcp` and pick OAuth.
