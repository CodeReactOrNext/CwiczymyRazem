import type { ChatSystemEvent } from "feature/chat/types/chat.types";

/**
 * Sessions shorter than this don't make it into the guild room: a room full of
 * two-minute warm-ups reads as noise, not as a guild at work.
 */
export const GUILD_SESSION_MIN_MINUTES = 10;

/** Whole minutes in a session's logged time, or 0 for anything missing or malformed. */
export const sessionMinutes = (sumTimeMs: unknown): number =>
  typeof sumTimeMs === "number" && Number.isFinite(sumTimeMs) && sumTimeMs > 0
    ? Math.floor(sumTimeMs / 60_000)
    : 0;

/** What the new player said they came for, as the tail of "Ania just joined, …". */
export const welcomeGoalPhrase = (
  goal: string | null | undefined,
  planTitle: string | null | undefined,
): string | null => {
  switch (goal) {
    case "plans":
      return planTitle
        ? `starting with the ${planTitle} plan`
        : "starting with a practice plan";
    case "songs":
      return "here to learn songs";
    case "roadmap":
      return "building a practice roadmap";
    case "journey":
      return "starting the Journey";
    case "log":
      return "here to log their practice";
    default:
      return null;
  }
};

export const welcomeText = (
  username: string,
  goal: string | null | undefined,
  planTitle: string | null | undefined,
): string => {
  const phrase = welcomeGoalPhrase(goal, planTitle);
  return phrase
    ? `${username} just joined, ${phrase}`
    : `${username} just joined Riff Quest`;
};

/**
 * The event as one line of text. Stored as the message body too, so anything
 * that reads the room without knowing about events still has something to show.
 */
export const systemEventText = (
  event: ChatSystemEvent,
  username: string,
): string => {
  switch (event.kind) {
    case "level_up":
      return event.quests.length > 0
        ? `${event.guildName} reached level ${event.level} — cleared ${event.quests.join(", ")}`
        : `${event.guildName} reached level ${event.level}`;
    case "member_joined":
      return `${username} joined the guild`;
    case "session":
      return event.title
        ? `${username} finished a ${event.minutes} min session: ${event.title}`
        : `${username} finished a ${event.minutes} min session`;
  }
};
