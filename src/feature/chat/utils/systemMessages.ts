import type { ChatSystemEvent } from "feature/chat/types/chat.types";

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
  }
};
