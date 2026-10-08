import type { ChatMessageType } from "feature/chat/types/chat.types";

/** Words a stock greeting is made of — anything else means the greeter had more to say. */
const GREETING_WORDS = new Set([
  "welcome",
  "hi",
  "hello",
  "hey",
  "yo",
  "witaj",
  "witamy",
  "cześć",
  "czesc",
  "siema",
  "elo",
  "willkommen",
  "hallo",
  "servus",
  "bienvenido",
  "bienvenida",
  "hola",
  "buenas",
]);

/** A row others greet: a guild's new member. */
const isGreetable = (message: ChatMessageType) =>
  message.type === "system" && message.system?.kind === "member_joined";

/**
 * Whether a reply is only "@Ania Welcome! 👋" — the text the Say hi button
 * writes, or something just as empty. A greeting with a question or a tip in it
 * is conversation and stays a message of its own.
 */
export const isStockGreeting = (message: ChatMessageType): boolean => {
  if (message.type && message.type !== "message") return false;
  if (!message.replyTo || message.attachment) return false;

  const words = message.message
    .replace(`@${message.replyTo.username}`, " ")
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean);

  return words.every((word) => GREETING_WORDS.has(word));
};

export interface FoldedGreetings {
  /** The room as drawn: stock greetings left out. */
  visible: ChatMessageType[];
  /** Who greeted each welcome row, oldest first, keyed by that row's id. */
  greetersById: Map<string, ChatMessageType[]>;
}

/**
 * Folds stock greetings into the row they answer, so ten new players and thirty
 * "Welcome! 👋" read as ten lines rather than forty cards. Only folds when the
 * greeted row is loaded — otherwise the greeting would vanish without a trace.
 */
export const foldGreetings = (messages: ChatMessageType[]): FoldedGreetings => {
  const greetableIds = new Set(
    messages.filter(isGreetable).flatMap((m) => (m.id ? [m.id] : [])),
  );
  const greetersById = new Map<string, ChatMessageType[]>();
  const visible: ChatMessageType[] = [];

  for (const message of messages) {
    const targetId = message.replyTo?.id;
    if (targetId && greetableIds.has(targetId) && isStockGreeting(message)) {
      const greeters = greetersById.get(targetId) ?? [];
      if (!greeters.some((g) => g.userId === message.userId)) {
        greeters.push(message);
      }
      greetersById.set(targetId, greeters);
      continue;
    }
    visible.push(message);
  }

  return { visible, greetersById };
};
