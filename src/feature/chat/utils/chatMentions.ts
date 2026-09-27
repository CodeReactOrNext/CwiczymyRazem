import type { ChatMention } from "feature/chat/types/chat.types";

/** A message may tag at most this many people — the server notifies no more than that either. */
export const MAX_CHAT_MENTIONS = 5;

/**
 * The `@name` being typed at the caret, if any: the `@` must start the text or
 * follow whitespace, and nothing typed since may be whitespace. Returns where
 * the `@` sits and what follows it.
 */
export const activeMentionQuery = (
  text: string,
  caret: number,
): { start: number; query: string } | null => {
  const before = text.slice(0, caret);
  const match = /(^|\s)@([^\s@]{0,30})$/.exec(before);
  if (!match) return null;

  return { start: before.length - match[2].length - 1, query: match[2] };
};

/** Puts `@username ` in place of the half-typed tag and says where the caret goes next. */
export const insertMention = (
  text: string,
  start: number,
  caret: number,
  username: string,
): { text: string; caret: number } => {
  const inserted = `@${username} `;
  return {
    text: text.slice(0, start) + inserted + text.slice(caret),
    caret: start + inserted.length,
  };
};

/**
 * The tags that survived editing: picked from the list and still present as
 * `@name` in the text being sent. Deduplicated, the author left out, capped.
 */
export const resolveMentions = (
  text: string,
  picked: readonly ChatMention[],
  authorId: string | null | undefined,
): ChatMention[] => {
  const seen = new Set<string>();
  const kept: ChatMention[] = [];

  for (const mention of picked) {
    if (mention.id === authorId || seen.has(mention.id)) continue;
    if (!text.includes(`@${mention.username}`)) continue;
    seen.add(mention.id);
    kept.push(mention);
  }

  return kept.slice(0, MAX_CHAT_MENTIONS);
};

export type MessageSegment =
  | { type: "text"; text: string }
  | { type: "mention"; text: string; mention: ChatMention };

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Cuts a message into plain text and the `@name` runs of the people it tagged. */
export const splitByMentions = (
  message: string,
  mentions: readonly ChatMention[] | undefined,
): MessageSegment[] => {
  const usable = (mentions ?? []).filter((mention) => mention.username);
  if (usable.length === 0) return [{ type: "text", text: message }];

  // Longest names first, so "@Ann Lee" isn't cut short by an "@Ann" tagged beside it.
  const byName = new Map(usable.map((mention) => [mention.username, mention]));
  const pattern = new RegExp(
    `@(${[...byName.keys()]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|")})`,
    "g",
  );

  const segments: MessageSegment[] = [];
  let last = 0;
  for (const match of message.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last)
      segments.push({ type: "text", text: message.slice(last, index) });
    segments.push({
      type: "mention",
      text: match[0],
      mention: byName.get(match[1])!,
    });
    last = index + match[0].length;
  }
  if (last < message.length)
    segments.push({ type: "text", text: message.slice(last) });

  return segments;
};

/** Short enough to sit in a quote or a notification line. */
export const snippet = (message: string, max = 140): string => {
  const flat = message.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
};
