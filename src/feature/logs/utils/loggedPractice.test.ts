import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  getLessonTitle,
  LESSON_TITLE_PREFIX,
  resolveLoggedExercises,
  sanitizeLessonVideoId,
  sanitizeLoggedExerciseIds,
} from "./loggedPractice";

const exercise = (id: string): Exercise =>
  ({ id, title: `Exercise ${id}` }) as Exercise;

describe("sanitizeLoggedExerciseIds", () => {
  it("keeps the session's order and its repeats", () => {
    expect(sanitizeLoggedExerciseIds(["a", "b", "a"])).toEqual(["a", "b", "a"]);
  });

  it("drops anything that isn't a short, non-empty string", () => {
    expect(
      sanitizeLoggedExerciseIds([
        "a",
        1,
        null,
        "",
        { id: "b" },
        "x".repeat(101),
      ]),
    ).toEqual(["a"]);
  });

  it("caps a runaway list", () => {
    const ids = Array.from({ length: 50 }, (_, i) => `ex${i}`);

    expect(sanitizeLoggedExerciseIds(ids)).toHaveLength(30);
  });

  it("returns undefined when nothing usable is left", () => {
    expect(sanitizeLoggedExerciseIds(undefined)).toBeUndefined();
    expect(sanitizeLoggedExerciseIds("a")).toBeUndefined();
    expect(sanitizeLoggedExerciseIds([1, 2])).toBeUndefined();
  });
});

describe("sanitizeLessonVideoId", () => {
  it("accepts a YouTube video id", () => {
    expect(sanitizeLessonVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(sanitizeLessonVideoId("a-b_c-d_e-f")).toBe("a-b_c-d_e-f");
  });

  it("rejects anything else", () => {
    expect(sanitizeLessonVideoId("short")).toBeUndefined();
    expect(sanitizeLessonVideoId("dQw4w9WgXcQ&autoplay=1")).toBeUndefined();
    expect(sanitizeLessonVideoId("../../etc/pa")).toBeUndefined();
    expect(sanitizeLessonVideoId(42)).toBeUndefined();
  });
});

describe("getLessonTitle", () => {
  it("strips the prefix a lesson session is filed under", () => {
    expect(getLessonTitle(`${LESSON_TITLE_PREFIX}Sweep Picking 101`)).toBe(
      "Sweep Picking 101",
    );
  });

  it("is null for every other session title", () => {
    expect(getLessonTitle("Morning Warmup")).toBeNull();
    expect(getLessonTitle("Song: Metallica - One")).toBeNull();
    expect(getLessonTitle(undefined)).toBeNull();
    expect(getLessonTitle(`${LESSON_TITLE_PREFIX}  `)).toBeNull();
  });
});

describe("resolveLoggedExercises", () => {
  const catalog = new Map([
    ["a", exercise("a")],
    ["b", exercise("b")],
  ]);

  it("maps ids to catalog exercises in session order", () => {
    expect(
      resolveLoggedExercises(["b", "a", "b"], catalog).map((ex) => ex.id),
    ).toEqual(["b", "a", "b"]);
  });

  it("skips ids the catalog doesn't know", () => {
    expect(
      resolveLoggedExercises(["custom-1", "a", "song-x"], catalog).map(
        (ex) => ex.id,
      ),
    ).toEqual(["a"]);
  });

  it("is empty for older logs that carry no ids", () => {
    expect(resolveLoggedExercises(undefined, catalog)).toEqual([]);
  });
});
