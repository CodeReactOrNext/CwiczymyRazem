import type { GuildBadge } from "feature/guilds/types/guild.types";
import { badgeFor } from "lib/guild/guildBadge";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * The activity-feed row for a guild moving up a level.
 *
 * A level is a quest cleared, and clears are banked lazily on whichever read of
 * the board first sees them — possibly two reads at once, both banking the same
 * quest. So the row's document id is the guild and the level it reached, and it
 * is written with `create`: the second read's write fails on the existing
 * document and nothing is posted twice.
 *
 * One read may bank several quests (a guild founded on veterans catches up in
 * one go). That is one row naming the level reached, not one per level.
 */

/** Quest names listed on the row; the rest are summed up as "and N more". */
const MAX_LISTED_QUESTS = 5;

/** Firestore's gRPC code for a document that already exists. */
const ALREADY_EXISTS = 6;

export interface GuildLevelLogInput {
  guildId: string;
  guildData: Record<string, any>;
  fromLevel: number;
  toLevel: number;
  /** Names of the quests banked on this read, oldest first. */
  questNames: string[];
  now: Date;
}

export interface GuildLevelLogDoc {
  type: "guild_level_up";
  data: string;
  timestamp: string;
  guildId: string;
  guildName: string;
  guildBadge: GuildBadge;
  level: number;
  previousLevel: number;
  quests: string[];
  questsCleared: number;
}

export const guildLevelLogId = (guildId: string, level: number): string =>
  `guild-level-${guildId}-${level}`;

export const buildGuildLevelLog = ({
  guildId,
  guildData,
  fromLevel,
  toLevel,
  questNames,
  now,
}: GuildLevelLogInput): GuildLevelLogDoc => {
  const when = now.toISOString();

  return {
    type: "guild_level_up",
    data: when,
    timestamp: when,
    guildId,
    guildName:
      typeof guildData.name === "string" && guildData.name
        ? guildData.name
        : guildId,
    guildBadge: { ...badgeFor(guildId, guildData), level: toLevel },
    level: toLevel,
    previousLevel: fromLevel,
    quests: questNames.slice(0, MAX_LISTED_QUESTS),
    questsCleared: questNames.length,
  };
};

/**
 * Posts the row. Never throws: the clear is already banked, and a missing feed
 * row is not worth failing the board read over.
 */
export async function postGuildLevelUp(
  input: GuildLevelLogInput,
): Promise<void> {
  if (input.toLevel <= input.fromLevel) return;

  try {
    await firestore
      .collection("logs")
      .doc(guildLevelLogId(input.guildId, input.toLevel))
      .create(buildGuildLevelLog(input));
  } catch (error) {
    if ((error as { code?: unknown })?.code === ALREADY_EXISTS) return;
    console.error("[guildLevelLog] could not post", input.guildId, error);
  }
}
