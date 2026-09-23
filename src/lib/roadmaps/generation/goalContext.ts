import type { RoadmapGoalContext } from "feature/supporterPanel/types/roadmapJob.types";

export const MAX_CONTEXT_FIELD_LENGTH = 200;

/** A roadmap title: short enough for a card, long enough to name the subject. */
export const MIN_TITLE_LENGTH = 3;
export const MAX_TITLE_LENGTH = 80;

/** The title a request carried, on one line — or null when it is not a usable one. */
export const sanitizeTitle = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const title = value.replace(/\s+/g, " ").trim();
  return title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH
    ? title
    : null;
};

const text = (value: unknown): string =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, MAX_CONTEXT_FIELD_LENGTH)
    : "";

/**
 * The context a request carried, cut down to what the prompt may hold: short
 * single-line texts. Null when nothing is left.
 */
export const sanitizeGoalContext = (
  value: unknown,
): RoadmapGoalContext | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const context: RoadmapGoalContext = {
    favourites: text(raw.favourites),
    canPlay: text(raw.canPlay),
  };
  return context.favourites || context.canPlay ? context : null;
};

/**
 * The goal as the model reads it: the title, the player's description, then
 * what they said about themselves — on one line, so it still sits inside the
 * prompt's quotes. The saved roadmap keeps the title and the goal apart.
 */
export const goalForModel = (
  goal: string,
  context: RoadmapGoalContext | null | undefined,
  title?: string | null,
): string => {
  const titled =
    title && !goal.toLowerCase().includes(title.toLowerCase())
      ? `${title}: ${goal}`
      : goal;
  if (!context) return titled;
  const notes = [
    context.favourites ? `loves ${context.favourites}` : null,
    context.canPlay ? `can already play ${context.canPlay}` : null,
  ].filter(Boolean);
  return notes.length
    ? `${titled} (About the student: ${notes.join("; ")}.)`
    : titled;
};

const GOAL_SUBJECT =
  /\b(blues|rock|metal|jazz|funk|country|folk|punk|pop|classical|flamenco|fingerstyle|acoustic|lead|rhythm|solo|soloing|riff|chord|chords|scale|scales|arpeggio|improvis\w*|picking|strumming|tapping|legato|sweep\w*|bend\w*|vibrato|theory|fretboard|ear|song|songs|style)\b/i;

/**
 * One nudge for a goal too thin to build a good roadmap from — or null. The
 * generator does its best with anything guitar-related; this only says what
 * would make the result sharper, before the tokens are spent.
 */
export const goalHint = (goal: string): string | null => {
  const words = goal.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  if (words.length < 4) {
    return "Say a bit more — what do you want to be able to play, and in what style?";
  }
  if (!GOAL_SUBJECT.test(goal) && !/[A-Z][a-z]+/.test(goal.slice(1))) {
    return "Name a style, an artist or a technique — “blues like SRV” gets a sharper roadmap than “get better”.";
  }
  return null;
};
