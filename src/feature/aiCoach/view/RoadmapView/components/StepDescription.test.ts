import { describe, expect, it } from "vitest";

import { practiceSteps } from "./StepDescription";

describe("practiceSteps", () => {
  it("turns a paragraph of instructions into one step per sentence", () => {
    expect(
      practiceSteps([
        "Play the exercise first. Then hum the phrase and find the root. Check it against the recording.",
      ]),
    ).toEqual([
      "Play the exercise first.",
      "Then hum the phrase and find the root.",
      "Check it against the recording.",
    ]);
  });

  it("keeps abbreviations and numbers whole", () => {
    expect(
      practiceSteps([
        "Pick a slow tune, e.g. a ballad at 60 b.p.m. and loop it. Then speed up.",
      ]),
    ).toEqual([
      "Pick a slow tune, e.g. a ballad at 60 b.p.m. and loop it.",
      "Then speed up.",
    ]);
  });

  it("leaves a single sentence, several lines or a bullet list as they are", () => {
    expect(practiceSteps(["Just one sentence."])).toBeNull();
    expect(practiceSteps(["One.", "Two."])).toBeNull();
    expect(practiceSteps(["- A bullet. Another."])).toBeNull();
  });
});
