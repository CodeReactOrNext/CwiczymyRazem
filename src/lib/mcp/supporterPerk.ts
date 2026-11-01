/**
 * AI assistants (MCP) are a supporter perk: the badge (`isSupport`, written by
 * the Buy Me a Coffee webhook or by hand in the admin panel) is the ticket, the
 * same one the supporter-only API routes check. The owner passes too, so the
 * connection can be tested on the owner's own account.
 *
 * No imports on purpose — the settings and consent screens read these too.
 */
export const SUPPORTER_PAGE_URL = "https://riff.quest/supporter";

/** What the MCP server answers a token whose player has no badge (HTTP 403). */
export const MCP_SUPPORTERS_ONLY_MESSAGE = `Connecting an AI assistant to riff.quest is a supporter perk. Any donation unlocks it: ${SUPPORTER_PAGE_URL}`;

/** The error code the APIs answer with, for the UI to show the perk notice. */
export const MCP_SUPPORTERS_ONLY_ERROR = "supporters_only";

export const hasMcpAccess = (
  user: { isSupport?: unknown; role?: unknown } | undefined,
) => user?.isSupport === true || user?.role === "admin";
