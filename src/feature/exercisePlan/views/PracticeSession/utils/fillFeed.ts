import type { NoteTiming } from "./timingGrade";

/**
 * One move of a hit note's green fill, straight from the matching loop: the hit
 * itself, carrying its timing, and every step of the hold after it — each
 * stamped with the audio time it was judged at.
 *
 * The fill used to reach the tab only through React's copy of the hits, at most
 * 20 times a second, and the tab eased toward each copy: it grew in spurts and
 * showed a hit up to a flush late. With stamped steps the tab draws the fill
 * between them on its own clock (see liveNoteFills.ts).
 */
export interface FillStep {
  noteKey: string;
  /** AudioContext.currentTime the step was judged at. */
  audioSec: number;
  /** The beat the fill reaches, counted from the start of the tab. */
  beat: number;
  /** The step that hits the note; the ones after it only hold it. */
  hit?: true;
  /** The hit's timing — only on the hit, and only where the board shows timing. */
  timing?: NoteTiming;
}

/**
 * The steps in order, kept for a while and read by every tab board with its
 * own cursor: the desktop and phone boards can be mounted at once, and neither
 * may take steps away from the other.
 */
export interface FillFeed {
  steps: FillStep[];
  /** Sequence number of steps[0]. */
  base: number;
}

/** Steps kept for a reader that missed a few frames. */
const KEEP = 256;

export const createFillFeed = (): FillFeed => ({ steps: [], base: 0 });

export function pushFillStep(feed: FillFeed, step: FillStep): void {
  feed.steps.push(step);
  if (feed.steps.length >= KEEP * 2) {
    const drop = feed.steps.length - KEEP;
    feed.steps.splice(0, drop);
    feed.base += drop;
  }
}

/** Drops everything not yet read: none of it belongs to what comes next. */
export function clearFillFeed(feed: FillFeed): void {
  feed.base += feed.steps.length;
  feed.steps.length = 0;
}

/** Where a reader that joins now starts — only steps from here on are its own. */
export const fillFeedEnd = (feed: FillFeed): number => feed.base + feed.steps.length;

/** The steps from sequence number `from` on, and where to read from next time. */
export function readFillSteps(feed: FillFeed, from: number): { steps: FillStep[]; next: number } {
  const end = fillFeedEnd(feed);
  if (from >= end) return { steps: [], next: end };
  return { steps: feed.steps.slice(Math.max(0, from - feed.base)), next: end };
}
