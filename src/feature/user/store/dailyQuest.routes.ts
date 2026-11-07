import type { DailyQuestTask, DailyQuestTaskType } from "types/api.types";

/** Where each daily quest task is done. Shared by the Home card and What Next. */
export const DAILY_QUEST_ROUTES: Record<DailyQuestTaskType, string> = {
  rate_song: "/songs?view=library",
  add_want_to_learn: "/songs?view=management",
  practice_any_song: "/songs?view=board",
  healthy_habits: "/report",
  auto_plan: "/timer/auto",
  practice_plan: "/timer/plans",
  practice_total_time: "/songs?view=board",
  practice_technique_time: "/timer/plans",
  practice_specific_exercise: "/profile/skills", // a task with its own exercise links to it instead — see getQuestTaskHref
  practice_theory_time: "/timer/plans",
  practice_hearing_time: "/timer/plans",
  practice_creativity_time: "/timer/plans",
  creativity_focus: "/timer/plans",
  long_session: "/songs?view=board",
  well_rounded: "/timer/plans",
  two_categories_min: "/timer/plans",
  balanced_session: "/timer/plans",
  rate_multiple_songs: "/songs?view=library",
  complete_two_plans: "/timer/plans",
  improve_skill: "/profile/skills",
  practice_three_exercises: "/profile/skills?tab=browse",
};

/** The page that finishes this task — the exact exercise when the task names one. */
export const getQuestTaskHref = (
  task: Pick<DailyQuestTask, "type" | "exerciseId">
): string =>
  task.type === "practice_specific_exercise" && task.exerciseId
    ? `/profile/skills?exerciseId=${task.exerciseId}`
    : DAILY_QUEST_ROUTES[task.type];
