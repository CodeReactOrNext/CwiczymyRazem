import type { RoadmapSongRef } from "feature/aiCoach/types/roadmap.types";
import { describe, expect, it } from "vitest";

import {
  checkCheckpoint,
  checkPlanReview,
  checkRoadmapPlan,
  checkStepText,
  type PlanPhaseInput,
  type PlanStepInput,
  REVIEW_CRITERIA,
} from "./roadmapPlan";

const step = (
  title: string,
  overrides: Partial<PlanStepInput> = {},
): PlanStepInput => ({
  title,
  skillType: "musical",
  gist: `What the player does in ${title}.`,
  ...overrides,
});

/** Three phases of three distinct steps — the smallest plan the limits take. */
const plan = (edit?: (phases: PlanPhaseInput[]) => void): PlanPhaseInput[] => {
  const phases: PlanPhaseInput[] = [
    {
      title: "The Hand",
      steps: [
        step("Thumb and two fingers"),
        step("Snapped treble notes"),
        step("Sultans opening answer", { songId: "sultans" }),
      ],
    },
    {
      title: "The Chords",
      steps: [
        step("D minor triads up the neck"),
        step("Double stops in sixths"),
        step("Two-bar call and response"),
      ],
    },
    {
      title: "The Song",
      steps: [
        step("Sultans verse fills", { songId: "sultans" }),
        step("First solo, bends into chord tones"),
        step("Whole song at album tempo", { songId: "sultans" }),
      ],
    },
  ];
  edit?.(phases);
  return phases;
};

const songs = new Map<string, RoadmapSongRef>([
  [
    "sultans",
    { id: "sultans", title: "Sultans of Swing", artist: "Dire Straits" },
  ],
]);

describe("checkRoadmapPlan", () => {
  it("passes a plan that follows the guide, and hands it on in the generator's shape", () => {
    const check = checkRoadmapPlan(plan(), "Intermediate", songs);
    expect(check.problems).toEqual([]);
    expect(check.size).toEqual({ phases: 3, steps: 9 });
    expect(check.structure[0].steps[2]).toMatchObject({
      songTitle: "Sultans of Swing",
      songArtist: "Dire Straits",
      suggestedExerciseId: null,
      exerciseFit: null,
    });
  });

  it("names the exercise that does not exist, is off-level, or is used too often", () => {
    const check = checkRoadmapPlan(
      plan((phases) => {
        phases[0].steps[0].exerciseId = "made_up";
        // "hard" — out of an Absolute Beginner's range.
        phases[0].steps[1].exerciseId = "legato_hammer_pull_run";
        phases[1].steps[0].exerciseId = "one_chord_improv";
        phases[1].steps[1].exerciseId = "one_chord_improv";
      }),
      "Absolute Beginner",
      songs,
    );
    expect(check.problems.some((p) => p.includes('"made_up"'))).toBe(true);
    expect(
      check.problems.some((p) => p.includes('"Legato — Scale Run" is hard')),
    ).toBe(true);
    // medium is off-level too for an Absolute Beginner.
    expect(
      check.problems.filter((p) => p.includes("Improv — One Chord")),
    ).toHaveLength(2);
  });

  it("caps an exercise at two steps", () => {
    const check = checkRoadmapPlan(
      plan((phases) => {
        phases[0].steps[0].exerciseId = "one_chord_improv";
        phases[1].steps[0].exerciseId = "one_chord_improv";
        phases[2].steps[1].exerciseId = "one_chord_improv";
      }),
      "Intermediate",
      songs,
    );
    expect(check.problems).toHaveLength(1);
    expect(check.problems[0]).toContain("more than 2 steps");
  });

  it("refuses a song id the library does not have and half-named outside songs", () => {
    const check = checkRoadmapPlan(
      plan((phases) => {
        phases[1].steps[0].songId = "nope";
        phases[1].steps[1].songTitle = "Brothers in Arms";
      }),
      "Intermediate",
      songs,
    );
    expect(check.problems.some((p) => p.includes('"nope"'))).toBe(true);
    expect(
      check.problems.some((p) => p.includes("songTitle and songArtist")),
    ).toBe(true);
  });

  it("runs the generator's own code checks on the plan", () => {
    const check = checkRoadmapPlan(
      plan((phases) => {
        // Every song at the end, and a step named after gear.
        delete phases[0].steps[2].songId;
        phases[1].steps[0].title = "Fuzz Face settings";
        phases[1].steps[1].title = "Thumb and two fingers";
      }),
      "Intermediate",
      songs,
    );
    expect(check.problems.some((p) => p.includes("first song step"))).toBe(
      true,
    );
    expect(check.problems.some((p) => p.includes("Fuzz Face settings"))).toBe(
      true,
    );
    expect(check.problems.some((p) => p.includes("both called"))).toBe(true);
  });

  it("notes what is worth a second look without blocking the plan", () => {
    const check = checkRoadmapPlan(
      plan((phases) => {
        phases[0].steps[0].skillType = "physical";
        phases[1].steps[0].exerciseId = "metronome_gap_test";
        phases[1].steps[1].songTitle = "Brothers in Arms";
        phases[1].steps[1].songArtist = "Dire Straits";
      }),
      "Intermediate",
      songs,
    );
    expect(check.problems).toEqual([]);
    expect(check.notes).toHaveLength(4);
    expect(check.notes[0]).toContain("Thumb and two fingers");
    expect(check.notes[1]).toContain("D minor triads up the neck");
    expect(check.notes[2]).toContain("Brothers in Arms");
    // More than a third of the steps open nothing in the app.
    expect(check.notes[3]).toContain("neither an exercise nor a song");
  });
});

