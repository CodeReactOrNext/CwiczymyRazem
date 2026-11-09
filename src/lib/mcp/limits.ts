/**
 * The MCP server's limits. No imports on purpose: the AI assistant landing and
 * the wiki-facing copy quote them, and must not pull in the Admin SDK.
 */

/** HTTP requests one token may make in a minute — every MCP message is one. */
export const MCP_REQUESTS_PER_MINUTE = 60;
/** Writes a player may make through MCP in a day, across all their tokens. */
export const MCP_WRITES_PER_DAY = 35;
/** Of those, how many may create a new exercise. */
export const MCP_EXERCISES_PER_DAY = 10;
