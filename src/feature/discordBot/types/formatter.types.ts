
import type { FirebaseLogsInterface, FirebaseLogsSongsInterface } from "feature/logs/types/logs.type";

import type { DiscordEmbed } from "./discord.types";

export type SongStatus =
  | "learned"
  | "wantToLearn"
  | "learning"
  | "added"
  | "difficulty_rate";

export interface SongFormatter {
  format: (
    log: FirebaseLogsSongsInterface
  ) => Promise<{ embeds: DiscordEmbed[] }>;
}

export interface GeneralLogFormatter {
  format: (log: FirebaseLogsInterface) => Promise<{ embeds: DiscordEmbed[] }>;
}
