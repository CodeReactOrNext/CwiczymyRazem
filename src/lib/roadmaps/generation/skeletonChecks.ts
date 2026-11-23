import { briefAnswer, type RoadmapBrief } from "./brief";
import { INCLUDE_OPTIONS } from "./questionBank";
import type { StructurePhase } from "./structure";
import { nearDuplicateTitles } from "./titleOverlap";

/**
 * What a skeleton gets wrong often enough to be checked by code instead of by
 * a second model. The first eight generated roadmaps were all sent back by the
 * reviewer, and half of its notes were the same two: the songs sat in the last
 * phases, and a step was named after a piece of gear. Both are visible in the
 * titles, so both are caught here — before the review, and again after the
 * rewrite, which nothing used to look at.
 *
 * Pure: the same function runs on the draft and on the revision.
 */

/** A step named after equipment rather than something the student does. */
const GEAR =
  /\b(humbuckers?|single[- ]coils?|(?:neck|bridge|middle) pickups?|pickup (?:selector|height|switch\w*)|pedalboard|(?:effects?|chorus|delay|fuzz|overdrive|distortion|wah|reverb) pedals?|amps?|amplifiers?|preamps?|cabinets?|tube screamer|fuzz face|big muff|emg ?\d+|jc-?120|ce-?[12]|ts-?[98]|mark ii[bc]|strings? gauges?|string change|restring\w*)(?![\w-])/i;

/** Words that turn a gear title into a skill: the gear is then only the context. */
const GEAR_AS_SKILL = /\b(by ear|against|match\w*|control|swells?|feedback)\b/i;

const isGearTitle = (title: string) =>
  GEAR.test(title) && !GEAR_AS_SKILL.test(title);

const hasSong = (phase: StructurePhase) =>
  phase.steps.some((step) => !!step.songTitle?.trim());

/**
 * The phase by which a plan with songs must have reached one: the first third,
 * and never later than the third phase.
 */
export const songDeadlinePhase = (phaseCount: number): number =>
  Math.max(1, Math.min(3, Math.ceil(phaseCount / 3)));

export const checkSkeleton = (
  phases: StructurePhase[],
  brief?: RoadmapBrief | null,
): string[] => {
  const issues: string[] = [];
  const steps = phases.flatMap((phase) => phase.steps);

  // Songs tasted early — unless the student asked for the foundation first.
  const foundationFirst = briefAnswer(brief, "entry")?.values.includes(
    "foundation",
  );
  const firstSongPhase = phases.findIndex(hasSong);
  const deadline = songDeadlinePhase(phases.length);
  if (!foundationFirst && firstSongPhase >= deadline) {
    const songs = [
      ...new Set(
        steps
          .map((step) => step.songTitle?.trim())
          .filter((title): title is string => !!title),
      ),
    ].slice(0, 4);
    issues.push(
      `The first song step is in phase ${firstSongPhase + 1} of ${phases.length}; the student must play a real fragment of the goal's music by phase ${deadline}. Move a reduced-tempo excerpt of ${songs.map((song) => `"${song}"`).join(" or ")} into phases 1–${deadline} and keep the full versions where they are.`,
    );
  }

  // Gear as a one-off task.
  const includes = briefAnswer(brief, "includes");
  const toneDeclined =
    !!includes && !includes.values.includes(INCLUDE_OPTIONS.tone);
  steps
    .filter((step) => isGearTitle(step.title))
    .forEach((step) => {
      issues.push(
        toneDeclined
          ? `"${step.title}" is about gear, and the student declined tone and gear steps: cut it.`
          : `"${step.title}" is named after a piece of gear, which makes it a one-off setup task: turn it into a repeatable skill on whatever the student owns (matching the sound by ear against a reference recording), or cut it.`,
      );
    });

  // The same skill twice under different words.
  nearDuplicateTitles(steps.map((step) => step.title)).forEach(([a, b]) => {
    issues.push(
      `"${a}" and "${b}" are the same skill under two titles: merge them into one step.`,
    );
  });

  // The same exercise twice in one phase.
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
        issues.push(
          `Phase "${phase.title}" gives exercise ${exerciseId} to ${titles.map((title) => `"${title}"`).join(" and ")}: keep it on the one it trains best and give the other a different exercise or none.`,
        );
      }
    });
  });

  // A required song without a step of its own.
  (brief?.songs ?? []).forEach((song) => {
    const wanted = song.title.trim().toLowerCase();
    if (!steps.some((step) => step.songTitle?.trim().toLowerCase() === wanted)) {
      issues.push(
        `The student required "${song.title}" by ${song.artist} and no step has it as songTitle: give it a repertoire step.`,
      );
    }
  });

  return issues;
};
