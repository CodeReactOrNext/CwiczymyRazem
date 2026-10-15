import { isReadyToPublish } from "feature/communityExercises/utils/isReadyToPublish";
import { describe, expect, it } from "vitest";

const complete = {
  title: "Spider walk",
  description: "Finger independence across all six strings.",
  instructions: ["Play 1-2-3-4 on every string."],
};

describe("isReadyToPublish", () => {
  it("accepts an exercise with a title, description and a step", () => {
    expect(isReadyToPublish(complete)).toBe(true);
  });

  it("rejects a blank description", () => {
    expect(isReadyToPublish({ ...complete, description: "   " })).toBe(false);
  });

  it("rejects a missing title", () => {
    expect(isReadyToPublish({ ...complete, title: "" })).toBe(false);
  });

  it("rejects steps that are all blank", () => {
    expect(isReadyToPublish({ ...complete, instructions: ["", "  "] })).toBe(
      false,
    );
  });

  it("rejects an exercise saved without any steps", () => {
    expect(isReadyToPublish({ ...complete, instructions: [] })).toBe(false);
  });

  it("tolerates documents written without the steps field", () => {
    expect(
      isReadyToPublish({
        ...complete,
        instructions: undefined as unknown as string[],
      }),
    ).toBe(false);
  });
});
