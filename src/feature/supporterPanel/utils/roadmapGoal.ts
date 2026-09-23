import type { UserRoadmapSummary } from "feature/supporterPanel/types/userRoadmaps.types";

const LEVEL_SUFFIX =
  /\s*(absolute beginner|beginner|intermediate|advanced) level\.?\s*$/i;

/**
 * The goal as the player typed it, minus the "Advanced level." the generator
 * appends to it — the level already has a pill of its own. The goal, not the
 * title, is what names a roadmap: titles are the model's paraphrase of the
 * goal and sometimes come back cut short.
 */
export const displayGoal = (
  summary: Pick<UserRoadmapSummary, "goal" | "title" | "id">,
): string =>
  (summary.goal || summary.title || summary.id)
    .replace(LEVEL_SUFFIX, "")
    .trim() ||
  summary.title ||
  summary.id;

/**
 * What names a roadmap on a card or a banner: the title the player gave it,
 * or — for a roadmap from before titles were asked for — its goal.
 */
export const displayTitle = (
  summary: Pick<UserRoadmapSummary, "goal" | "title" | "id">,
): string => summary.title?.trim() || displayGoal(summary);

/**
 * The description under the title, or null when it would only repeat it.
 */
export const displayDescription = (
  summary: Pick<UserRoadmapSummary, "goal" | "title" | "id">,
): string | null => {
  const goal = displayGoal(summary);
  const title = displayTitle(summary);
  return goal && goal !== title ? goal : null;
};

// The same level colours the curated roadmap cards on /ai-coach use.
const LEVEL_TONES: Record<string, string> = {
  "Absolute Beginner": "bg-cyan-500/10 text-cyan-300",
  Beginner: "bg-emerald-500/10 text-emerald-300",
  Intermediate: "bg-amber-500/10 text-amber-300",
  Advanced: "bg-purple-500/10 text-purple-300",
};

/** Background and text classes for a roadmap level's pill. */
export const levelTone = (level: string): string =>
  LEVEL_TONES[level] ?? "bg-zinc-800 text-zinc-400";
