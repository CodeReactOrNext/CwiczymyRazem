import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { songToExercise } from "feature/exercisePlan/utils/songToExercise";

import type {
  FreshnessLevel,
  ItemFreshness,
  LastPracticedMap,
  RotationEntry,
  RotationItem,
} from "../types/rotation.types";
import { CUSTOM_EXERCISE_PREFIX } from "./lastPracticed";

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Played within this many days: fresh. */
export const COOLING_AFTER_DAYS = 7;
/** Not played for this many days: rusty. */
export const RUSTY_AFTER_DAYS = 21;
/** A song gets a short slot — rotation refreshes what you know, it doesn't teach it. */
export const ROTATION_SONG_MINUTES = 5;
/** A timed custom item's slot when it shares a session with others (alone it runs on the free timer). */
export const CUSTOM_SLOT_MINUTES = 10;
/** How many items "Play the stalest" puts in one session. */
export const STALEST_SESSION_SIZE = 3;
/** Keeps the settings doc small and the list scannable. */
export const MAX_ROTATION_ITEMS = 60;

export const FRESHNESS_LEVELS: FreshnessLevel[] = ["rusty", "cooling", "fresh"];

export const emptyLastPracticed = (): LastPracticedMap => ({
  song: {},
  exercise: {},
  skill: {},
  custom: {},
});

/**
 * Whether an item can go into a practice session. A custom item without the
 * timer is only ever ticked off, so it stays out of sessions, bundles and the
 * hand of cards — the list and the draw still show it.
 */
export const isSessionPlayable = (item: RotationItem) =>
  item.type !== "custom" || item.timer === true;

/** A link shown by its site: "justinguitar.com" rather than the whole URL. */
export const linkLabel = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
};

/** A timed custom item as a session slot: its name, its note, a link to its material. */
export const customToExercise = (item: RotationItem): Exercise => ({
  id: `${CUSTOM_EXERCISE_PREFIX}${item.id}`,
  title: item.title ?? "",
  description: item.note ?? "",
  difficulty: "medium",
  category: item.category ?? "technique",
  timeInMinutes: CUSTOM_SLOT_MINUTES,
  instructions: item.note ? [item.note] : [],
  tips: [],
  metronomeSpeed: null,
  relatedSkills: [],
  ...(item.link && {
    links: [{ label: linkLabel(item.link), url: item.link }],
  }),
});

/**
 * A link the player typed, as a full http(s) URL — "justinguitar.com/lesson"
 * gets its https:// — or `null` when it isn't one.
 */
export const normalizeLink = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    const isWeb = url.protocol === "https:" || url.protocol === "http:";
    return isWeb && url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
};

export const rotationKey = (item: Pick<RotationItem, "type" | "id">) =>
  `${item.type}:${item.id}`;

/**
 * How long ago an item was played and what that makes it. An item never played
 * since it was added counts from the day it was added — it is rusty from the
 * start, because putting something in rotation means wanting to play it.
 */
export const getFreshness = (
  item: RotationItem,
  lastPracticed: LastPracticedMap,
  now: number,
): ItemFreshness => {
  const last = lastPracticed[item.type]?.[item.id];
  const lastPracticedAt = typeof last === "number" && last > 0 ? last : null;
  const since = lastPracticedAt ?? item.addedAt;
  const elapsedDays = Math.max(0, (now - since) / DAY_MS);
  const days = Math.floor(elapsedDays);

  const level: FreshnessLevel =
    lastPracticedAt === null || days >= RUSTY_AFTER_DAYS
      ? "rusty"
      : days >= COOLING_AFTER_DAYS
        ? "cooling"
        : "fresh";

  const freshness =
    lastPracticedAt === null
      ? 0
      : Math.min(1, Math.max(0, 1 - elapsedDays / RUSTY_AFTER_DAYS));

  return { lastPracticedAt, days, level, freshness };
};

/** Oldest first: never-played items lead, then the longest-unplayed. */
export const sortByStaleness = (entries: RotationEntry[]): RotationEntry[] =>
  [...entries].sort((a, b) => {
    const aLast = a.freshness.lastPracticedAt;
    const bLast = b.freshness.lastPracticedAt;
    if (aLast === null && bLast === null)
      return a.item.addedAt - b.item.addedAt;
    if (aLast === null) return -1;
    if (bLast === null) return 1;
    return aLast - bLast;
  });

export const toRotationEntries = (
  items: RotationItem[],
  lastPracticed: LastPracticedMap,
  now: number,
): RotationEntry[] =>
  sortByStaleness(
    items.map((item) => ({
      item,
      freshness: getFreshness(item, lastPracticed, now),
    })),
  );

