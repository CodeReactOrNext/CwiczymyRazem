import type { LogReactionFame } from "feature/logs/types/logs.type";

import type { AnyFirebaseLog, LogGroup } from "./groupConsecutiveLogs";

type ReactableLog = AnyFirebaseLog & {
  id?: string;
  reactions?: string[];
  reactionFame?: LogReactionFame;
};

const asReactable = (log: AnyFirebaseLog): ReactableLog => log as ReactableLog;

/**
 * The log a new reaction is written to. Groups grow at the head — a fresh activity by the same
 * user is prepended — so the newest log is a moving target: it changes identity underneath a
 * reaction that was already placed. The oldest member is stable for as long as the group exists,
 * so it's the one that carries the reaction.
 */
export const getGroupReactionAnchor = (
  group: Pick<LogGroup, "logs">
): ReactableLog | undefined => {
  const oldest = group.logs[group.logs.length - 1];
  return oldest ? asReactable(oldest) : undefined;
};

/**
 * Everyone who has reacted anywhere in the group. Read as a union rather than off a single log so
 * the button keeps showing the reaction after the anchor shifts (older logs paged in, group split
 * or merged) instead of inviting the same user to motivate the same activity twice.
 */
export const getGroupReactors = (group: Pick<LogGroup, "logs">): string[] => {
  const reactors = new Set<string>();

  for (const log of group.logs) {
    for (const uid of asReactable(log).reactions ?? []) reactors.add(uid);
  }

  return [...reactors];
};

/**
 * Total Fame this group has already handed its owner. Uses the amount recorded per reactor;
 * reactions placed before that was tracked fall back to `fallbackPerReaction` so the counter stays
 * roughly right on historical rows.
 */
export const getGroupAwardedFame = (
  group: Pick<LogGroup, "logs">,
  fallbackPerReaction: number
): number => {
  let total = 0;

  for (const log of group.logs) {
    const { reactions = [], reactionFame } = asReactable(log);
    for (const uid of reactions) {
      total += reactionFame?.[uid] ?? fallbackPerReaction;
    }
  }

  return total;
};
