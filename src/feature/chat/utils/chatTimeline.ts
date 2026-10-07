import type { ChatMessageType } from "feature/chat/types/chat.types";

/** A pause this long starts a new group, so the time on its header stays honest. */
export const GROUP_BREAK_MS = 15 * 60 * 1000;

/**
 * The moment a message was sent. Firestore hands back a `Timestamp` (typed as a
 * `Date` on the message), and a message still on its way up has no server time
 * yet — that one is "now".
 */
export const toMessageDate = (
  timestamp: unknown,
  now: Date = new Date(),
): Date => {
  if (timestamp instanceof Date) return timestamp;
  if (
    timestamp &&
    typeof (timestamp as { toDate?: unknown }).toDate === "function"
  ) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  if (typeof timestamp === "number" || typeof timestamp === "string") {
    const parsed = new Date(timestamp);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return now;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export type ChatDayKind = "today" | "yesterday" | "earlier";

/** Which of "Today", "Yesterday" or a dated label a day gets, in local time. */
export const chatDayKind = (date: Date, now: Date): ChatDayKind => {
  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000,
  );
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return "earlier";
};

const isPlain = (message: ChatMessageType) =>
  !message.type || message.type === "message";

export type ChatTimelineEntry<M extends ChatMessageType = ChatMessageType> =
  | { kind: "day"; key: string; date: Date }
  | { kind: "event"; key: string; message: M; sentAt: Date }
  | {
      kind: "group";
      key: string;
      userId: string;
      sentAt: Date;
      messages: M[];
    };

/**
 * Lays the room out the way it reads: a divider wherever the day changes, server
 * events on their own, and runs of one author's messages gathered into a group
 * that carries the name and the time once. A reply always opens a group of its
 * own (its quote is its header), and so does a long pause.
 */
export const buildChatTimeline = <M extends ChatMessageType>(
  messages: M[],
  now: Date = new Date(),
): ChatTimelineEntry<M>[] => {
  const entries: ChatTimelineEntry<M>[] = [];
  let lastDay: number | null = null;
  let group: Extract<ChatTimelineEntry<M>, { kind: "group" }> | null = null;
  let lastSentAt: Date | null = null;

  messages.forEach((message, index) => {
    const sentAt = toMessageDate(message.timestamp, now);
    const day = startOfDay(sentAt).getTime();
    const key = message.id ?? `message-${index}`;

    if (day !== lastDay) {
      entries.push({ kind: "day", key: `day-${day}`, date: sentAt });
      lastDay = day;
      group = null;
    }

    if (!isPlain(message)) {
      entries.push({ kind: "event", key, message, sentAt });
      group = null;
    } else {
      const continues =
        group !== null &&
        group.userId === message.userId &&
        !message.replyTo &&
        lastSentAt !== null &&
        sentAt.getTime() - lastSentAt.getTime() < GROUP_BREAK_MS;

      if (continues && group) {
        group.messages.push(message);
      } else {
        group = {
          kind: "group",
          key,
          userId: message.userId,
          sentAt,
          messages: [message],
        };
        entries.push(group);
      }
    }

    lastSentAt = sentAt;
  });

  return entries;
};
