import type { HabbitsType } from "feature/user/view/ReportView/ReportView.types";

import { ACHIEVEMENT_CATEGORIES } from "../data/achievementCategories";
import { achievementsData } from "../data/achievementsData";
import type { AchievementsRarityType } from "../data/achievementsRarity";
import { getGlobalUnlockRate } from "../data/globalUnlockRate";
import type {
  AchievementCategory,
  AchievementContext,
  AchievementEntryState,
  AchievementList,
  AchievementProgress,
  AchievementsDataInterface,
} from "../types";

type Rarity = AchievementsRarityType["rarity"];

const RARITY_ORDER: Rarity[] = ["common", "rare", "veryRare", "epic"];

/**
 * Every habit the report form offers.
 *
 * Written as a record so that widening `HabbitsType` fails to compile here
 * instead of silently weakening the probe below.
 */
const ALL_HABITS_MAP: Record<HabbitsType, true> = {
  exercise_plan: true,
  new_things: true,
  warmup: true,
  metronome: true,
  recording: true,
};

const ALL_HABITS = Object.keys(ALL_HABITS_MAP) as HabbitsType[];

export interface AchievementPanelEntry {
  data: AchievementsDataInterface;
  state: AchievementEntryState;
  /** Only on `progress` entries, already clamped so a bar can never overrun. */
  progress?: AchievementProgress;
  /** Share of players holding this badge — a placeholder for now. */
  globalRate: number;
}

export interface AchievementPanelCategory {
  category: AchievementCategory;
  owned: number;
  total: number;
  entries: AchievementPanelEntry[];
}

export interface AchievementRarityTally {
  rarity: Rarity;
  owned: number;
  total: number;
}

export interface AchievementPanelState {
  owned: number;
  total: number;
  rarities: AchievementRarityTally[];
  /** Conditions already met — these land on the next report. */
  ready: AchievementPanelEntry[];
  categories: AchievementPanelCategory[];
}

/**
 * The same context with the most generous session the report form can express.
 *
 * Some checks read the session, and a few of them read it as a *ceiling* rather
 * than a floor — `short` wants a report worth 15 points or fewer. Testing only
 * against an empty session would call those "ready" and then quietly fail to
 * grant them the moment a real session is logged, so a badge is only promised
 * when it survives both extremes.
 */
const withGenerousSession = (ctx: AchievementContext): AchievementContext => ({
  ...ctx,
  sessionResults: {
    ...ctx.sessionResults,
    totalPoints: Number.MAX_SAFE_INTEGER,
    bonusPoints: {
      ...ctx.sessionResults.bonusPoints,
      habitsCount: ALL_HABITS.length,
    },
  },
  inputData: {
    ...ctx.inputData,
    techniqueHours: "23",
    techniqueMinutes: "59",
    theoryHours: "23",
    theoryMinutes: "59",
    hearingHours: "23",
    hearingMinutes: "59",
    creativityHours: "23",
    creativityMinutes: "59",
    habbits: [...ALL_HABITS],
    songId: "panel-probe",
  },
});

const clampProgress = (progress: AchievementProgress): AchievementProgress => ({
  ...progress,
  current: Math.max(0, Math.min(progress.current, progress.max)),
});

/**
 * Commonest first, the way a global achievement list is read: the top of a
 * category is what nearly everyone has, the bottom is what almost nobody does.
 * Ties break on the id so the order is total and cannot wobble between renders.
 */
const byGlobalRate = (a: AchievementPanelEntry, b: AchievementPanelEntry) =>
  b.globalRate - a.globalRate || a.data.id.localeCompare(b.data.id);

/**
 * Turns the registry plus one account's state into everything the panel draws.
 *
 * `context` is null until the profile's stats and stash have loaded. Without it
 * nothing can be evaluated, so every unowned badge reads as `locked` and the
 * panel still renders its counts rather than an empty frame.
 */
export const buildAchievementPanelState = (
  ownedIds: AchievementList[],
  context: AchievementContext | null,
  definitions: AchievementsDataInterface[] = achievementsData,
): AchievementPanelState => {
  const owned = new Set(ownedIds);
  const generous = context ? withGenerousSession(context) : null;

  const entries: AchievementPanelEntry[] = definitions.map((data) => {
    const globalRate = getGlobalUnlockRate(data.id, data.rarity);

    if (owned.has(data.id)) return { data, globalRate, state: "owned" };
    if (!context) return { data, globalRate, state: "locked" };

    if (data.check(context) && generous && data.check(generous)) {
      return { data, globalRate, state: "ready" };
    }

    if (data.getProgress) {
      return {
        data,
        globalRate,
        state: "progress",
        progress: clampProgress(data.getProgress(context)),
      };
    }

    return { data, globalRate, state: "locked" };
  });

  const categories = ACHIEVEMENT_CATEGORIES.map((category) => {
    const inCategory = entries.filter((e) => e.data.category === category);
    return {
      category,
      owned: inCategory.filter((e) => e.state === "owned").length,
      total: inCategory.length,
      entries: inCategory.slice().sort(byGlobalRate),
    };
  })
    .filter((c) => c.total > 0)
    // Least complete first: the category that still owes the player something
    // belongs at the top, which is information rather than decoration.
    .sort((a, b) => a.owned / a.total - b.owned / b.total);

  const rarities = RARITY_ORDER.map((rarity) => {
    const inRarity = entries.filter((e) => e.data.rarity === rarity);
    return {
      rarity,
      owned: inRarity.filter((e) => e.state === "owned").length,
      total: inRarity.length,
    };
  }).filter((r) => r.total > 0);

  return {
    owned: entries.filter((e) => e.state === "owned").length,
    total: entries.length,
    rarities,
    ready: entries.filter((e) => e.state === "ready").sort(byGlobalRate),
    categories,
  };
};
