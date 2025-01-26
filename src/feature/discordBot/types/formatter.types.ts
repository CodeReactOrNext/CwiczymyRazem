import {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "utils/firebase/client/firebase.types";
import { DiscordEmbed } from "./discord.types";

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
