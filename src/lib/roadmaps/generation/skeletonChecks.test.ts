import { describe, expect, it } from "vitest";

import type { RoadmapBrief } from "./brief";
import { INCLUDE_OPTIONS } from "./questionBank";
import { checkSkeleton, songDeadlinePhase } from "./skeletonChecks";
import type { StructurePhase, StructureStep } from "./structure";

const step = (
  title: string,
  overrides: Partial<StructureStep> = {},
): StructureStep => ({
  title,
  skillType: "physical",
  suggestedExerciseId: null,
  exerciseWhy: "",
  songTitle: null,
  songArtist: null,
  ...overrides,
});

const plan = (phases: StructureStep[][]): StructurePhase[] =>
  phases.map((steps, index) => ({ title: `Phase ${index + 1}`, steps }));

const brief = (overrides: Partial<RoadmapBrief> = {}): RoadmapBrief => ({
  answers: [],
  songs: [],
  otherSongs: "",
  notes: "",
  ...overrides,
});

const song = (title: string) => ({
  songTitle: title,
  songArtist: "Dire Straits",
});

describe("songDeadlinePhase", () => {
  it("is the first third of the plan, and never later than phase 3", () => {
    expect(songDeadlinePhase(3)).toBe(1);
    expect(songDeadlinePhase(6)).toBe(2);
    expect(songDeadlinePhase(8)).toBe(3);
    expect(songDeadlinePhase(12)).toBe(3);
  });
});

describe("checkSkeleton", () => {
  it("has nothing to say about a plan that tastes a song early", () => {
    const phases = plan([
      [step("Thumb and two fingers"), step("Sultans intro", song("Sultans of Swing"))],
      [step("Double stops in D minor")],
      [step("Sultans, the whole part", song("Sultans of Swing"))],
    ]);
    expect(checkSkeleton(phases)).toEqual([]);
  });

  it("flags a plan whose every song is at the end", () => {
    const phases = plan([
      [step("Thumb and two fingers")],
      [step("Double stops in D minor")],
      [step("Clawhammer triplets")],
      [step("Volume swells")],
      [step("Sultans, the whole part", song("Sultans of Swing"))],
      [step("Brothers in Arms", song("Brothers in Arms"))],
    ]);
    const [issue, ...rest] = checkSkeleton(phases);
    expect(rest).toEqual([]);
    expect(issue).toContain("phase 5 of 6");
    expect(issue).toContain('"Sultans of Swing"');
  });

  it("leaves late songs alone when the student asked for the foundation first", () => {
    const phases = plan([
      [step("Thumb and two fingers")],
      [step("Double stops in D minor")],
      [step("Sultans, the whole part", song("Sultans of Swing"))],
    ]);
    const foundation = brief({
      answers: [
        {
          id: "entry",
          question: "",
          values: ["foundation"],
          labels: ["Foundation first"],
        },
      ],
    });
    expect(checkSkeleton(phases, foundation)).toEqual([]);
  });

  it("flags a step named after gear, and not one named after a skill", () => {
    const phases = plan([
      [
        step("EMG 81 bridge attack"),
        step("CE-1 chorus depth"),
        step("Low-E pedal chord stabs"),
        step("Pickup notes into the downbeat"),
        step("Amp tone matched by ear"),
        step("Volume pedal swells"),
      ],
    ]);
    const issues = checkSkeleton(phases);
    expect(issues).toHaveLength(2);
    expect(issues[0]).toContain("EMG 81 bridge attack");
    expect(issues[1]).toContain("CE-1 chorus depth");
  });

  it("says to cut a gear step when the student declined tone", () => {
    const declined = brief({
      answers: [
        {
          id: "includes",
          question: "",
          values: [INCLUDE_OPTIONS.theory],
          labels: ["Theory"],
        },
      ],
    });
    const [issue] = checkSkeleton(
      plan([[step("Neck pickup clean tone")]]),
      declined,
    );
    expect(issue).toContain("declined tone");
  });

  it("flags the same skill under two titles and the same exercise twice in a phase", () => {
    const phases = plan([
      [
        step("Thumb-over bass anchors", { suggestedExerciseId: "a" }),
        step("Thumb-over bass anchoring", { suggestedExerciseId: "a" }),
      ],
    ]);
    const issues = checkSkeleton(phases);
    expect(issues.some((issue) => issue.includes("same skill"))).toBe(true);
    expect(issues.some((issue) => issue.includes("exercise a"))).toBe(true);
  });

  it("flags a required song that got no step", () => {
    const required = brief({
      songs: [{ id: "s1", title: "Romeo and Juliet", artist: "Dire Straits" }],
    });
    const issues = checkSkeleton(plan([[step("Open G shapes")]]), required);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("Romeo and Juliet");
  });
});
