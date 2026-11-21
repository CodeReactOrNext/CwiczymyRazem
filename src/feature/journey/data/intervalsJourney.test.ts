import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { INTERVALS } from "feature/exercisePlan/intervals/intervalDefinitions";
import { describe, expect, it } from "vitest";

import { getContentIcon } from "../utils/stepIcons";
import { intervalsModule } from "./intervalsJourney";
import { journeyModules } from "./journeyModules";

const steps = intervalsModule.stages.flatMap((stage) => stage.steps);
const exerciseOf = (id: string) => exercisesAgregat.find((exercise) => exercise.id === id);

describe("Interval Mastery path", () => {
  it("is on the module list", () => {
    expect(journeyModules).toContain(intervalsModule);
  });

  it("numbers its steps 1..n in path order, under unique ids", () => {
    expect(steps.map((step) => step.order)).toEqual(steps.map((_, index) => index + 1));
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
  });

  it("files every step under the stage that holds it", () => {
    for (const stage of intervalsModule.stages) {
      for (const step of stage.steps) expect(step.stageId, step.id).toBe(stage.id);
    }
  });

  it("opens every exam step on an exercise that exists", () => {
    for (const step of steps) {
      if (step.modalOnly) {
        expect(step.checklist?.length, step.id).toBeGreaterThan(0);
        continue;
      }
      expect(exerciseOf(step.suggestedExerciseId), `${step.id} → ${step.suggestedExerciseId}`).toBeDefined();
    }
  });

  it("gives every interval a lesson of its own", () => {
    const taughtAlone = steps
      .map((step) => exerciseOf(step.suggestedExerciseId))
      .filter((exercise) => exercise?.noteHuntConfig?.mode === "intervalClick")
      .map((exercise) => exercise!.id);
    for (const interval of INTERVALS) {
      const slug = interval.name.toLowerCase().replace(/ /g, "_");
      expect(taughtAlone, interval.name).toContain(`interval_click_${slug}`);
    }
  });

  it("follows every interval's lesson with a tune of its own to play", () => {
    const openMidi: Record<number, number> = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
    for (const interval of INTERVALS) {
      const slug = interval.name.toLowerCase().replace(/ /g, "_");
      const lesson = steps.findIndex((step) => step.suggestedExerciseId === `interval_click_${slug}`);
      const played = steps[lesson + 1];
      expect(played.suggestedExerciseId, interval.name).toBe(`interval_tunes_${slug}`);
      expect(played.examBpm, interval.name).toBeGreaterThan(0);

      const exercise = exerciseOf(played.suggestedExerciseId)!;
      expect(exercise.disableMic, interval.name).toBeFalsy();
      expect(exercise.tablature!.length, interval.name).toBeGreaterThanOrEqual(8);

      // The interval is the tune's motif: it is the leap heard most often, and
      // it turns up in nearly every bar rather than once as a token gesture.
      const pitches = exercise.tablature!.map((measure) =>
        measure.beats.flatMap((beat) => beat.notes.map((note) => openMidi[note.string] + note.fret)),
      );
      const flat = pitches.flat();
      const moves = flat.slice(1).map((pitch, index) => Math.abs(pitch - flat[index])).filter((move) => move > 0);
      const tally = new Map<number, number>();
      moves.forEach((move) => tally.set(move, (tally.get(move) ?? 0) + 1));
      const own = tally.get(interval.semitones) ?? 0;
      expect(own, interval.name).toBeGreaterThanOrEqual(8);
      // Tunes that fall back by step after the leap may use steps as often as the leap itself.
      for (const [move, count] of tally) {
        if (move > 2) expect(count, `${interval.name}: leap of ${move}`).toBeLessThanOrEqual(own);
      }
      const barsWithIt = pitches.filter((bar) =>
        bar.some((pitch, index) => index > 0 && Math.abs(pitch - bar[index - 1]) === interval.semitones),
      ).length;
      expect(barsWithIt, interval.name).toBeGreaterThanOrEqual(6);
    }
  });

  it("teaches all three ways: clicked, heard and played", () => {
    const exercises = steps.filter((step) => !step.modalOnly).map((step) => exerciseOf(step.suggestedExerciseId)!);
    expect(exercises.some((exercise) => exercise.noteHuntConfig?.mode === "intervalClick")).toBe(true);
    expect(exercises.some((exercise) => !!exercise.earQuizConfig)).toBe(true);
    expect(exercises.some((exercise) => exercise.noteHuntConfig?.mode === "interval" && !exercise.disableMic)).toBe(true);
    // Every stage puts the guitar in hand at least once, and the path ends on it.
    const onGuitar = (step: (typeof steps)[number]) =>
      !step.modalOnly && !exerciseOf(step.suggestedExerciseId)!.disableMic;
    for (const stage of intervalsModule.stages) {
      expect(stage.steps.some(onGuitar), stage.label).toBe(true);
    }
    expect(onGuitar(steps[steps.length - 1])).toBe(true);
  });

  it("only uses callout and checklist icons the sidebar can draw", () => {
    for (const step of steps) {
      const icons = [
        ...(step.contentBlocks ?? []).filter((block) => block.type === "callout").map((block) => block.icon),
        ...(step.checklist ?? []).map((item) => item.icon),
      ];
      for (const icon of icons) expect(getContentIcon(icon), `${step.id}: ${icon}`).not.toBeNull();
    }
  });

  it("keeps every diagram to six strings with a label row as wide as its window", () => {
    for (const step of steps) {
      for (const block of step.contentBlocks ?? []) {
        if (block.type !== "fretDiagram") continue;
        const diagram = block.diagram!;
        expect(diagram.strings).toHaveLength(6);
        for (const row of diagram.strings) {
          if (row.active) expect(row.notes, step.id).toHaveLength(diagram.endFret - diagram.startFret + 1);
        }
      }
    }
  });
});
