import type {
  EffectInventoryItem,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import type { GuildBadge } from "feature/guilds/types/guild.types";

/** The reactions a message can collect. Order is the order the picker shows them in. */
export const CHAT_REACTIONS = ["❤️", "🔥", "🎸", "😂", "👏"] as const;

export type ChatReactionEmoji = (typeof CHAT_REACTIONS)[number];

/**
 * One person's reaction. Stored in the message's `likes` array — the field the
 * rules already let any reader touch — so adding emoji needed no rules change.
 * Entries written before emoji existed carry none and count as a heart.
 */
export interface ChatReaction {
  id: string;
  username: string;
  emoji?: ChatReactionEmoji;
}

/** A person tagged with `@name`. The name is what was typed, so the text can be highlighted. */
export interface ChatMention {
  id: string;
  username: string;
}

/**
 * The message being answered, copied onto the reply at send time: the quote
 * reads the same even after the original scrolls out of the loaded window.
 */
export interface ChatReplyTo {
  id: string;
  userId: string;
  username: string;
  message: string;
}

/**
 * Something from the app shared into the room, drawn as a card. A snapshot of
 * what it was when shared — titles are copied so a room of cards needs no
 * extra reads to draw.
 */
export type ChatAttachment =
  | { kind: "exercise"; id: string; title: string; subtitle?: string }
  | { kind: "plan"; id: string; title: string; subtitle?: string }
  | { kind: "song"; id: string; title: string; artist: string }
  | { kind: "recording"; id: string; title: string; subtitle?: string }
  | {
      kind: "item";
      itemType: "guitar" | "effect";
      itemName: string;
      itemBrand: string;
      itemRarity: string;
      itemImageId: number | string;
      rolledItem?: InventoryItem | EffectInventoryItem;
    };

/**
 * An event rather than somebody talking. Posted by the server (Admin SDK) — the
 * rules keep clients from writing a message of any type but a plain one.
 */
export type ChatSystemEvent =
  | {
      kind: "level_up";
      guildName: string;
      level: number;
      /** Names of the quests that got the guild there, at most five. */
      quests: string[];
    }
  | { kind: "member_joined" }
  | {
      kind: "session";
      minutes: number;
      /** The session's own name: a plan title, an exercise title. */
      title?: string | null;
    };

/** What a player who just finished onboarding came for, shown on their welcome card. */
export interface ChatWelcome {
  goal: string | null;
  planTitle: string | null;
}

export interface ChatMessageType {
  id?: string;
  /**
   * Absent on everything older than the typed messages, which were all plain.
   * `system` and `welcome` rows are written by the server only.
   */
  type?: "message" | "system" | "welcome";
  /** The author, or the player a system event is about. `"system"` for guild-wide events. */
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
  likes?: ChatReaction[];
  replyTo?: ChatReplyTo | null;
  mentions?: ChatMention[];
  attachment?: ChatAttachment | null;
  system?: ChatSystemEvent | null;
  welcome?: ChatWelcome | null;
  /** Set by `/api/chat/mentions` once the tagged players were notified, so it never runs twice. */
  mentionsNotified?: boolean;
}
