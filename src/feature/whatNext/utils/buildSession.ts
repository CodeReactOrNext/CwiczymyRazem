import type {
  CalendarItem,
  PracticeArea,
} from "feature/practiceCalendar/types/calendar.types";
import type {
  NextSessionItem,
  RankedAction,
} from "feature/whatNext/types/whatNext.types";

/** A slot shorter than this is not worth starting. */
const MIN_SLOT_MINUTES = 5;

export const SESSION_LENGTHS = [15, 30, 45] as const;

/** What a slot plays, so the same exercise or song never comes up twice. */
const playKey = (item: NextSessionItem): string => {
  switch (item.kind) {
    case "song":
      return `song:${item.song.id}`;
    case "roadmap":
      return item.song
        ? `song:${item.song.id}`
        : item.exerciseId
          ? `exercise:${item.exerciseId}`
          : `roadmap:${item.stepId}`;
    default:
      return `exercise:${item.exerciseId}`;
  }
};

export interface SessionPick {
  actionId: string;
  item: NextSessionItem;
}

/**
 * The best-ranked playable actions packed into `minutes`, in rank order.
 *
 * Greedy on purpose: the road is already sorted by what matters, so the
 * session is its top, cut to fit. A slot that would overrun is shortened to
 * what is left, as long as that is still a real slot.
 */
export const pickSessionItems = (
  ranked: RankedAction[],
  minutes: number,
): SessionPick[] => {
  const picks: SessionPick[] = [];
  const used = new Set<string>();
  let left = minutes;

  for (const action of ranked) {
    if (left < MIN_SLOT_MINUTES) break;
    const item = action.sessionItem;
    if (!item) continue;
    const key = playKey(item);
    if (used.has(key)) continue;
    used.add(key);
    const length = Math.min(item.minutes, left);
    picks.push({ actionId: action.id, item: { ...item, minutes: length } });
    left -= length;
  }

  // Time left over goes to the first slot rather than being thrown away.
  if (picks.length > 0 && left > 0) {
    picks[0] = {
      ...picks[0],
      item: { ...picks[0].item, minutes: picks[0].item.minutes + left },
    };
  }
  return picks;
};

const areaOf = (
  item: NextSessionItem,
  exerciseArea: (id: string) => PracticeArea,
): PracticeArea => {
  if (item.kind === "song" || (item.kind === "roadmap" && item.song))
    return "songs";
  if (item.kind === "roadmap" && !item.exerciseId) return "technique";
  return exerciseArea((item as { exerciseId: string }).exerciseId);
};

/**
 * The picks as calendar slots, so the calendar's own `buildDayPlan` turns them
 * into a session — one way of building a session for the whole app.
 */
export const toCalendarItems = (
  picks: SessionPick[],
  exerciseArea: (exerciseId: string) => PracticeArea,
): CalendarItem[] =>
  picks.map(({ item }, index) => {
    const base = {
      id: `what-next-${index}`,
      area: areaOf(item, exerciseArea),
      minutes: item.minutes,
      role: index === 0 ? ("warmup" as const) : ("main" as const),
      auto: true,
      done: false,
    };
    switch (item.kind) {
      case "exercise":
        return { ...base, kind: "exercise", exerciseId: item.exerciseId };
      case "goal":
        return {
          ...base,
          kind: "goal",
          exerciseId: item.exerciseId,
          goalId: item.goalId,
          bpm: item.bpm,
        };
      case "song":
        return {
          ...base,
          kind: "song",
          song: item.song,
          ...(item.songMode && { songMode: item.songMode }),
        };
      case "roadmap":
        return {
          ...base,
          kind: "roadmap",
          roadmapId: item.roadmapId,
          stepId: item.stepId,
          title: item.title,
          note: item.roadmapTitle,
          ...(item.exerciseId && { exerciseId: item.exerciseId }),
          ...(item.song && { song: item.song }),
          ...(item.songMode && { songMode: item.songMode }),
        };
      default: {
        const unreachable: never = item;
        return unreachable;
      }
    }
  });
