import type { PhaseQuizQuestion } from "feature/aiCoach/types/phaseCheck.types";
import type {
  RoadmapSongRef,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";
import { PHASE_CHECK_QUESTIONS } from "feature/aiCoach/utils/phaseCheck";
import {
  DIFFICULTY_FOR_LEVEL,
  findCatalogEntry,
} from "lib/roadmaps/generation/exerciseCatalog";
import { DESCRIPTION_LENGTH, wordCount } from "lib/roadmaps/generation/lengths";
import type { RoadmapLevel } from "lib/roadmaps/generation/levels";
import {
  OVERUSED_EXERCISE_IDS,
  STRUCTURE_LIMITS,
  TOTAL_STEPS,
} from "lib/roadmaps/generation/limits";
import { normaliseQuizQuestions } from "lib/roadmaps/generation/phaseQuiz";
import { FILLER } from "lib/roadmaps/generation/qualityGate";
import { checkSkeleton } from "lib/roadmaps/generation/skeletonChecks";
import type {
  ExerciseFit,
  SkillType,
  StructurePhase,
} from "lib/roadmaps/generation/structure";

/**
 * A roadmap plan as an AI client sends it, and what the app's own checks say
 * about it. The same code checks the in-app generator runs on its drafts —
 * no model on our side reads the plan; the client's model wrote it and fixes
 * it from the list this returns.
 *
 * Pure: the tools hand in the library songs they looked up.
 */
export interface PlanStepInput {
  title: string;
  skillType: SkillType;
  /** One sentence: what the player does in the step. */
  gist: string;
  exerciseId?: string;
  exerciseFit?: ExerciseFit;
  /** A library song by id — the step opens its tab. */
  songId?: string;
  /** A song the library lacks, by name; the step links itself if it is added. */
  songTitle?: string;
  songArtist?: string;
}

export interface PlanPhaseInput {
  title: string;
  steps: PlanStepInput[];
}

export interface PlanCheck {
  /** What has to change before the plan can be saved. */
  problems: string[];
  /** Worth knowing, not blocking. */
  notes: string[];
  /** The plan in the shape the generator's own pipeline takes. */
  structure: StructurePhase[];
  size: { phases: number; steps: number };
}

const quote = (text: string) => `"${text.trim()}"`;

export const checkRoadmapPlan = (
  phases: PlanPhaseInput[],
  level: RoadmapLevel,
  songsById: Map<string, RoadmapSongRef>,
): PlanCheck => {
  const problems: string[] = [];
  const notes: string[] = [];
  const allowed = new Set(DIFFICULTY_FOR_LEVEL[level] ?? []);
  const uses = new Map<string, number>();
  const titles = new Map<string, string>();

  const structure: StructurePhase[] = phases.map((phase) => ({
    title: phase.title.trim(),
    steps: phase.steps.map((step) => {
      const title = step.title.trim();
      const key = title.toLowerCase();
      if (titles.has(key)) {
        problems.push(`Two steps are both called ${quote(title)}.`);
      }
      titles.set(key, title);

      let exerciseId: string | null = null;
      if (step.exerciseId) {
        const entry = findCatalogEntry(step.exerciseId);
        const count = uses.get(step.exerciseId) ?? 0;
        if (!entry) {
          problems.push(
            `${quote(title)}: no library exercise ${quote(step.exerciseId)} — ids come from riffquest_list_exercises (own exercises cannot go on a roadmap step).`,
          );
        } else if (allowed.size > 0 && !allowed.has(entry.difficulty)) {
          problems.push(
            `${quote(title)}: ${quote(entry.title)} is ${entry.difficulty}; a ${level} roadmap takes ${[...allowed].join(", ")} exercises.`,
          );
        } else if (count >= STRUCTURE_LIMITS.maxExerciseReuse) {
          problems.push(
            `${quote(entry.title)} is on more than ${STRUCTURE_LIMITS.maxExerciseReuse} steps (${quote(title)} is one too many).`,
          );
        } else {
          exerciseId = entry.id;
          uses.set(entry.id, count + 1);
        }
      } else if (step.exerciseFit) {
        problems.push(
          `${quote(title)}: exerciseFit is set but there is no exerciseId.`,
        );
      }

      let song: { title: string; artist: string } | null = null;
      if (step.songId) {
        const found = songsById.get(step.songId);
        if (found) song = found;
        else {
          problems.push(
            `${quote(title)}: no library song ${quote(step.songId)} — ids come from riffquest_list_songs.`,
          );
        }
      } else if (step.songTitle?.trim() || step.songArtist?.trim()) {
        if (step.songTitle?.trim() && step.songArtist?.trim()) {
          song = {
            title: step.songTitle.trim(),
            artist: step.songArtist.trim(),
          };
        } else {
          problems.push(
            `${quote(title)}: a song outside the library needs both songTitle and songArtist.`,
          );
        }
      }

      return {
        title,
        skillType: step.skillType,
        suggestedExerciseId: exerciseId,
        exerciseWhy: "",
        exerciseFit: exerciseId ? (step.exerciseFit ?? "direct") : null,
        gist: step.gist.trim(),
        songTitle: song?.title ?? null,
        songArtist: song?.artist ?? null,
      };
    }),
  }));

  const steps = structure.flatMap((phase) => phase.steps);
  if (steps.length < TOTAL_STEPS.min || steps.length > TOTAL_STEPS.max) {
    problems.push(
      `${steps.length} steps in all; a roadmap has ${TOTAL_STEPS.min}–${TOTAL_STEPS.max}.`,
    );
  }
  problems.push(...checkSkeleton(structure));

  const bareTechnique = steps.filter(
    (step) =>
      step.skillType === "physical" &&
      !step.suggestedExerciseId &&
      !step.songTitle,
  );
  if (bareTechnique.length) {
    notes.push(
      `Technique steps with no exercise: ${bareTechnique.map((step) => quote(step.title)).join(", ")}. The library may have one that drills the motion.`,
    );
  }
  const overused = steps.filter(
    (step) =>
      step.exerciseFit === "direct" &&
      (OVERUSED_EXERCISE_IDS as readonly string[]).includes(
        step.suggestedExerciseId ?? "",
      ),
  );
  if (overused.length) {
    notes.push(
      `These use an exercise that fits almost anything — keep it only where the step is exactly about what it trains: ${overused.map((step) => quote(step.title)).join(", ")}.`,
    );
  }
  const outside = phases
    .flatMap((phase) => phase.steps)
    .filter((step) => !step.songId && step.songTitle?.trim());
  if (outside.length) {
    notes.push(
      `Not in the library, so these steps open no tab: ${[...new Set(outside.map((step) => quote(step.songTitle as string)))].join(", ")}.`,
    );
  }
  const nothing = steps.filter(
    (step) => !step.suggestedExerciseId && !step.songTitle,
  );
  if (steps.length && nothing.length / steps.length > 0.35) {
    notes.push(
      `${nothing.length} of ${steps.length} steps have neither an exercise nor a song — nothing to open in the app.`,
    );
  }

  return {
    problems,
    notes,
    structure,
    size: { phases: structure.length, steps: steps.length },
  };
};

export interface StepTextInput {
  description: string;
  successCriteria: string;
}

const SECTIONS = ["[What it is]", "[Why it matters]", "[How to practice]"];

/**
 * What is wrong with a step's text, by the rules the roadmap guide gives.
 * Empty when it can be saved.
 */
export const checkStepText = (
  step: Pick<
    RoadmapStep,
    "title" | "skillType" | "suggestedExerciseId" | "exerciseRole"
  >,
  text: StepTextInput,
): string[] => {
  const problems: string[] = [];
  const description = text.description.trim();
  const label = quote(step.title);

  const missing = SECTIONS.filter((section) => !description.includes(section));
  if (missing.length) {
    problems.push(`${label}: the description lacks ${missing.join(", ")}.`);
  }

  const range = DESCRIPTION_LENGTH[step.skillType ?? "physical"];
  const words = wordCount(description);
  if (words > range.max * 1.3 || words < range.min * 0.7) {
    problems.push(
      `${label}: the description is ${words} words; a ${step.skillType ?? "physical"} step takes ${range.min}–${range.max}.`,
    );
  }

  const filler = description.match(FILLER);
  if (filler) {
    problems.push(
      `${label}: "${filler[0]}" is filler — say the specific thing instead.`,
    );
  }

  const entry = findCatalogEntry(step.suggestedExerciseId);
  if (
    entry &&
    step.exerciseRole !== "support" &&
    !description.toLowerCase().includes(entry.title.toLowerCase())
  ) {
    problems.push(
      `${label}: its exercise is ${quote(entry.title)} — [How to practice] names it by that exact title.`,
    );
  }

  if (wordCount(text.successCriteria) < 8) {
    problems.push(
      `${label}: the success criteria are a test the player can run — what they play, how fast, what it must sound like.`,
    );
  } else if (!/\d/.test(text.successCriteria)) {
    problems.push(
      `${label}: the success criteria have no number in them — a tempo, a count of bars or repeats, a duration.`,
    );
  }
  return problems;
};

/**
 * What the in-app generator's reviewer judges a plan on — the part of the
 * review code cannot do. An AI client answers each of these about its own
 * plan before the plan can be saved, with a note that names what it looked
 * at: a review that has to be written criterion by criterion is harder to
 * skip than one that may come back as an empty list.
 */
export const REVIEW_CRITERIA = [
  {
    id: "goal",
    question:
      "Does every phase move the player towards the goal? Would a fan of the artist or the style recognise the plan as theirs?",
  },
  {
    id: "level",
    question:
      "Nothing the level already has, nothing out of reach too early — and it starts from what the player's history shows, not from zero.",
  },
  {
    id: "specificity",
    question:
      "Is every step a concrete skill for this goal? Name any title that could sit in any roadmap.",
  },
  {
    id: "order",
    question:
      "Prerequisites first, the goal itself played early, ear and rhythm spread through the phases rather than left for the end.",
  },
  {
    id: "gaps",
    question:
      "What would a good teacher say is missing for this goal, or sits in the wrong phase?",
  },
  {
    id: "repeatable",
    question:
      "Is every step something done across several sessions — no checklist task, no setup note?",
  },
  {
    id: "size",
    question:
      "Is the size right for the goal: a narrow goal not stretched to a year, a wide one not squeezed into a few steps?",
  },
  {
    id: "exercises",
    question:
      "Is every exercise marked direct really the step itself, with the step's own material in it? Anything only related is support, or dropped.",
  },
  {
    id: "wishes",
    question:
      "Does the plan keep every wish the player stated — songs they named, sides they left out, how they want to learn?",
  },
] as const;

export type ReviewCriterionId = (typeof REVIEW_CRITERIA)[number]["id"];
export const REVIEW_CRITERION_IDS = REVIEW_CRITERIA.map(
  (criterion) => criterion.id,
) as [ReviewCriterionId, ...ReviewCriterionId[]];

export interface PlanReviewEntry {
  criterion: ReviewCriterionId;
  pass: boolean;
  note: string;
}

/**
 * Why a plan cannot be saved on this review, or nothing. Every criterion has
 * to be answered once; one that did not pass means the plan is not finished.
 */
export const checkPlanReview = (
  review: PlanReviewEntry[],
  playerApproved: boolean,
): string[] => {
  const problems: string[] = [];
  const seen = new Set<string>();
  review.forEach((entry) => {
    if (seen.has(entry.criterion)) {
      problems.push(`The review answers "${entry.criterion}" twice.`);
    }
    seen.add(entry.criterion);
  });
  const missing = REVIEW_CRITERION_IDS.filter((id) => !seen.has(id));
  if (missing.length) {
    problems.push(`The review leaves out: ${missing.join(", ")}.`);
  }
  review
    .filter((entry) => !entry.pass)
    .forEach((entry) => {
      problems.push(
        `"${entry.criterion}" did not pass (${entry.note.trim()}) — change the plan, check it again, then save.`,
      );
    });
  const notes = review.map((entry) => entry.note.trim().toLowerCase());
  if (new Set(notes).size < notes.length) {
    problems.push(
      "Two criteria have the same note — each one says what was looked at for that criterion.",
    );
  }
  if (!playerApproved) {
    problems.push(
      "The player has not seen and agreed to this plan yet — show it as phases and steps first.",
    );
  }
  return problems;
};

export interface CheckpointQuestionInput {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

/**
 * A phase's checkpoint as an AI client wrote it, in the shape the app stores —
 * or what is wrong with it. The same normaliser the app's own quiz writer
 * goes through, plus the two tells of a lazy quiz: the right answer always in
 * the same place, or always the longest option.
 */
export const checkCheckpoint = (
  questions: CheckpointQuestionInput[],
  phaseId: string,
): { questions: PhaseQuizQuestion[] } | { problems: string[] } => {
  const normalised = normaliseQuizQuestions(questions, phaseId);
  const problems: string[] = [];
  if (normalised.length < PHASE_CHECK_QUESTIONS) {
    problems.push(
      `Only ${normalised.length} of ${PHASE_CHECK_QUESTIONS} questions are usable — each needs a prompt, 4 different options, an answerIndex of 0–3, and no repeated prompt.`,
    );
  }
  if (normalised.some((question) => !question.explanation)) {
    problems.push("Every question needs an explanation of the right answer.");
  }
  if (
    normalised.length > 1 &&
    new Set(normalised.map((question) => question.answerIndex)).size === 1
  ) {
    problems.push(
      "The right answer is in the same position in every question — move it around.",
    );
  }
  const longest = normalised.filter((question) => {
    const right = question.options[question.answerIndex].length;
    return question.options.every(
      (option, index) =>
        index === question.answerIndex || option.length < right,
    );
  });
  if (normalised.length > 1 && longest.length === normalised.length) {
    problems.push(
      "The right answer is the longest option in every question — a player can pass by length alone.",
    );
  }
  return problems.length ? { problems } : { questions: normalised };
};
