import type { ChatMessageType } from "feature/chat/types/chat.types";
import type { PracticeLogSession } from "feature/practiceLog/types/practiceLog.types";

/**
 * Canned data for the dev simulator (/dev/mascot-showcase), for the few hooks
 * that read Firestore directly instead of through React Query or the store.
 * The simulator sets it before a scene mounts; the hooks check it first and
 * skip their subscription when it is there. Always null in production.
 */
export interface DevSimData {
  /** useChat: the room's messages, instead of the live snapshot. */
  chatMessages?: ChatMessageType[];
  /** usePracticeLogSessions: the player's logged sessions. */
  practiceLogSessions?: PracticeLogSession[];
}

let current: DevSimData | null = null;

export const setDevSim = (data: DevSimData | null) => {
  if (process.env.NODE_ENV === "production") return;
  current = data;
};

export const devSim = (): DevSimData | null =>
  process.env.NODE_ENV === "production" ? null : current;
