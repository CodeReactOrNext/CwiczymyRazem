import {
  CHAT_REACTIONS,
  type ChatReaction,
  type ChatReactionEmoji,
} from "feature/chat/types/chat.types";

/** The emoji behind a stored reaction. Entries from before emoji existed were hearts. */
export const reactionEmoji = (reaction: ChatReaction): ChatReactionEmoji =>
  reaction.emoji && CHAT_REACTIONS.includes(reaction.emoji)
    ? reaction.emoji
    : "❤️";

export interface ReactionGroup {
  emoji: ChatReactionEmoji;
  reactors: ChatReaction[];
  /** Whether the viewer is among the reactors. */
  mine: boolean;
}

/** A message's reactions as chips: one per emoji, in picker order, empty ones left out. */
export const groupReactions = (
  reactions: readonly ChatReaction[] | undefined,
  viewerId: string | null | undefined,
): ReactionGroup[] =>
  CHAT_REACTIONS.map((emoji) => {
    const reactors = (reactions ?? []).filter(
      (reaction) => reactionEmoji(reaction) === emoji,
    );
    return {
      emoji,
      reactors,
      mine: Boolean(viewerId) && reactors.some((r) => r.id === viewerId),
    };
  }).filter((group) => group.reactors.length > 0);

/**
 * The exact stored entry of the viewer's reaction with `emoji`, if they placed
 * one. `arrayRemove` matches whole objects, so taking the entry off needs the
 * object as it was written — a legacy heart has no `emoji` key at all.
 */
export const findOwnReaction = (
  reactions: readonly ChatReaction[] | undefined,
  viewerId: string,
  emoji: ChatReactionEmoji,
): ChatReaction | undefined =>
  (reactions ?? []).find(
    (reaction) => reaction.id === viewerId && reactionEmoji(reaction) === emoji,
  );
