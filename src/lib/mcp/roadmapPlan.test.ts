import type { RoadmapSongRef } from "feature/aiCoach/types/roadmap.types";
import { describe, expect, it } from "vitest";

import {
  checkCheckpoint,
  checkPlanReview,
  checkRoadmapPlan,
  checkSchoolTitle,
  checkStepText,
  checkSyllabus,
  type PlanPhaseInput,
  type PlanStepInput,
  REVIEW_CRITERIA,
  SCHOOL_FRAME,
  SCHOOL_SIZE,
  SCHOOL_TEXT,
} from "./roadmapPlan";
import { SCHOOL_TITLES } from "./roadmapPlan.fixtures";

const step = (
  title: string,
  overrides: Partial<PlanStepInput> = {},
): PlanStepInput => ({
  title,
  skillType: "musical",
  gist: `What the player does in ${title}.`,
  ...overrides,
});

const plan = (edit?: (phases: PlanPhaseInput[]) => void): PlanPhaseInput[] => {
  const phases: PlanPhaseInput[] = SCHOOL_TITLES.map((titles, index) => ({
    title: `Phase ${index + 1}`,
    steps: titles.map((title) => step(title)),
  }));
  phases[0].steps[4].songId = "sultans";
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
  it("passes a school-sized plan and hands it on in the generator's shape", () => {
    const check = checkRoadmapPlan(plan(), "Intermediate", songs);
    expect(check.problems).toEqual([]);
    expect(check.size).toEqual({ phases: 5, steps: 25 });
    expect(check.structure[0].steps[4]).toMatchObject({
      songTitle: "Sultans of Swing",
      songArtist: "Dire Straits",
      suggestedExerciseId: null,
      exerciseFit: null,
    });
  });

  it("refuses a lesson plan passed off as a school", () => {
    const check = checkRoadmapPlan(plan().slice(0, 4), "Intermediate", songs);
    expect(check.problems).toHaveLength(1);
    expect(check.problems[0]).toContain(
      `at least ${SCHOOL_SIZE.phases} phases and ${SCHOOL_SIZE.steps} steps`,
    );
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
        // The only song at the very end, and a step named after gear.
        delete phases[0].steps[4].songId;
        phases[4].steps[0].songId = "sultans";
        phases[1].steps[0].title = "Fuzz Face settings";
        phases[1].steps[1].title = "Trills between two fingers";
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
    expect(check.notes[0]).toContain("Hammer-ons from a fretted note");
    expect(check.notes[1]).toContain("Three notes on every string");
    expect(check.notes[2]).toContain("Brothers in Arms");
    // A school has something to open on nearly every step.
    expect(check.notes[3]).toContain("neither an exercise nor a song");
  });
});

describe("checkSyllabus", () => {
  /** Eight topics that between them name every step of the plan. */
  const syllabus = () => {
    const titles = SCHOOL_TITLES.flat();
    return Array.from({ length: 8 }, (_unused, index) => ({
      topic: `Topic ${index + 1}`,
      steps: titles.filter((_title, at) => at % 8 === index),
    }));
  };

  it("takes a syllabus that covers the plan both ways", () => {
    expect(checkSyllabus(syllabus(), plan())).toEqual([]);
  });

  it("finds the topic nothing teaches and the step that teaches nothing", () => {
    const broken = syllabus();
    broken[0] = { topic: "Tapping", steps: ["A step that is not there"] };
    const problems = checkSyllabus(broken, plan());
    expect(problems.some((p) => p.includes("does not have"))).toBe(true);
    expect(
      problems.some((p) => p.includes('Nothing in the plan teaches "Tapping"')),
    ).toBe(true);
    // The steps the dropped topic used to cover now belong to no topic.
    expect(
      problems.some(
        (p) =>
          p.includes("teach no topic") &&
          p.includes("Hammer-ons from a fretted note"),
      ),
    ).toBe(true);
  });

  it("asks for a subject taken apart, not three headings", () => {
    expect(checkSyllabus(syllabus().slice(0, 3), plan())[0]).toContain(
      "at least 8",
    );
  });
});

describe("checkSchoolTitle", () => {
  it("takes a subject and refuses a number, a sentence or one player's plan", () => {
    expect(checkSchoolTitle("Legato")).toEqual([]);
    expect(checkSchoolTitle("Rhythm Guitar Basics")).toEqual([]);
    expect(
      checkSchoolTitle("Thrash Alternate Picking: 110 to 160 BPM")[0],
    ).toContain("names a number");
    expect(checkSchoolTitle("My plan for legato")[0]).toContain("one player");
    expect(
      checkSchoolTitle(
        "How to finally get fast and clean with the left hand alone",
      )[0],
    ).toContain("a sentence");
  });
});

