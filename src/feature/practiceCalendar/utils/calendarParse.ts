import type {
  CalendarDays,
  CalendarItem,
  CalendarItemKind,
  CalendarLinks,
} from "../types/calendar.types";
import { PRACTICE_AREAS } from "../types/calendar.types";

/**
 * Reads the stored calendar doc defensively — shared by the app and the MCP
 * server, so a slot either side writes reads back the same.
 */
const KINDS: CalendarItemKind[] = [
  "exercise",
  "song",
  "goal",
  "roadmap",
  "custom",
];
export const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const str = (value: unknown) =>
  typeof value === "string" && value ? value : undefined;

export const parseItem = (raw: unknown): CalendarItem | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const kind = KINDS.find((candidate) => candidate === data.kind);
  const area = PRACTICE_AREAS.find((candidate) => candidate === data.area);
  if (!kind || !area || typeof data.id !== "string") return null;
  if (typeof data.minutes !== "number" || data.minutes <= 0) return null;

  const song = data.song as Record<string, unknown> | undefined;
  return {
    id: data.id,
    kind,
    area,
    minutes: Math.round(data.minutes),
    role: data.role === "warmup" ? "warmup" : "main",
    auto: data.auto === true,
    done: data.done === true,
    ...(str(data.exerciseId) && { exerciseId: str(data.exerciseId) }),
    ...(song &&
      str(song.id) && {
        song: {
          id: song.id as string,
          title: str(song.title) ?? "",
          artist: str(song.artist) ?? "",
          ...(str(song.coverUrl) && { coverUrl: str(song.coverUrl) }),
        },
      }),
    ...((data.songMode === "gp" || data.songMode === "sections") && {
      songMode: data.songMode,
    }),
    ...(str(data.goalId) && { goalId: str(data.goalId) }),
    ...(typeof data.bpm === "number" && { bpm: data.bpm }),
    ...(str(data.roadmapId) && { roadmapId: str(data.roadmapId) }),
    ...(str(data.stepId) && { stepId: str(data.stepId) }),
    ...(str(data.title) && { title: str(data.title) }),
    ...(str(data.note) && { note: str(data.note) }),
  };
};

export const parseDays = (raw: unknown): CalendarDays => {
  const days: CalendarDays = {};
  if (!raw || typeof raw !== "object") return days;
  Object.entries(raw as Record<string, unknown>).forEach(([key, items]) => {
    if (!DATE_KEY.test(key) || !Array.isArray(items)) return;
    days[key] = items
      .map(parseItem)
      .filter((item): item is CalendarItem => item !== null);
  });
  return days;
};

export const parseLinks = (raw: unknown): CalendarLinks => {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        DATE_KEY.test(entry[0]) && !!str(entry[1]),
    ),
  );
};