describe("checkStepText", () => {
  const physical = {
    title: "Thumb and two fingers",
    skillType: "physical" as const,
    suggestedExerciseId: "one_chord_improv",
  };
  const words = (count: number) =>
    Array.from({ length: count }, () => "note").join(" ");
  const good = {
    description: `[What it is] ${words(20)}. [Why it matters] ${words(20)}. [How to practice] Play Improv — One Chord and ${words(40)}.`,
    successCriteria:
      "You hold the thumb pulse for 8 bars at 80 BPM with no missed bass note.",
  };

  it("accepts a text that follows the guide", () => {
    expect(checkStepText(physical, good)).toEqual([]);
  });

  it("asks for the three sections, the length, and the exercise by its title", () => {
    const problems = checkStepText(physical, {
      description: `[What it is] ${words(200)}`,
      successCriteria: "Sounds good.",
    });
    expect(problems.some((p) => p.includes("[Why it matters]"))).toBe(true);
    expect(problems.some((p) => p.includes("70–130"))).toBe(true);
    expect(problems.some((p) => p.includes('"Improv — One Chord"'))).toBe(true);
    expect(problems.some((p) => p.includes("success criteria"))).toBe(true);
  });

  it("does not ask a warm-up exercise to be named", () => {
    const description = good.description.replace(
      "Play Improv — One Chord and",
      "Play the loop and",
    );
    expect(
      checkStepText(
        { ...physical, exerciseRole: "support" },
        { ...good, description },
      ),
    ).toEqual([]);
  });

  it("refuses filler by quoting it", () => {
    const [problem] = checkStepText(physical, {
      ...good,
      description: good.description.replace(
        "Play Improv — One Chord and",
        "Play Improv — One Chord, practice with a metronome and",
      ),
    });
    expect(problem).toContain('"practice with a metronome"');
  });
});

describe("checkPlanReview", () => {
  const full = (failing?: string) =>
    REVIEW_CRITERIA.map((criterion) => ({
      criterion: criterion.id,
      pass: criterion.id !== failing,
      note: `Looked at ${criterion.id} in every phase.`,
    }));

  it("takes a review that answers every criterion and a plan the player agreed to", () => {
    expect(checkPlanReview(full(), true)).toEqual([]);
  });

  it("refuses a criterion that did not pass, quoting why", () => {
    const [problem] = checkPlanReview(full("size"), true);
    expect(problem).toContain('"size" did not pass');
    expect(problem).toContain("Looked at size");
  });

  it("refuses a review with criteria left out, answered twice, or copy-pasted", () => {
    expect(checkPlanReview(full().slice(2), true)[0]).toContain("goal, level");
    const twice = [...full().slice(1), full()[1]];
    expect(checkPlanReview(twice, true).join(" ")).toContain('"level" twice');
    const pasted = full().map((entry) => ({
      ...entry,
      note: "Looks fine to me.",
    }));
    expect(checkPlanReview(pasted, true).join(" ")).toContain("same note");
  });

  it("refuses a plan the player has not agreed to", () => {
    expect(checkPlanReview(full(), false).join(" ")).toContain(
      "has not seen and agreed",
    );
  });
});

describe("checkCheckpoint", () => {
  const question = (n: number, answerIndex: number, right = "Yes") => ({
    prompt: `What happens in bar ${n}?`,
    options: [
      "Option alpha",
      "Option beta",
      "Option gamma",
      "Option delta",
    ].map((option, index) => (index === answerIndex ? right : option)),
    answerIndex,
    explanation: "Because the thumb stays on the bass string.",
  });

  it("stores six sound questions under the phase's ids", () => {
    const checked = checkCheckpoint(
      [0, 1, 2, 3, 0, 1].map((answer, n) => question(n, answer)),
      "phase-1",
    );
    expect("questions" in checked && checked.questions).toHaveLength(6);
    expect("questions" in checked && checked.questions[0].id).toBe(
      "phase-1-q1",
    );
  });

  it("refuses repeated prompts, the answer always in one place, and always the longest", () => {
    const repeated = checkCheckpoint(
      [0, 1, 2, 3, 0, 1].map((answer) => question(1, answer)),
      "p",
    );
    expect("problems" in repeated && repeated.problems[0]).toContain(
      "Only 1 of 6",
    );

    const samePlace = checkCheckpoint(
      [0, 1, 2, 3, 4, 5].map((n) => question(n, 2)),
      "p",
    );
    expect("problems" in samePlace && samePlace.problems.join(" ")).toContain(
      "same position",
    );

    const longest = checkCheckpoint(
      [0, 1, 2, 3, 0, 1].map((answer, n) =>
        question(
          n,
          answer,
          "The right one, spelled out at much greater length",
        ),
      ),
      "p",
    );
    expect("problems" in longest && longest.problems.join(" ")).toContain(
      "longest option",
    );
  });
});

describe("the number in the success criteria", () => {
  it("is asked for when a test has none", () => {
    const problems = checkStepText(
      { title: "Vibrato on held notes", skillType: "musical" },
      {
        description: `[What it is] ${Array.from({ length: 40 }, () => "note").join(" ")}. [Why it matters] ${Array.from({ length: 40 }, () => "note").join(" ")}. [How to practice] ${Array.from({ length: 40 }, () => "note").join(" ")}.`,
        successCriteria:
          "You hold an even vibrato on every bent note without the pitch drifting flat.",
      },
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("no number");
  });
});
