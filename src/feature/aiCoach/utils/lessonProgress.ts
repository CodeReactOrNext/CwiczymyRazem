/**
 * Where a player got to in a lesson window: the stopwatch that hasn't been
 * logged yet and the spot in the video. Kept per video in this browser, so
 * closing the window (on purpose or by a stray click) doesn't throw away an
 * hour of practice — reopening the lesson carries on from there.
 */

const STORAGE_PREFIX = "rq_lesson_progress_";

/**
 * Unlogged practice time belongs to the day it happened. Past this it is
 * dropped rather than logged into a much later session.
 */
export const LESSON_TIMER_TTL_MS = 12 * 60 * 60 * 1000;

/** The video spot is only a bookmark, so it outlives the stopwatch. */
export const LESSON_POSITION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Below both of these there is nothing worth coming back to. */
const MIN_ELAPSED_MS = 5000;
const MIN_VIDEO_SECONDS = 5;

export interface LessonProgress {
  elapsedMs: number;
  videoSeconds: number;
}

interface StoredLessonProgress extends LessonProgress {
  savedAt: number;
}

const storageKey = (videoId: string) => `${STORAGE_PREFIX}${videoId}`;

const nonNegative = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

const isWorthKeeping = ({ elapsedMs, videoSeconds }: LessonProgress) =>
  elapsedMs >= MIN_ELAPSED_MS || videoSeconds >= MIN_VIDEO_SECONDS;

export function clearLessonProgress(videoId: string): void {
  try {
    localStorage.removeItem(storageKey(videoId));
  } catch {
    // Storage blocked (private window, site data off) — nothing to clear.
  }
}

export function loadLessonProgress(
  videoId: string,
  now: number = Date.now(),
): LessonProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(videoId));
    if (!raw) return null;

    const saved = JSON.parse(raw) as Partial<StoredLessonProgress> | null;
    const savedAt = saved?.savedAt;
    if (typeof savedAt !== "number" || !Number.isFinite(savedAt)) {
      clearLessonProgress(videoId);
      return null;
    }

    const age = now - savedAt;
    if (age > LESSON_POSITION_TTL_MS) {
      clearLessonProgress(videoId);
      return null;
    }

    const progress: LessonProgress = {
      elapsedMs: age > LESSON_TIMER_TTL_MS ? 0 : nonNegative(saved?.elapsedMs),
      videoSeconds: nonNegative(saved?.videoSeconds),
    };
    return isWorthKeeping(progress) ? progress : null;
  } catch {
    return null;
  }
}

export function saveLessonProgress(
  videoId: string,
  progress: LessonProgress,
  now: number = Date.now(),
): void {
  const cleaned: LessonProgress = {
    elapsedMs: Math.round(nonNegative(progress.elapsedMs)),
    videoSeconds: Math.floor(nonNegative(progress.videoSeconds)),
  };

  if (!isWorthKeeping(cleaned)) {
    clearLessonProgress(videoId);
    return;
  }

  try {
    const stored: StoredLessonProgress = { ...cleaned, savedAt: now };
    localStorage.setItem(storageKey(videoId), JSON.stringify(stored));
  } catch {
    // Quota or blocked storage — the window still works, it just won't resume.
  }
}
