import type {
  DifficultyLevel,
  Exercise,
  ExerciseCategory,
} from "feature/exercisePlan/types/exercise.types";

import type {
  CalendarDays,
  CalendarItem,
  CalendarSongRef,
  PlanIntensity,
  PlannerPrefs,
  PlanVariety,
  PlayerLevel,
  PracticeArea,
} from "../types/calendar.types";
import { PRACTICE_AREAS } from "../types/calendar.types";
import { weekdayOf } from "./calendarDates";

export type PlannerExercise = Pick<
  Exercise,
  "id" | "difficulty" | "category" | "timeInMinutes" | "songData"
> & { relatedSkills?: readonly string[] };

export interface PlannerSong {
  song: CalendarSongRef;
  /** Songs being learned come up more often than the ones on the wish list. */
  status: "learning" | "wantToLearn";
}

export interface PlannerGoal {
  goalId: string;
  exerciseId: string;
  title: string;
  /** The milestone the goal is on now. */
  bpm: number;
}

/** The step a started roadmap is on — what it plays, if it names anything. */
export interface PlannerRoadmapStep {
  roadmapId: string;
  roadmapTitle: string;
  stepId: string;
  title: string;
  exerciseId?: string;
  song?: CalendarSongRef;
}

export interface PlannerInput {
  dates: string[];
  prefs: PlannerPrefs;
  catalog: readonly PlannerExercise[];
  songs: PlannerSong[];
  goals: PlannerGoal[];
  roadmapSteps: PlannerRoadmapStep[];
  /** Epoch ms of the last session that played each exercise. */
  lastPracticed: Record<string, number>;
  now: number;
  /** What the days hold already — kept where the prefs say so. */
  existing: CalendarDays;
  seed: number;
}

export interface PlannerResult {
  days: CalendarDays;
  minutesByArea: Record<PracticeArea, number>;
  totalMinutes: number;
}

export const DEFAULT_PLANNER_PREFS: PlannerPrefs = {
  minutesPerDay: 30,
  level: "intermediate",
  focus: [],
  sources: { songs: true, goals: true, roadmaps: true },
  minutesByWeekday: {},
  warmup: true,
  variety: "balanced",
  intensity: "steady",
  maxItemsPerDay: 4,
  lightDay: false,
  keepManual: true,
  skills: [],
};

export const MIN_MINUTES_PER_DAY = 10;
export const MAX_MINUTES_PER_DAY = 180;
export const MIN_ITEMS_PER_DAY = 2;
export const MAX_ITEMS_PER_DAY = 8;
export const WARMUP_MINUTES = 5;

const DIFFICULTY_LADDER: DifficultyLevel[] = [
  "beginner",
  "easy",
  "medium",
  "hard",
];

/** Where each level's two rungs of the ladder start. */
const LEVEL_FLOOR: Record<PlayerLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const INTENSITY_SHIFT: Record<PlanIntensity, number> = {
  light: -1,
  steady: 0,
  push: 1,
};

/** Shortest and longest block, per intensity. */
const BLOCK_MINUTES: Record<PlanIntensity, { min: number; max: number }> = {
  light: { min: 5, max: 10 },
  steady: { min: 5, max: 15 },
  push: { min: 8, max: 20 },
};

const SONG_MINUTES: Record<PlayerLevel, number> = {
  beginner: 8,
  intermediate: 10,
  advanced: 12,
};

const SONG_INTENSITY_BONUS: Record<PlanIntensity, number> = {
  light: -3,
  steady: 0,
  push: 3,
};

/**
 * Relative share of the time each area gets before the player's focus. Fresh
 * players lean on technique and songs; theory and creativity grow with them.
 */
const AREA_WEIGHTS: Record<PlayerLevel, Record<PracticeArea, number>> = {
  beginner: {
    technique: 3.5,
    songs: 3,
    theory: 1,
    hearing: 0.75,
    creativity: 0.75,
  },
  intermediate: {
    technique: 3,
    songs: 2.5,
    theory: 1.5,
    hearing: 1,
    creativity: 1,
  },
  advanced: {
    technique: 3,
    songs: 2.5,
    theory: 2,
    hearing: 1.25,
    creativity: 1.5,
  },
};

