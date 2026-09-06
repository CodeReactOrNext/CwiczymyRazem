import type { GuildBadge } from "feature/guilds/types/guild.types";

export interface ChatMessageType {
  id?: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  userPhotoURL?: string;
  lvl?: number;
  /**
   * The sender's guild tag, copied onto the message the same way the avatar and
   * the level already are: a room of fifty messages is a room of fifty authors,
   * and reading a user document per line to draw a tag is not worth it. Written
   * at send time, so it says what the sender wore when they said it.
   */
  guildBadge?: GuildBadge | null;
  likes?: Array<{ id: string; username: string }>;
}