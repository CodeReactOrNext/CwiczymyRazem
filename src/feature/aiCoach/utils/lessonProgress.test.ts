// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import {
  clearLessonProgress,
  LESSON_POSITION_TTL_MS,
  LESSON_TIMER_TTL_MS,
  loadLessonProgress,
  saveLessonProgress,
} from "./lessonProgress";

const VIDEO = "abc123";
const NOW = 1_800_000_000_000;

describe("lessonProgress", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("restores the stopwatch and the video spot", () => {
    saveLessonProgress(
      VIDEO,
      { elapsedMs: 50 * 60_000, videoSeconds: 3012.7 },
      NOW,
    );

    expect(loadLessonProgress(VIDEO, NOW + 60_000)).toEqual({
      elapsedMs: 50 * 60_000,
      videoSeconds: 3012,
    });
  });

  it("keeps progress per video", () => {
    saveLessonProgress(VIDEO, { elapsedMs: 60_000, videoSeconds: 60 }, NOW);

    expect(loadLessonProgress("other", NOW)).toBeNull();
  });

  it("returns nothing when nothing was saved", () => {
    expect(loadLessonProgress(VIDEO, NOW)).toBeNull();
  });

  it("does not keep a window that was closed straight away", () => {
    saveLessonProgress(VIDEO, { elapsedMs: 2000, videoSeconds: 2 }, NOW);

    expect(loadLessonProgress(VIDEO, NOW)).toBeNull();
  });

  it("drops the stale stopwatch but keeps the video bookmark", () => {
    saveLessonProgress(
      VIDEO,
      { elapsedMs: 50 * 60_000, videoSeconds: 3000 },
      NOW,
    );

    expect(loadLessonProgress(VIDEO, NOW + LESSON_TIMER_TTL_MS + 1)).toEqual({
      elapsedMs: 0,
      videoSeconds: 3000,
    });
  });

  it("forgets everything once the bookmark expires", () => {
    saveLessonProgress(VIDEO, { elapsedMs: 60_000, videoSeconds: 3000 }, NOW);

    expect(
      loadLessonProgress(VIDEO, NOW + LESSON_POSITION_TTL_MS + 1),
    ).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("clears progress after the lesson is logged", () => {
    saveLessonProgress(VIDEO, { elapsedMs: 60_000, videoSeconds: 60 }, NOW);
    clearLessonProgress(VIDEO);

    expect(loadLessonProgress(VIDEO, NOW)).toBeNull();
  });

  it("ignores a corrupted entry", () => {
    localStorage.setItem(`rq_lesson_progress_${VIDEO}`, "{not json");

    expect(loadLessonProgress(VIDEO, NOW)).toBeNull();
  });

  it("treats junk numbers as zero", () => {
    localStorage.setItem(
      `rq_lesson_progress_${VIDEO}`,
      JSON.stringify({ elapsedMs: "lots", videoSeconds: -40, savedAt: NOW }),
    );

    expect(loadLessonProgress(VIDEO, NOW)).toBeNull();
  });
});
