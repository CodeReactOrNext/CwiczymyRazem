import { getDuelExercise } from "feature/duels/data/duelPool";
import type { DuelDoc, DuelFeedPlayer } from "feature/duels/types/duel.types";
import { toDuelFeedEntry } from "feature/duels/utils/duelRules";
import type {
  FirebaseLogsDuelPlayer,
  FirebaseLogsDuelResultInterface,
} from "feature/logs/types/logs.type";

/**
 * The activity-feed row for a settled duel: who beat whom.
 *
 * The row's document id is the duel, so writing it twice (a cron pass racing
 * the second Ready) lands on the same document instead of posting it twice.
 */

export type DuelResultLogDoc = Omit<
  FirebaseLogsDuelResultInterface,
  "id" | "reactions" | "reactionFame" | "timestamp" | "data"
> & { data: string; timestamp: string };

export const duelResultLogId = (duelId: string): string =>
  `duel-result-${duelId}`;

const toLogPlayer = (player: DuelFeedPlayer): FirebaseLogsDuelPlayer => ({
  userId: player.userId,
  displayName: player.displayName,
  avatar: player.avatar,
  bestScore: player.bestScore,
  ratingBefore: player.ratingBefore,
  ratingAfter: player.ratingAfter,
});

/**
 * The row for a settled duel, or null when there is nothing to report: a duel
 * still running, or one nobody played — no winner, no loser, no rating moved.
 */
export const buildDuelResultLog = (duel: DuelDoc): DuelResultLogDoc | null => {
  const entry = toDuelFeedEntry(duel);
  if (!entry || entry.kind === "void") return null;

  const when = new Date(entry.settledAt).toISOString();

  return {
    type: "duel_result",
    data: when,
    timestamp: when,
    duelId: entry.id,
    exerciseId: entry.exerciseId,
    exerciseTitle: getDuelExercise(entry.exerciseId)?.title ?? entry.exerciseId,
    kind: entry.kind,
    players: [toLogPlayer(entry.players[0]), toLogPlayer(entry.players[1])],
  };
};
