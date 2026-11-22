import type { RotationItem } from "feature/rotation/types/rotation.types";
import type { DailyQuestTaskType } from "types/api.types";

export interface SessionToolQuestInput {
  planId: string;
  /** Exercises of the plan that were completed. */
  played: { id: string; riddleConfig?: { mode?: string } }[];
  /** What the report says was practiced — the same payload Rotation is stamped from. */
  practiced?: {
    exerciseIds?: string[];
    skillIds?: string[];
    customIds?: string[];
  };
  songIds: string[];
  isDuel: boolean;
  isBoss: boolean;
  /** A guild recording take that counts (not a rehearsal). */
  isGuildTake: boolean;
  /** The player's rotation, when it is already in the query cache. */
  rotationItems?: RotationItem[];
  /** Songs on this month's challenge board, when already in the query cache. */
  challengeSongIds?: string[];
  isDailyExercise: (exerciseId: string) => boolean;
}

export interface ToolQuestEvent {
  type: DailyQuestTaskType;
  amount?: number;
}

const PLAY_BY_EAR_MODE = "sequenceRepeat";

/**
 * Which tool quests a finished session moves forward. Pure: every fact comes
 * from the plan, the report payload or data the client already has cached —
 * nothing here is worth a read of its own.
 *
 * Goal runs are counted per run on the goal page, not here.
 */
export const sessionToolQuests = ({
  planId,
  played,
  practiced,
  songIds,
  isDuel,
  isBoss,
  isGuildTake,
  rotationItems,
  challengeSongIds,
  isDailyExercise,
}: SessionToolQuestInput): ToolQuestEvent[] => {
  const events: ToolQuestEvent[] = [];

  if (planId.startsWith("rotation-")) {
    events.push({ type: "rotation_item", amount: Math.max(1, played.length) });
  } else if (rotationItems?.length) {
    const playedIds: Record<RotationItem["type"], Set<string>> = {
      exercise: new Set(practiced?.exerciseIds),
      skill: new Set(practiced?.skillIds),
      custom: new Set(practiced?.customIds),
      song: new Set(songIds),
    };
    const inRotation = rotationItems.filter((item) =>
      playedIds[item.type]?.has(item.id),
    ).length;
    if (inRotation > 0)
      events.push({ type: "rotation_item", amount: inRotation });
  }

  if (planId.startsWith("calendar-")) events.push({ type: "calendar_tick" });
  if (played.some((exercise) => isDailyExercise(exercise.id)))
    events.push({ type: "daily_exercise" });
  if (
    played.some((exercise) => exercise.riddleConfig?.mode === PLAY_BY_EAR_MODE)
  ) {
    events.push({ type: "ear_round" });
  }
  if (isDuel) events.push({ type: "duel_run" });
  if (isBoss) events.push({ type: "boss_attempt" });
  if (isGuildTake) events.push({ type: "guild_contribution" });
  if (challengeSongIds?.some((songId) => songIds.includes(songId))) {
    events.push({ type: "challenge_play" });
  }

  return events;
};
