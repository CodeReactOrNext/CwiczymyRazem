import type { SongArrangement, SongPart } from "feature/songs/types/songs.type";
import type { MasteryLevel, SongSection } from "feature/songs/types/songSection.type";

/** Progress of one arrangement (lead / rhythm / bass) of a song. */
export interface ArrangementProgress {
  totalPracticeMs: number;
  sessionCount: number;
  lastPracticedAt: Date | null;
  /** "I can play this" marks scoped to this arrangement. */
  parts: SongPart[];
}

export type ArrangementProgressMap = Partial<Record<SongArrangement, ArrangementProgress>>;

export const ARRANGEMENT_ORDER: SongArrangement[] = ["lead", "rhythm", "bass"];

export const ARRANGEMENT_META: Record<
  SongArrangement,
  {
    label: string;
    /** One-letter tag for tight rows. */
    short: string;
    hint: string;
    text: string;
    dot: string;
  }
> = {
  lead: {
    label: "Lead",
    short: "L",
    hint: "Melodies, licks and solos",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  rhythm: {
    label: "Rhythm",
    short: "R",
    hint: "Chords, riffs and the groove",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
  },
  bass: {
    label: "Bass",
    short: "B",
    hint: "The bass line",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
};

export const isSongArrangement = (value: unknown): value is SongArrangement =>
  typeof value === "string" && (ARRANGEMENT_ORDER as string[]).includes(value);

/** Reads an arrangement off a query param / stored value, dropping anything unknown. */
export const parseArrangement = (value: unknown): SongArrangement | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  return isSongArrangement(raw) ? raw : undefined;
};

type RawTimestamp = { toDate?: () => Date } | Date | null | undefined;

const toDate = (value: RawTimestamp): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  return value.toDate?.() ?? null;
};

/** Firestore `arrangements` map → typed progress, skipping unknown keys and malformed entries. */
export const toArrangementProgressMap = (raw: unknown): ArrangementProgressMap => {
  if (!raw || typeof raw !== "object") return {};
  const map: ArrangementProgressMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isSongArrangement(key) || !value || typeof value !== "object") continue;
    const data = value as Record<string, unknown>;
    map[key] = {
      totalPracticeMs: typeof data.totalPracticeMs === "number" ? data.totalPracticeMs : 0,
      sessionCount: typeof data.sessionCount === "number" ? data.sessionCount : 0,
      lastPracticedAt: toDate(data.lastPracticedAt as RawTimestamp),
      parts: Array.isArray(data.parts) ? (data.parts as SongPart[]) : [],
    };
  }
  return map;
};

/** Arrangements that got any time, in display order. */
export const getPracticedArrangements = (
  arrangements: ArrangementProgressMap | undefined
): { arrangement: SongArrangement; progress: ArrangementProgress }[] =>
  ARRANGEMENT_ORDER.flatMap((arrangement) => {
    const progress = arrangements?.[arrangement];
    return progress && (progress.totalPracticeMs > 0 || progress.sessionCount > 0)
      ? [{ arrangement, progress }]
      : [];
  });

/** A section's mastery for the given arrangement, or for the song as a whole when none is picked. */
export const getSectionMastery = (
  section: SongSection,
  arrangement: SongArrangement | null
): MasteryLevel =>
  arrangement ? section.arrangementMastery?.[arrangement] ?? 0 : section.mastery;

export const setSectionMastery = (
  section: SongSection,
  arrangement: SongArrangement | null,
  mastery: MasteryLevel
): SongSection =>
  arrangement
    ? {
        ...section,
        arrangementMastery: { ...section.arrangementMastery, [arrangement]: mastery },
      }
    : { ...section, mastery };

/**
 * Weighted mastery of the mapped sections (Mastered = 100%, Medium = 67%, …)
 * for one arrangement or the whole song. Skipped sections don't count.
 * `null` when there's nothing to measure.
 */
export const getSectionsMasteryPct = (
  sections: SongSection[],
  arrangement: SongArrangement | null
): number | null => {
  const levels = sections
    .map((section) => getSectionMastery(section, arrangement))
    .filter((level) => level !== 4);
  if (levels.length === 0) return null;
  const weighted = levels.reduce<number>((sum, level) => sum + level / 3, 0);
  return Math.round((weighted / levels.length) * 100);
};

/** "1h 20 min" / "45 min" / "<1 min" — play time in the song views. */
export const formatPlayTime = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return "<1 min";
};
