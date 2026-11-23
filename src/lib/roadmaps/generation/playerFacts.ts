import type { RoadmapLevel } from "./levels";

/**
 * What the app already knows about a player, read off their own document and
 * turned into a few lines for the roadmap prompts — and into the level the
 * builder starts on.
 *
 * Nothing here is asked of the player: the level screen used to open on
 * "Intermediate" for everybody (seven of the first eight roadmaps were
 * Intermediate), and the generator knew nothing of what the account had
 * practised. Pure, shared by the browser (the default level) and the server
 * (the prompt lines).
 */

/** The fields of a `users` document this reads; everything is optional. */
export interface PlayerRecord {
  statistics?: {
    time?: Partial<
      Record<"technique" | "theory" | "hearing" | "creativity", number>
    >;
    sessionCount?: number;
    guitarStartDate?: unknown;
  };
  skills?: {
    /** Milliseconds practised per skill id. */
    timeSpent?: Record<string, number>;
    /** Level reached per skill id. */
    unlockedSkills?: Record<string, number>;
  };
}

const HOUR_MS = 3_600_000;
const YEAR_MS = 365.25 * 24 * HOUR_MS;

/** A Firestore Timestamp in any of the shapes it arrives in, as epoch ms. */
const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  const raw = value as {
    toMillis?: () => number;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof raw.toMillis === "function") return raw.toMillis();
  const seconds = raw.seconds ?? raw._seconds;
  return typeof seconds === "number" ? seconds * 1000 : null;
};

/** Years since the player said they started, or null when they never said. */
export const yearsPlaying = (
  record: PlayerRecord | null | undefined,
  now = Date.now(),
): number | null => {
  const started = toMillis(record?.statistics?.guitarStartDate);
  if (started === null || started > now) return null;
  return (now - started) / YEAR_MS;
};

/**
 * The level the builder starts on. Only what the account says about how long
 * the player has played moves it off "Intermediate" — and only downwards:
 * years with a guitar say when somebody is new, never that they are advanced.
 */
export const suggestRoadmapLevel = (
  record: PlayerRecord | null | undefined,
  now = Date.now(),
): RoadmapLevel => {
  const years = yearsPlaying(record, now);
  if (years === null) return "Intermediate";
  if (years < 0.25) return "Absolute Beginner";
  if (years < 1.5) return "Beginner";
  return "Intermediate";
};

const label = (skillId: string) => skillId.replace(/_/g, " ");

const hours = (ms: number) => Math.round((ms / HOUR_MS) * 10) / 10;

const AREAS = ["technique", "theory", "hearing", "creativity"] as const;
const AREA_LABEL: Record<(typeof AREAS)[number], string> = {
  technique: "technique",
  theory: "theory",
  hearing: "ear",
  creativity: "creative playing",
};

/** Below this the account has not practised enough here to say anything about the player. */
const MIN_HOURS_TO_SPEAK = 2;
const TOP_SKILLS = 4;

/**
 * The lines the prompts get, or an empty list for an account with nothing to
 * say. Each is a measured fact, phrased so the model cannot mistake practice
 * time in this app for the player's whole history with the instrument.
 */
export const playerFacts = (
  record: PlayerRecord | null | undefined,
  now = Date.now(),
): string[] => {
  if (!record) return [];
  const facts: string[] = [];

  const years = yearsPlaying(record, now);
  if (years !== null) {
    facts.push(
      years < 1
        ? `Has played guitar for about ${Math.max(1, Math.round(years * 12))} months.`
        : `Has played guitar for about ${Math.round(years)} years.`,
    );
  }

  const time = record.statistics?.time ?? {};
  const total = AREAS.reduce((sum, area) => sum + (time[area] ?? 0), 0);
  if (hours(total) >= MIN_HOURS_TO_SPEAK) {
    const split = AREAS.map((area) => ({ area, ms: time[area] ?? 0 }))
      .filter(({ ms }) => ms > 0)
      .sort((a, b) => b.ms - a.ms)
      .map(
        ({ area, ms }) =>
          `${AREA_LABEL[area]} ${Math.round((ms / total) * 100)}%`,
      )
      .join(", ");
    const sessions = record.statistics?.sessionCount;
    facts.push(
      `Logged ${hours(total)} hours in this app${
        sessions ? ` over ${sessions} sessions` : ""
      }: ${split}. (Time in the app only — not their whole history.)`,
    );

    const least = AREAS.map((area) => ({ area, ms: time[area] ?? 0 })).sort(
      (a, b) => a.ms - b.ms,
    )[0];
    if (least.ms / total < 0.08) {
      facts.push(
        `Almost never practises ${AREA_LABEL[least.area]} here (${Math.round((least.ms / total) * 100)}% of their time).`,
      );
    }
  }

  const spent = Object.entries(record.skills?.timeSpent ?? {})
    .filter(([, ms]) => typeof ms === "number" && ms >= 0.5 * HOUR_MS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_SKILLS);
  if (spent.length) {
    facts.push(
      `Most practised skills here: ${spent
        .map(([id, ms]) => `${label(id)} (${hours(ms)} h)`)
        .join(", ")}.`,
    );
  } else {
    const levels = Object.entries(record.skills?.unlockedSkills ?? {})
      .filter(([, level]) => typeof level === "number" && level >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_SKILLS);
    if (levels.length) {
      facts.push(
        `Highest skill levels in the app: ${levels
          .map(([id, level]) => `${label(id)} (level ${level})`)
          .join(", ")}.`,
      );
    }
  }

  return facts;
};

/** The facts as the prompt block reads them; empty when there are none. */
export const renderPlayerFacts = (facts: string[] | null | undefined): string =>
  (facts ?? []).map((fact) => `- ${fact}`).join("\n");