const FOCUS_MULTIPLIER = 2.5;

/**
 * How the planner treats repeats: `pool` is how many exercises per area it
 * cycles through (Infinity = the whole catalog), `gap` how many days must pass
 * before an exercise comes back, `goalEvery` how often each goal is played.
 */
const VARIETY: Record<
  PlanVariety,
  { pool: number; gap: number; goalEvery: number; roadmapEvery: number }
> = {
  steady: { pool: 2, gap: 1, goalEvery: 1, roadmapEvery: 1 },
  balanced: { pool: 5, gap: 2, goalEvery: 2, roadmapEvery: 2 },
  explore: { pool: Infinity, gap: 5, goalEvery: 3, roadmapEvery: 2 },
};

const MAX_GOALS_PER_DAY = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A small, fast seeded PRNG (mulberry32) — the same seed lays out the same plan. */
export const seededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

export const categoryToArea = (category: ExerciseCategory): PracticeArea =>
  category === "mixed" ? "technique" : category;

/** The two rungs of difficulty a level plays at, nudged by intensity. */
export const difficultyWindow = (
  level: PlayerLevel,
  intensity: PlanIntensity,
): DifficultyLevel[] => {
  const floor = Math.min(
    DIFFICULTY_LADDER.length - 2,
    Math.max(0, LEVEL_FLOOR[level] + INTENSITY_SHIFT[intensity]),
  );
  return DIFFICULTY_LADDER.slice(floor, floor + 2);
};

/** The day's length: the weekday override when there is one, else the default. */
export const dayBudget = (prefs: PlannerPrefs, dateKey: string) => {
  const override = prefs.minutesByWeekday[weekdayOf(dateKey)];
  return typeof override === "number" ? override : prefs.minutesPerDay;
};

/**
 * The day that goes light when the prefs ask for one: a Wednesday or Thursday
 * in the range if there is one, else the middle day. Short ranges have none.
 */
export const pickLightDay = (dates: string[], prefs: PlannerPrefs) => {
  if (!prefs.lightDay) return null;
  const working = dates.filter((date) => dayBudget(prefs, date) > 0);
  if (working.length < 4) return null;
  return (
    working.find((date) => [3, 4].includes(weekdayOf(date))) ??
    working[Math.floor(working.length / 2)]
  );
};

export const areaTargets = (
  prefs: PlannerPrefs,
  available: Record<PracticeArea, boolean>,
): Record<PracticeArea, number> => {
  const weights = AREA_WEIGHTS[prefs.level];
  const raw = Object.fromEntries(
    PRACTICE_AREAS.map((area) => [
      area,
      available[area]
        ? weights[area] * (prefs.focus.includes(area) ? FOCUS_MULTIPLIER : 1)
        : 0,
    ]),
  ) as Record<PracticeArea, number>;
  const total = PRACTICE_AREAS.reduce((sum, area) => sum + raw[area], 0) || 1;
  return Object.fromEntries(
    PRACTICE_AREAS.map((area) => [area, raw[area] / total]),
  ) as Record<PracticeArea, number>;
};

const emptyAreaMinutes = (): Record<PracticeArea, number> => ({
  technique: 0,
  songs: 0,
  theory: 0,
  hearing: 0,
  creativity: 0,
});

/**
 * Lays out practice over a run of days. Commitments go in first — the open
 * tempo goals and the step each started roadmap is on, spaced out by the
 * variety setting — and the rest of each day is filled area by area, always
 * topping up whichever area is furthest behind its share of the whole range.
 * The balance is kept over the range rather than inside each day, so the days
 * differ from one another while the week adds up. Exercises come from the
 * level's difficulty window, longest-unplayed first, and don't repeat within
 * the variety's gap. Pure and seeded: the same input gives the same plan.
 */
