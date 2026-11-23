/**
 * Whether riff.quest itself writes roadmaps for players — the builder, the
 * paid Refine, and the routes behind them, all of which run on our own model
 * key.
 *
 * Off since 2026-11-23 (owner's call): a player's roadmap is written by their
 * own AI assistant through the MCP server (docs/MCP.md → Roadmaps), which
 * checks and stores it and runs no model. The generator's code stays — its
 * checks, limits, voice and exemplars are what the MCP path is built from, and
 * the admin queue for the curated roadmaps still uses it — but nothing a
 * player can reach starts it.
 *
 * No imports on purpose: the browser and the API routes both read it.
 */
export const IN_APP_ROADMAP_GENERATION: boolean = false;

/** What a closed route answers, for a client that still asks. */
export const GENERATION_CLOSED_MESSAGE =
  "Roadmaps are no longer generated in the app. Build one with your own AI assistant — riff.quest/wiki/ai-assistants.";
