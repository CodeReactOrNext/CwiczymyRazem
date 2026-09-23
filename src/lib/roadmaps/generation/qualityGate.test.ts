import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { describe, expect, it } from "vitest";

import { findCatalogEntry } from "./exerciseCatalog";
import { checkRoadmapQuality } from "./qualityGate";

const realExercise = findCatalogEntry("one_chord_improv");

const step = (
  title: string,
  overrides: Partial<RoadmapPhase["steps"][number]> = {},
): RoadmapPhase["steps"][number] => ({
  id: title.toLowerCase().replace(/\W+/g, "-"),
  title,
  description: `[What it is]\n${title} explained.\n[How to practice]\nPlay ${realExercise?.title ?? ""} and listen.`,
  successCriteria: "Clean at 90 BPM.",
  sessionsRequired: 6,
  sessionsCompleted: 0,
  order: 0,
  suggestedExerciseId: realExercise?.id,
  ...overrides,
});

/** Six phases of four distinct, described steps — the shape that should pass clean. */
const goodRoadmap = (): RoadmapPhase[] =>
  Array.from({ length: 6 }, (_phase, phaseIdx) => ({
    id: `p${phaseIdx}`,
    title: `Phase ${phaseIdx}`,
    order: phaseIdx,
    steps: Array.from({ length: 4 }, (_step, stepIdx) =>
      step(`Skill ${phaseIdx}-${stepIdx}`, {
        sessionsRequired: 3 + ((phaseIdx + stepIdx) % 5),
        // Two uses of the same exercise per roadmap are fine; more is filler.
        suggestedExerciseId: stepIdx === 0 ? realExercise?.id : undefined,
        description:
          stepIdx === 0
            ? `[How to practice]\nPlay ${realExercise?.title} slowly.`
            : "[What it is]\nSomething specific.\n[How to practice]\nHold the E chord and count 1 & 2 &.",
      }),
    ),
  }));

describe("checkRoadmapQuality", () => {
  it("passes a well-formed roadmap with no problems", () => {
    const report = checkRoadmapQuality(goodRoadmap());
    expect(report.problems).toEqual([]);
    // Exercise reuse is 6 (one per phase) — above the cap — and coverage is
    // 25%, so two warnings are expected, and only those two.
    expect(report.warnings).toHaveLength(2);
  });

  it("flags missing copy, unknown exercises and duplicate titles as problems", () => {
    const phases = goodRoadmap();
    phases[0].steps[1] = step("Skill 0-1", { description: "" });
    phases[0].steps[2] = step("Skill 0-2", {
      suggestedExerciseId: "vibrato_mastery",
    });
    phases[1].steps[0] = step("skill 0-0", { id: "dup" });

    const { problems } = checkRoadmapQuality(phases);

    expect(problems).toContain('No description: "Skill 0-1"');
    expect(problems).toContain(
      'Unknown exercise "vibrato_mastery" on "Skill 0-2"',
    );
    expect(problems).toContain('Duplicate step title: "skill 0-0"');
  });

  it("warns about the smells of the old generator", () => {
    const phases = goodRoadmap();
    phases[0].steps[0] = step("Basic strumming patterns", {
      description: "Start slow and increase gradually.",
    });
    phases.forEach((phase) =>
      phase.steps.forEach((s) => {
        s.sessionsRequired = 8;
      }),
    );

    const { warnings } = checkRoadmapQuality(phases);

    expect(warnings).toContain(
      'Generic step title: "Basic strumming patterns"',
    );
    expect(warnings).toContain('Filler advice in "Basic strumming patterns"');
    expect(
      warnings.some((w) => w.startsWith("sessionsRequired barely varies")),
    ).toBe(true);
    expect(
      warnings.some((w) => w.includes("never tells the student to play it")),
    ).toBe(true);
  });

  it("flags near-duplicate titles even across different phases", () => {
    const phases = goodRoadmap();
    phases[0].steps[0] = step("Thumb-Over Bass Anchors");
    phases[3].steps[2] = step("Thumb-Over Bass Anchoring (Comping)");

    const { warnings } = checkRoadmapQuality(phases);

    expect(warnings).toContain(
      'Near-duplicate step titles: "Thumb-Over Bass Anchors" and "Thumb-Over Bass Anchoring (Comping)"',
    );
  });

  it("does not flag titles that merely share a genre or position word", () => {
    const phases = goodRoadmap();
    phases[0].steps[0] = step("Pentatonic Box One");
    phases[0].steps[1] = step("Pentatonic Box Two");
    phases[2].steps[0] = step("Blues Turnaround Phrasing");
    phases[2].steps[1] = step("Blues Call-and-Response Phrasing");

    const { warnings } = checkRoadmapQuality(phases);

    expect(warnings.filter((w) => w.startsWith("Near-duplicate"))).toEqual([]);
  });

  it("flags the same exercise assigned twice within one phase", () => {
    const phases = goodRoadmap();
    phases[2].steps[1] = step("Skill 2-1", {
      suggestedExerciseId: realExercise?.id,
    });
    phases[2].steps[2] = step("Skill 2-2", {
      suggestedExerciseId: realExercise?.id,
    });

    const { warnings } = checkRoadmapQuality(phases);

    expect(
      warnings.some((w) =>
        w.startsWith(`Phase "Phase 2" repeats exercise "${realExercise?.id}"`),
      ),
    ).toBe(true);
  });

  it("flags a description that runs well past its skill type's length", () => {
    const phases = goodRoadmap();
    phases[0].steps[0] = step("Long Physical Step", {
      skillType: "physical",
      description: Array(200).fill("word").join(" "),
      suggestedExerciseId: undefined,
    });
    phases[0].steps[1] = step("Fine Physical Step", {
      skillType: "physical",
      description: Array(100).fill("word").join(" "),
      suggestedExerciseId: undefined,
    });

    const { warnings } = checkRoadmapQuality(phases);

    expect(
      warnings.some((w) =>
        w.startsWith('"Long Physical Step" description is 200 words'),
      ),
    ).toBe(true);
    expect(warnings.some((w) => w.includes("Fine Physical Step"))).toBe(false);
  });
});

describe("filler in the model's register", () => {
  it("flags the momentum words the house voice forbids", () => {
    const phases = [
      {
        id: "p1",
        title: "Phase",
        order: 0,
        steps: [
          {
            id: "s1",
            title: "Thumb over the neck",
            description:
              "[What it is] Wrap the thumb over the low E. [Why it matters] It builds muscle memory for every chord shape and takes your playing to the next level. [How to practice] Fret F at fret 1.",
            successCriteria: "Clean F at 70 BPM.",
            sessionsRequired: 6,
            sessionsCompleted: 0,
            order: 0,
          },
        ],
      },
    ];
    const report = checkRoadmapQuality(phases as any);
    expect(report.warnings.some((w) => w.includes("Filler advice"))).toBe(true);
  });
});