export const planDays = (input: PlannerInput): PlannerResult => {
  const { prefs, dates, catalog, now } = input;
  const random = seededRandom(input.seed);
  const variety = VARIETY[prefs.variety];
  const block = BLOCK_MINUTES[prefs.intensity];
  const window = difficultyWindow(prefs.level, prefs.intensity);
  const warmupWindow: DifficultyLevel[] = ["beginner", "easy"];
  const seedTag = input.seed.toString(36);

  const exercisesById = new Map(
    catalog.map((exercise) => [exercise.id, exercise]),
  );
  const playable = catalog.filter((exercise) => !exercise.songData);
  // Picked skills narrow every exercise area to the drills that train them;
  // an area none of them trains drops out of the plan.
  const trainsPicked = (exercise: PlannerExercise) =>
    prefs.skills.length === 0 ||
    (exercise.relatedSkills ?? []).some((skill) =>
      prefs.skills.includes(skill),
    );

  // Per area: what the level plays, or the whole area when the window holds nothing.
  const byArea = new Map<PracticeArea, PlannerExercise[]>();
  PRACTICE_AREAS.filter((area) => area !== "songs").forEach((area) => {
    const inArea = playable.filter(
      (exercise) =>
        categoryToArea(exercise.category) === area && trainsPicked(exercise),
    );
    const atLevel = inArea.filter((exercise) =>
      window.includes(exercise.difficulty),
    );
    byArea.set(area, atLevel.length > 0 ? atLevel : inArea);
  });

  const stalenessDays = (exerciseId: string) => {
    const last = input.lastPracticed[exerciseId];
    return last ? Math.min(30, (now - last) / DAY_MS) : 30;
  };

  // The narrow pools of the steadier settings: the stalest few per area,
  // shuffled a little, kept for the whole range.
  const pools = new Map<PracticeArea, PlannerExercise[]>();
  byArea.forEach((exercises, area) => {
    const ranked = [...exercises]
      .map((exercise) => ({
        exercise,
        score: stalenessDays(exercise.id) + random() * 10,
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ exercise }) => exercise);
    pools.set(area, ranked.slice(0, variety.pool));
  });

  const songs = prefs.sources.songs ? input.songs : [];
  const goals = prefs.sources.goals
    ? input.goals.filter((goal) => exercisesById.has(goal.exerciseId))
    : [];
  const roadmapSteps = prefs.sources.roadmaps ? input.roadmapSteps : [];

  const available = Object.fromEntries(
    PRACTICE_AREAS.map((area) => [
      area,
      area === "songs" ? songs.length > 0 : (byArea.get(area)?.length ?? 0) > 0,
    ]),
  ) as Record<PracticeArea, boolean>;
  const targets = areaTargets(prefs, available);

  const planned = emptyAreaMinutes();
  let plannedTotal = 0;
  /** Index of the last day each exercise / song was laid on. */
  const lastUsedDay = new Map<string, number>();
  const usedCount = new Map<string, number>();
  const result: CalendarDays = {};
  const lightDay = pickLightDay(dates, prefs);
  let counter = 0;
  const nextId = () => `a-${seedTag}-${(counter++).toString(36)}`;

  const markUsed = (key: string, dayIndex: number) => {
    lastUsedDay.set(key, dayIndex);
    usedCount.set(key, (usedCount.get(key) ?? 0) + 1);
  };
  const count = (item: CalendarItem) => {
    planned[item.area] += item.minutes;
    plannedTotal += item.minutes;
  };
  const exerciseMinutes = (exercise: PlannerExercise) =>
    Math.min(
      block.max,
      Math.max(block.min, Math.round(exercise.timeInMinutes)),
    );
  const songMinutes = Math.max(
    5,
    SONG_MINUTES[prefs.level] + SONG_INTENSITY_BONUS[prefs.intensity],
  );
  const roadmapMinutes =
    prefs.intensity === "push" ? 15 : prefs.intensity === "light" ? 8 : 10;

  const pickExercise = (
    area: PracticeArea,
    dayIndex: number,
    takenToday: Set<string>,
  ): PlannerExercise | null => {
    const fromPool = pools.get(area) ?? [];
    const all = byArea.get(area) ?? [];
    const free = (exercise: PlannerExercise) => {
      if (takenToday.has(exercise.id)) return false;
      const last = lastUsedDay.get(exercise.id);
      return last === undefined || dayIndex - last >= variety.gap;
    };
    // The pool first; once every pool exercise sits inside its gap, the area at large.
    const candidates =
      fromPool.filter(free).length > 0
        ? fromPool.filter(free)
        : all.filter(free).length > 0
          ? all.filter(free)
          : all.filter((exercise) => !takenToday.has(exercise.id));
    if (candidates.length === 0) return null;

    let best: PlannerExercise | null = null;
    let bestScore = -Infinity;
    candidates.forEach((exercise) => {
      const score =
        stalenessDays(exercise.id) -
        (usedCount.get(exercise.id) ?? 0) *
          (prefs.variety === "steady" ? 0 : 4) +
        random() * 6;
      if (score > bestScore) {
        bestScore = score;
        best = exercise;
      }
    });
    return best;
  };

  const pickSong = (dayIndex: number, takenToday: Set<string>) => {
    const candidates = songs.filter(
      (entry) => !takenToday.has(`song:${entry.song.id}`),
    );
    if (candidates.length === 0) return null;
    let best: PlannerSong | null = null;
    let bestScore = -Infinity;
    candidates.forEach((entry) => {
      const last = lastUsedDay.get(`song:${entry.song.id}`);
      const rest = last === undefined ? 4 : Math.min(4, dayIndex - last);
      const score =
        (entry.status === "learning" ? 3 : 1) + rest * 1.5 + random() * 2;
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    });
    return best as PlannerSong | null;
  };

  dates.forEach((date, dayIndex) => {
    const existing = input.existing[date] ?? [];
    const kept = existing.filter(
      (item) => item.done || (prefs.keepManual && !item.auto),
    );
    const items: CalendarItem[] = [...kept];
    kept.forEach(count);

    let budget = dayBudget(prefs, date);
    if (date === lightDay) budget = Math.round((budget * 0.5) / 5) * 5;
    let remaining = budget - kept.reduce((sum, item) => sum + item.minutes, 0);
    const maxItems = prefs.maxItemsPerDay;
    const takenToday = new Set<string>(
      kept.flatMap((item) => [
        ...(item.exerciseId ? [item.exerciseId] : []),
        ...(item.song ? [`song:${item.song.id}`] : []),
      ]),
    );
    const areasToday = new Set<PracticeArea>(kept.map((item) => item.area));

    const room = (minutes: number) =>
      budget > 0 && items.length < maxItems && remaining >= minutes;
    const push = (item: CalendarItem) => {
      items.push(item);
      count(item);
      remaining -= item.minutes;
      areasToday.add(item.area);
      if (item.exerciseId) {
        takenToday.add(item.exerciseId);
        markUsed(item.exerciseId, dayIndex);
      }
      if (item.song) {
        takenToday.add(`song:${item.song.id}`);
        markUsed(`song:${item.song.id}`, dayIndex);
      }
    };

    // Warm-up: a short, easy technique drill to open the day.
    if (
      prefs.warmup &&
      budget >= 15 &&
      !kept.some((item) => item.role === "warmup")
    ) {
      const warmups = (byArea.get("technique") ?? []).filter(
        (exercise) =>
          warmupWindow.includes(exercise.difficulty) &&
          !takenToday.has(exercise.id),
      );
      const source =
        warmups.length > 0
          ? warmups
          : playable.filter((exercise) =>
              warmupWindow.includes(exercise.difficulty),
            );
      const fresh = source.filter((exercise) => {
        const last = lastUsedDay.get(exercise.id);
        return last === undefined || dayIndex - last >= 2;
      });
      const pool = fresh.length > 0 ? fresh : source;
      if (pool.length > 0 && room(WARMUP_MINUTES)) {
        const exercise = pool[Math.floor(random() * pool.length)];
        push({
          id: nextId(),
          kind: "exercise",
          area: categoryToArea(exercise.category),
          minutes: WARMUP_MINUTES,
          role: "warmup",
          auto: true,
          done: false,
          exerciseId: exercise.id,
        });
      }
    }

    // Tempo goals, each on its own beat so they interleave across the days.
    let goalsToday = 0;
    goals.forEach((goal, goalIndex) => {
      if (goalsToday >= MAX_GOALS_PER_DAY) return;
      if ((dayIndex + goalIndex) % variety.goalEvery !== 0) return;
      if (takenToday.has(goal.exerciseId)) return;
      const exercise = exercisesById.get(goal.exerciseId)!;
      const minutes = Math.min(remaining, exerciseMinutes(exercise));
      if (!room(Math.max(block.min, minutes)) || minutes < block.min) return;
      goalsToday += 1;
      push({
        id: nextId(),
        kind: "goal",
        area: categoryToArea(exercise.category),
        minutes,
        role: "main",
        auto: true,
        done: false,
        exerciseId: goal.exerciseId,
        goalId: goal.goalId,
        bpm: goal.bpm,
        title: goal.title,
      });
    });

    // One roadmap step a day at most, taking turns between started roadmaps.
    if (roadmapSteps.length > 0 && dayIndex % variety.roadmapEvery === 0) {
      const step =
        roadmapSteps[
          Math.floor(dayIndex / variety.roadmapEvery) % roadmapSteps.length
        ];
      const exercise = step.exerciseId
        ? exercisesById.get(step.exerciseId)
        : undefined;
      const area: PracticeArea = step.song
        ? "songs"
        : exercise
          ? categoryToArea(exercise.category)
          : "technique";
      const minutes = Math.min(remaining, roadmapMinutes);
      const alreadyToday =
        (exercise && takenToday.has(exercise.id)) ||
        (step.song && takenToday.has(`song:${step.song.id}`));
      if (!alreadyToday && minutes >= block.min && room(minutes)) {
        push({
          id: nextId(),
          kind: "roadmap",
          area,
          minutes,
          role: "main",
          auto: true,
          done: false,
          roadmapId: step.roadmapId,
          stepId: step.stepId,
          title: step.title,
          note: step.roadmapTitle,
          ...(exercise && { exerciseId: exercise.id }),
          ...(step.song && { song: step.song }),
        });
      }
    }

    // The rest: top up whichever area is furthest behind its share.
    let guard = 0;
    while (room(block.min) && guard++ < 20) {
      const projected = plannedTotal + remaining;
      const ranked = PRACTICE_AREAS.filter((area) => targets[area] > 0)
        .map((area) => ({
          area,
          deficit:
            targets[area] * projected -
            planned[area] -
            (areasToday.has(area) ? block.max : 0) +
            random() * 0.5,
        }))
        .sort((a, b) => b.deficit - a.deficit);

      let placed = false;
      for (const { area } of ranked) {
        const isLastSlot = items.length + 1 >= maxItems;
        const fit = (natural: number) => {
          let minutes = Math.min(natural, remaining);
          // Too little left after this block for another one: fold it in.
          if (isLastSlot || remaining - minutes < block.min)
            minutes = remaining;
          return minutes;
        };

        if (area === "songs") {
          const entry = pickSong(dayIndex, takenToday);
          if (!entry) continue;
          push({
            id: nextId(),
            kind: "song",
            area: "songs",
            minutes: fit(songMinutes),
            role: "main",
            auto: true,
            done: false,
            song: entry.song,
          });
          placed = true;
          break;
        }

        const exercise = pickExercise(area, dayIndex, takenToday);
        if (!exercise) continue;
        push({
          id: nextId(),
          kind: "exercise",
          area,
          minutes: fit(exerciseMinutes(exercise)),
          role: "main",
          auto: true,
          done: false,
          exerciseId: exercise.id,
        });
        placed = true;
        break;
      }
      if (!placed) break;
    }

    // Minutes still left over (the item cap was hit): spread over the main blocks.
    const mains = items.filter(
      (item) => item.auto && item.role === "main" && !item.done,
    );
    if (remaining > 0 && mains.length > 0 && budget > 0) {
      const share = Math.floor(remaining / mains.length);
      let extra = remaining - share * mains.length;
      mains.forEach((item) => {
        const add = share + (extra-- > 0 ? 1 : 0);
        item.minutes += add;
        planned[item.area] += add;
        plannedTotal += add;
      });
      remaining = 0;
    }

    result[date] = items;
  });

  return { days: result, minutesByArea: planned, totalMinutes: plannedTotal };
};