describe("checkStepText", () => {
  const physical = {
    title: "Hammer-ons from a fretted note",
    skillType: "physical" as const,
    suggestedExerciseId: "one_chord_improv",
  };
  const words = (count: number) =>
    Array.from({ length: count }, () => "note").join(" ");
  const body = (howTo = "Play Improv — One Chord and") =>
    `[What it is] ${words(50)}. [Why it matters] ${words(50)}. [How to practice] ${howTo} ${words(80)}.`;
  const good = {
    description: body(),
    successCriteria:
      "You hold the thumb pulse for 8 bars at 80 BPM with no missed bass note.",
  };

  it("accepts a text at masterclass length", () => {
    expect(checkStepText(physical, good)).toEqual([]);
  });

  it("refuses a note and a wall of text, quoting the range", () => {
    const short = checkStepText(physical, {
      ...good,
      description: `[What it is] ${words(20)}. [Why it matters] ${words(20)}. [How to practice] Play Improv — One Chord ${words(20)}.`,
    });
    expect(short).toHaveLength(1);
    expect(short[0]).toContain(`${SCHOOL_TEXT.min}–${SCHOOL_TEXT.max}`);
    expect(short[0]).toContain("this is a note");

    const long = checkStepText(physical, {
      ...good,
      description: body(`Play Improv — One Chord and ${words(300)}`),
    });
    expect(long[0]).toContain("Cut what repeats");
  });

  it("asks for the three sections, the exercise by its title and a real test", () => {
    const problems = checkStepText(physical, {
      description: `[What it is] ${words(200)}`,
      successCriteria: "Sounds good.",
    });
    expect(problems.some((p) => p.includes("[Why it matters]"))).toBe(true);
    expect(problems.some((p) => p.includes('"Improv — One Chord"'))).toBe(true);
    expect(problems.some((p) => p.includes("success criteria"))).toBe(true);
  });

  it("asks the first step for the way in and the last for the way out", () => {
    expect(checkStepText(physical, good, { first: true })[0]).toContain(
      SCHOOL_FRAME.first,
    );
    expect(checkStepText(physical, good, { last: true })[0]).toContain(
      SCHOOL_FRAME.last,
    );

    // With the frame, and the extra room it is given.
    expect(
      checkStepText(
        physical,
        {
          ...good,
          description: `${SCHOOL_FRAME.first} ${words(90)}. ${body()}`,
        },
        { first: true },
      ),
    ).toEqual([]);
  });

  it("refuses a tempo the exercise cannot be set to", () => {
    const fast = {
      description: body("Play Improv — One Chord at 150 BPM and"),
      successCriteria:
        "You play Improv — One Chord from 120 to 160 BPM for 2 minutes cleanly.",
    };
    expect(checkStepText(physical, fast, {}, 180)).toEqual([]);
    const [problem] = checkStepText(physical, fast, {}, 140);
    expect(problem).toContain("goes up to 140 BPM");
    expect(problem).toContain("150, 160");
    // A warm-up is not the step's test: its range does not bind the text.
    expect(
      checkStepText({ ...physical, exerciseRole: "support" }, fast, {}, 140),
    ).toEqual([]);
  });

  it("does not ask a warm-up exercise to be named", () => {
    expect(
      checkStepText(
        { ...physical, exerciseRole: "support" },
        { ...good, description: body("Play the loop and") },
      ),
    ).toEqual([]);
  });

  it("refuses filler by quoting it", () => {
    const [problem] = checkStepText(physical, {
      ...good,
      description: body(
        "Play Improv — One Chord, practice with a metronome and",
      ),
    });
    expect(problem).toContain('"practice with a metronome"');
  });

  it("asks for a measure where the app can take one, in digits or in words", () => {
    const vague = {
      ...good,
      successCriteria:
        "You hold a steady vibrato on the bent notes without the pitch drifting flat.",
    };
    const problems = checkStepText(physical, vague);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("no number");

    // "three" is a count, the way the curated criteria write it.
    expect(
      checkStepText(physical, {
        ...good,
        successCriteria:
          "You land a PERFECT on three attempts in a row without the pitch drifting flat.",
      }),
    ).toEqual([]);
    // A step with no exercise of its own has nothing the app could measure.
    expect(
      checkStepText(
        { title: "Hey Joe: the chord part", skillType: "musical" },
        { ...vague, description: body("Play the song and") },
      ),
    ).toEqual([]);
  });

  it("takes an exercise named without its family prefix", () => {
    expect(
      checkStepText(
        { ...physical, suggestedExerciseId: "metronome_gap_test" },
        { ...good, description: body("Use the Metronome Gap Test and") },
      ),
    ).toEqual([]);
  });
});

describe("checkPlanReview", () => {
  const full = (failing?: string) =>
    REVIEW_CRITERIA.map((criterion) => ({
      criterion: criterion.id,
      pass: criterion.id !== failing,
      note: `Looked at ${criterion.id} in every phase.`,
    }));

  it("judges a school, not one player's plan", () => {
    expect(REVIEW_CRITERIA.map((criterion) => criterion.id)).toEqual([
      "subject",
      "coverage",
      "level",
      "arc",
      "specificity",
      "repeatable",
      "exercises",
      "measurable",
      "general",
    ]);
  });

  it("takes a review that answers every criterion and a plan the player agreed to", () => {
    expect(checkPlanReview(full(), true)).toEqual([]);
  });

  it("refuses a criterion that did not pass, quoting why", () => {
    const [problem] = checkPlanReview(full("coverage"), true);
    expect(problem).toContain('"coverage" did not pass');
    expect(problem).toContain("Looked at coverage");
  });

  it("refuses a review with criteria left out, answered twice, or copy-pasted", () => {
    expect(checkPlanReview(full().slice(2), true)[0]).toContain(
      "subject, coverage",
    );
    const twice = [...full().slice(1), full()[1]];
    expect(checkPlanReview(twice, true).join(" ")).toContain(
      '"coverage" twice',
    );
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

  it("refuses repeated prompts and the answer always in one place", () => {
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
  });

  it("refuses a quiz that can be passed by picking the longest option", () => {
    const long = "The right one, spelled out at much greater length";
    // Three of six is still allowed; four is more than half.
    const half = checkCheckpoint(
      [0, 1, 2, 3, 0, 1].map((answer, n) =>
        question(n, answer, n < 3 ? long : "Yes"),
      ),
      "p",
    );
    expect("questions" in half).toBe(true);

    const most = checkCheckpoint(
      [0, 1, 2, 3, 0, 1].map((answer, n) =>
        question(n, answer, n < 4 ? long : "Yes"),
      ),
      "p",
    );
    expect("problems" in most && most.problems.join(" ")).toContain(
      "longest option in 4 of 6",
    );
  });
});
