import type { ChatSystemEvent } from "feature/chat/types/chat.types";
import type { Translate } from "lib/i18n/translate";
import { translateOr } from "lib/i18n/translate";

/** What the new player said they came for, as the tail of "Ania just joined, …". */
export const welcomeGoalPhrase = (
  goal: string | null | undefined,
  planTitle: string | null | undefined,
  t?: Translate,
): string | null => {
  switch (goal) {
    case "plans":
      return planTitle
        ? translateOr(t, "chat:welcome_goal.plan_named", "starting with the {{plan}} plan", { plan: planTitle })
        : translateOr(t, "chat:welcome_goal.plan", "starting with a practice plan");
    case "songs":
      return translateOr(t, "chat:welcome_goal.songs", "here to learn songs");
    case "roadmap":
      return translateOr(t, "chat:welcome_goal.roadmap", "building a practice roadmap");
    case "journey":
      return translateOr(t, "chat:welcome_goal.journey", "starting the Journey");
    case "log":
      return translateOr(t, "chat:welcome_goal.log", "here to log their practice");
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
