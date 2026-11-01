/**
 * AI assistants (MCP) are a supporter perk: the badge (`isSupport`, written by
 * the Buy Me a Coffee webhook or by hand in the admin panel) is the ticket, the
 * same one the supporter-only API routes check. The owner passes too, so the
 * connection can be tested on the owner's own account.
 *
 * No imports on purpose — the settings and consent screens read these too.
 */
/**
 * What the MCP server answers a token whose player has no badge (HTTP 403).
 * It names the requirement and nothing more: no link to the supporter page or
 * a donation. That page starts a payment, and the AI app directories (ChatGPT
 * explicitly) don't allow a connector to send users to one.
 */
export const MCP_SUPPORTERS_ONLY_MESSAGE =
  "Connecting an AI assistant to riff.quest is a perk for riff.quest supporters.";

/** The error code the APIs answer with, for the UI to show the perk notice. */
export const MCP_SUPPORTERS_ONLY_ERROR = "supporters_only";

export const hasMcpAccess = (
  user: { isSupport?: unknown; role?: unknown } | undefined,
) => user?.isSupport === true || user?.role === "admin";
