import type { Recording } from "feature/recordings/types/types";
import type { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { recordingPopularity, sortByPopularity } from "./popularity";

const at = (millis: number) => ({ toMillis: () => millis }) as Timestamp;

const rec = (
  id: string,
  likes: number,
  commentCount: number,
  createdAt = 0,
): Pick<Recording, "id" | "likes" | "commentCount" | "createdAt"> => ({
  id,
  likes: Array.from({ length: likes }, (_, i) => `u${i}`),
  commentCount,
  createdAt: at(createdAt),
});

describe("recordingPopularity", () => {
  it("counts a comment as two likes", () => {
    expect(recordingPopularity(rec("a", 3, 2))).toBe(7);
  });

  it("survives missing fields on old documents", () => {
    expect(
      recordingPopularity({ likes: undefined, commentCount: undefined } as never),
    ).toBe(0);
  });
});

describe("sortByPopularity", () => {
  it("puts the highest score first", () => {
    const sorted = sortByPopularity([
      rec("likes-only", 3, 0),
      rec("talked-about", 0, 2),
      rec("quiet", 1, 0),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["talked-about", "likes-only", "quiet"]);
  });

  it("breaks ties with the newer recording", () => {
    const sorted = sortByPopularity([rec("old", 2, 0, 100), rec("new", 2, 0, 200)]);
    expect(sorted.map((r) => r.id)).toEqual(["new", "old"]);
  });

  it("does not mutate the input", () => {
    const input = [rec("a", 0, 0), rec("b", 5, 0)];
    sortByPopularity(input);
    expect(input.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
