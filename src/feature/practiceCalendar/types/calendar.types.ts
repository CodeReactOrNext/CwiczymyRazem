/**
 * What a calendar slot plays.
 * - "exercise": one exercise from the catalog.
 * - "song": a song from the player's library.
 * - "goal": the exercise of an open tempo goal, at its current milestone.
 * - "roadmap": the next step of a roadmap the player started.
 * - "custom": anything of the player's own, played on a plain timer.
 */
export type CalendarItemKind =
  | "exercise"
  | "song"
  | "goal"
  | "roadmap"
  | "custom";

/**
 * The part of practice a slot feeds — what the week's balance bar and the
 * auto-planner count minutes against.
 */
export type PracticeArea =
  | "technique"
  | "theory"
  | "hearing"
  | "creativity"
  | "songs";

export const PRACTICE_AREAS: PracticeArea[] = [
  "technique",
  "songs",
  "theory",
  "hearing",
  "creativity",
];

/** Where in the day a slot sits: the warm-up opens it, the rest is the work. */
export type CalendarItemRole = "warmup" | "main";

export interface CalendarSongRef {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

/** One block of practice on one day. */
export interface CalendarItem {
  /** Unique within its day. */
  id: string;
  kind: CalendarItemKind;
  area: PracticeArea;
  minutes: number;
  role: CalendarItemRole;
  /** Laid down by the auto-planner — re-planning a day replaces these, never the player's own. */
  auto: boolean;
  done: boolean;
  /** Exercise, goal and most roadmap slots: the catalog exercise it plays. */
  exerciseId?: string;
  /** Song slots, and roadmap steps about a song. */
  song?: CalendarSongRef;
  /** Goal slots: the tempo goal, and the milestone it was planned at. */
  goalId?: string;
  bpm?: number;
  /** Roadmap slots: which roadmap and which step. */
  roadmapId?: string;
  stepId?: string;
  /** Roadmap and custom slots: what the slot is called. Exercises are named from the catalog. */
  title?: string;
  /** Roadmap: the roadmap's name. Custom: the player's note. */
  note?: string;
}

/** Date keys are local calendar days, "YYYY-MM-DD". */
export type CalendarDays = Record<string, CalendarItem[]>;

/** How long the player has been at it — sets how hard the planned exercises are. */
export type PlayerLevel = "beginner" | "intermediate" | "advanced";

export const PLAYER_LEVELS: PlayerLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

/** How often the same exercise comes back within the planned days. */
export type PlanVariety = "steady" | "balanced" | "explore";

/** How hard and how long the blocks are. */
export type PlanIntensity = "light" | "steady" | "push";

/** Sunday = 0, as `Date.getDay()`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PlannerSourcesToggle {
  songs: boolean;
  goals: boolean;
  roadmaps: boolean;
}

/** Everything the auto-planner asks for; kept on the calendar doc, so the next fill starts where the last one was set. */
export interface PlannerPrefs {
  minutesPerDay: number;
  level: PlayerLevel;
  /** Areas that get a bigger share of the time. Empty = an even spread. */
  focus: PracticeArea[];
  sources: PlannerSourcesToggle;
  /** Advanced: a different length for some days of the week; 0 makes it a rest day. */
  minutesByWeekday: Partial<Record<Weekday, number>>;
  /** Advanced: open every day with a short, easy technique drill. */
  warmup: boolean;
  /** Advanced: how often an exercise may come back. */
  variety: PlanVariety;
  /** Advanced: block length and how hard the picked exercises are. */
  intensity: PlanIntensity;
  /** Advanced: at most this many slots a day, warm-up included. */
  maxItemsPerDay: number;
  /** Advanced: one lighter day a week, so the plan has room to breathe. */
  lightDay: boolean;
  /** Advanced: fill around what the player put on a day by hand, rather than over it. */
  keepManual: boolean;
  /** Advanced: only exercises that train one of these skills. Empty = any skill. */
  skills: string[];
}

/** `users/{uid}/settings/calendar` */
export interface CalendarDoc {
  days: CalendarDays;
  prefs: PlannerPrefs | null;
}