export const groupByLevel = (
  entries: RotationEntry[],
): Record<FreshnessLevel, RotationEntry[]> => {
  const groups: Record<FreshnessLevel, RotationEntry[]> = {
    rusty: [],
    cooling: [],
    fresh: [],
  };
  entries.forEach((entry) => groups[entry.freshness.level].push(entry));
  return groups;
};

/** The longer something sat untouched, the likelier it is drawn. */
const drawWeight = ({ freshness }: RotationEntry) =>
  freshness.lastPracticedAt === null ? 45 : 1 + Math.min(freshness.days, 60);

/**
 * A random card from the deck, leaning towards what has gone stale. The card
 * just shown is skipped when there is anything else to show.
 */
export const drawCard = (
  entries: RotationEntry[],
  random: () => number = Math.random,
  previousKey?: string,
): RotationEntry | null => {
  const pool =
    entries.length > 1 && previousKey
      ? entries.filter((entry) => rotationKey(entry.item) !== previousKey)
      : entries;
  if (pool.length === 0) return null;

  const total = pool.reduce((sum, entry) => sum + drawWeight(entry), 0);
  let roll = random() * total;
  for (const entry of pool) {
    roll -= drawWeight(entry);
    if (roll < 0) return entry;
  }
  return pool[pool.length - 1];
};

/**
 * The exercise a skill item plays: one that trains the skill, the one played
 * least recently (a random one among equals, so a fresh skill doesn't open on
 * the same drill every time). Exercises already in the session are skipped
 * while there are others to choose from.
 */
export const pickSkillExercise = (
  skillId: string,
  catalog: readonly Exercise[],
  lastPracticed: LastPracticedMap,
  random: () => number = Math.random,
  exclude: ReadonlySet<string> = new Set(),
): Exercise | null => {
  const trainsSkill = catalog.filter(
    (exercise) =>
      !exercise.songData &&
      exercise.relatedSkills.some((skill) => skill === skillId),
  );
  const available = trainsSkill.filter((exercise) => !exclude.has(exercise.id));
  const candidates = available.length > 0 ? available : trainsSkill;
  if (candidates.length === 0) return null;

  const playedAt = (exercise: Exercise) =>
    lastPracticed.exercise[exercise.id] ?? 0;
  const oldest = Math.min(...candidates.map(playedAt));
  const stalest = candidates.filter(
    (exercise) => playedAt(exercise) === oldest,
  );
  return stalest[
    Math.min(stalest.length - 1, Math.floor(random() * stalest.length))
  ];
};

/**
 * Turns rotation items into one practice session. Songs become song items (the
 * session shows the attached tab, or the song panel), skills become one of
 * their exercises, timed custom items a slot of their own; untimed ones sit
 * sessions out. Items that no longer resolve — an exercise taken out of the
 * catalog, a skill with nothing to play — are left out.
 */
export const buildRotationPlan = (
  items: RotationItem[],
  catalog: readonly Exercise[],
  lastPracticed: LastPracticedMap,
  now: number,
  random: () => number = Math.random,
): ExercisePlan | null => {
  const used = new Set<string>();
  const exercises: Exercise[] = [];

  for (const item of items) {
    let exercise: Exercise | null = null;
    if (item.type === "exercise") {
      exercise = catalog.find((candidate) => candidate.id === item.id) ?? null;
    } else if (item.type === "skill") {
      exercise = pickSkillExercise(
        item.id,
        catalog,
        lastPracticed,
        random,
        used,
      );
    } else if (item.type === "custom") {
      exercise = isSessionPlayable(item) ? customToExercise(item) : null;
    } else {
      exercise = songToExercise(
        {
          id: item.id,
          title: item.title ?? "",
          artist: item.artist ?? "",
          ...(item.coverUrl ? { coverUrl: item.coverUrl } : {}),
        },
        ROTATION_SONG_MINUTES,
      );
    }

    if (!exercise || used.has(exercise.id)) continue;
    used.add(exercise.id);
    exercises.push(exercise);
  }

  if (exercises.length === 0) return null;

  return {
    id: `rotation-${now}`,
    title: "Rotation",
    description: "",
    difficulty: "medium",
    category: "mixed",
    exercises,
    userId: "system",
    image: null,
  };
};

export const planMinutes = (plan: Pick<ExercisePlan, "exercises">) =>
  Math.round(
    plan.exercises.reduce((sum, exercise) => sum + exercise.timeInMinutes, 0),
  );
