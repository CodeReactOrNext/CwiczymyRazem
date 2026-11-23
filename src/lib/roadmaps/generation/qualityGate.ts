import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";

import { findCatalogEntry } from "./exerciseCatalog";
import { DESCRIPTION_LENGTH, wordCount } from "./lengths";
import { STRUCTURE_LIMITS, TOTAL_STEPS } from "./limits";
import { nearDuplicateTitles } from "./titleOverlap";

export interface QualityReport {
  /** Things that must be fixed before the roadmap ships. */
  problems: string[];
  /** Things worth a look in the editor. */
  warnings: string[];
}

/** Titles that showed up in a third of the old generated roadmaps. */
const GENERIC_TITLES = [
  "basic strumming patterns",
  "finger independence",
  "finger independence exercises",
  "finger independence drills",
  "palm muting control",
  "alternate picking basics",
  "alternate picking control",
  "alternate picking accuracy",
  "downstroke endurance",
  "power chord shapes",
  "two-handed tapping",
  "open chord shapes",
];

/**
 * The register the prompts forbid: metronome platitudes, and the momentum
 * words a model reaches for when it has run out of facts.
 */
export const FILLER =
  /start slow(ly)?,? (and|then) (increase|speed up|build)|practi[cs]e with a metronome|focus on accuracy|muscle memory|solid foundation|next level|unlock(s|ing)? (your|the|new)|(guitar|musical) journey|trust the process|stay consistent|truly (essential|powerful|transform)|it'?s worth noting|keep in mind/i;

/**
 * The same bar the curated roadmaps pass in staticRoadmaps.test, applied to a
 * generated one before it can be exported — plus the smells that made the old
 * output read as generated.
 */
export const checkRoadmapQuality = (phases: RoadmapPhase[]): QualityReport => {
  const problems: string[] = [];
  const warnings: string[] = [];
  const steps = phases.flatMap((phase) => phase.steps);

  if (
    phases.length < STRUCTURE_LIMITS.phases.min ||
    phases.length > STRUCTURE_LIMITS.phases.max
  ) {
    warnings.push(
      `${phases.length} phases (expected ${STRUCTURE_LIMITS.phases.min}–${STRUCTURE_LIMITS.phases.max})`,
    );
  }
  if (steps.length < TOTAL_STEPS.min || steps.length > TOTAL_STEPS.max) {
    warnings.push(
      `${steps.length} steps in total (expected ${TOTAL_STEPS.min}–${TOTAL_STEPS.max})`,
    );
  }

  const seen = new Map<string, string>();
  steps.forEach((step) => {
    const key = step.title.trim().toLowerCase();
    if (seen.has(key)) problems.push(`Duplicate step title: "${step.title}"`);
    seen.set(key, step.title);

    if (GENERIC_TITLES.includes(key)) {
      warnings.push(`Generic step title: "${step.title}"`);
    }
    if (!step.description.trim())
      problems.push(`No description: "${step.title}"`);
    if (!step.successCriteria.trim()) {
      problems.push(`No success criteria: "${step.title}"`);
    }
    if (
      step.suggestedExerciseId &&
      !findCatalogEntry(step.suggestedExerciseId)
    ) {
      problems.push(
        `Unknown exercise "${step.suggestedExerciseId}" on "${step.title}"`,
      );
    }
    if (FILLER.test(step.description)) {
      warnings.push(`Filler advice in "${step.title}"`);
    }
    const entry = findCatalogEntry(step.suggestedExerciseId);
    // A support exercise is a warm-up: the description is told not to build
    // the step around it, so its absence from the text is not a fault.
    if (
      entry &&
      step.exerciseRole !== "support" &&
      step.description &&
      !step.description.toLowerCase().includes(entry.title.toLowerCase())
    ) {
      warnings.push(
        `"${step.title}" has exercise "${entry.title}" but never tells the student to play it`,
      );
    }

    // skillType is only ever set by the generator (toRoadmapPhases) — legacy
    // curated steps never carry it, and without it there is no target range
    // to judge the length against.
    if (step.description && step.skillType) {
      const range = DESCRIPTION_LENGTH[step.skillType];
      const words = wordCount(step.description);
      if (words > range.max * 1.3 || words < range.min * 0.7) {
        warnings.push(
          `"${step.title}" description is ${words} words (expected ${range.min}–${range.max} for a ${step.skillType} step)`,
        );
      }
    }
  });

  // Near-duplicate titles: two steps whose real words mostly overlap, even
  // across phases — an exact match is already a "problem" above, this catches
  // the same skill written twice under slightly different words.
  nearDuplicateTitles(steps.map((step) => step.title)).forEach(([a, b]) => {
    warnings.push(`Near-duplicate step titles: "${a}" and "${b}"`);
  });

  // Same exercise, same phase: usually the tell that a review issue was
  // "fixed" by adding a sibling step instead of editing the original one.
  phases.forEach((phase) => {
    const byExercise = new Map<string, string[]>();
    phase.steps.forEach((step) => {
      if (!step.suggestedExerciseId) return;
      const titles = byExercise.get(step.suggestedExerciseId) ?? [];
      titles.push(step.title);
      byExercise.set(step.suggestedExerciseId, titles);
    });
    byExercise.forEach((titles, exerciseId) => {
      if (titles.length > 1) {
        warnings.push(
          `Phase "${phase.title}" repeats exercise "${exerciseId}" on ${titles.map((t) => `"${t}"`).join(" and ")}`,
        );
      }
    });
  });

  const sessionValues = new Set(steps.map((step) => step.sessionsRequired));
  if (steps.length >= 6 && sessionValues.size < 3) {
    warnings.push(
      `sessionsRequired barely varies (${[...sessionValues].join(", ")}) — calibration did not happen`,
    );
  }

  const exerciseUse = new Map<string, number>();
  steps.forEach((step) => {
    if (step.suggestedExerciseId) {
      exerciseUse.set(
        step.suggestedExerciseId,
        (exerciseUse.get(step.suggestedExerciseId) ?? 0) + 1,
      );
    }
  });
  exerciseUse.forEach((count, id) => {
    if (count > STRUCTURE_LIMITS.maxExerciseReuse) {
      warnings.push(`Exercise "${id}" is on ${count} steps`);
    }
  });
  const withExercise = steps.filter((step) => step.suggestedExerciseId).length;
  if (steps.length && withExercise / steps.length < 0.5) {
    warnings.push(
      `Only ${withExercise} of ${steps.length} steps have an app exercise`,
    );
  }

  return { problems, warnings };
};
