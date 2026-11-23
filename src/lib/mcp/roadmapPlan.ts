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
import { wordCount } from "lib/roadmaps/generation/lengths";
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
 * What a roadmap is here (owner's call, 2026-11-24): a school of one subject —
 * "Legato", "Rhythm Guitar Basics" — a complete course anybody at the level
 * can walk, not one player's plan for one goal. The numbers below are the
 * curated roadmaps', measured: 7 phases, 34–38 steps, a description of about
 * 205 words (170–265), an exercise on 80–89% of the steps, a last phase that
 * is a performance.
 *
 * Pure: the tools hand in the library songs they looked up.
 */

/** The least a school is: below this it is a lesson plan, not a course. */
export const SCHOOL_SIZE = { phases: 5, steps: 24 } as const;
/** A step's description, in words: the range to aim for, and what is refused. */
export const SCHOOL_TEXT = { min: 150, max: 260, floor: 120, ceiling: 340 };
/** The frame the first and the last step add, with room for it. */
export const SCHOOL_FRAME = {
  first: "[Before you start]",
  last: "[What you can do now]",
  extraWords: 110,
} as const;
/** Topics a school's syllabus names — fewer is a list of phases, not a subject. */
export const SYLLABUS_TOPICS = { min: 8, max: 30 } as const;
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
  if (
    structure.length < SCHOOL_SIZE.phases ||
    steps.length < SCHOOL_SIZE.steps
  ) {
    problems.push(
      `${structure.length} phases and ${steps.length} steps is a lesson plan, not a school: a subject takes at least ${SCHOOL_SIZE.phases} phases and ${SCHOOL_SIZE.steps} steps — the curated ones run 7 phases and about 35. Cover the whole subject, from the first motion to playing music with it.`,
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
  if (steps.length && nothing.length / steps.length > 0.2) {
    notes.push(
      `${nothing.length} of ${steps.length} steps have neither an exercise nor a song — nothing to open in the app. The curated schools have an exercise on more than 80% of their steps: ${nothing
        .slice(0, 8)
        .map((step) => quote(step.title))
        .join(", ")}.`,
    );
  }

  return {
    problems,
    notes,
    structure,
    size: { phases: structure.length, steps: steps.length },
  };
};

export interface SyllabusTopic {
  /** One thing the subject is made of — "pull-offs", "muting the idle strings". */
  topic: string;
  /** Titles of the steps that teach it. */
  steps: string[];
}

/**
 * Whether the plan covers the subject it claims to teach. The author lists
 * what the subject is made of and which steps teach each part; code can then
 * see two things no reviewer has to be trusted on: a part of the subject that
 * no step teaches, and a step that teaches no part of it.
 */
export const checkSyllabus = (
  syllabus: SyllabusTopic[],
  phases: PlanPhaseInput[],
): string[] => {
  const problems: string[] = [];
  const titles = new Map(
    phases
      .flatMap((phase) => phase.steps)
      .map((step) => [step.title.trim().toLowerCase(), step.title.trim()]),
  );
  if (syllabus.length < SYLLABUS_TOPICS.min) {
    problems.push(
      `The syllabus names ${syllabus.length} topics — a subject has at least ${SYLLABUS_TOPICS.min}. List what the subject is really made of (the motions, their variants, how they combine, the musical uses), then see which steps teach each.`,
    );
  }
  const taught = new Set<string>();
  const seen = new Set<string>();
  syllabus.forEach(({ topic, steps }) => {
    const key = topic.trim().toLowerCase();
    if (seen.has(key))
      problems.push(`The syllabus lists ${quote(topic)} twice.`);
    seen.add(key);
    const unknown = steps.filter(
      (title) => !titles.has(title.trim().toLowerCase()),
    );
    if (unknown.length) {
      problems.push(
        `Syllabus topic ${quote(topic)} points at steps the plan does not have: ${unknown.map(quote).join(", ")}.`,
      );
    }
    const known = steps.filter((title) =>
      titles.has(title.trim().toLowerCase()),
    );
    if (!known.length) {
      problems.push(
        `Nothing in the plan teaches ${quote(topic)} — add a step for it, or it is not part of this school.`,
      );
    }
    known.forEach((title) => taught.add(title.trim().toLowerCase()));
  });
  const orphans = [...titles.entries()]
    .filter(([key]) => !taught.has(key))
    .map(([, title]) => title);
  if (orphans.length) {
    problems.push(
      `These steps teach no topic of the syllabus — either the syllabus is missing a topic or the step does not belong in this school: ${orphans.map(quote).join(", ")}.`,
    );
  }
  return problems;
};

/** A school is named after its subject, the way a course is. */
export const checkSchoolTitle = (title: string): string[] => {
  const problems: string[] = [];
  if (/\b\d+\s*(bpm|%)|\bbpm\b/i.test(title)) {
    problems.push(
      `The title ${quote(title)} names a number, not a subject — a school is called after what it teaches ("Legato", "Rhythm Guitar Basics", "Thrash Rhythm Picking").`,
    );
  }
  if (title.trim().split(/\s+/).length > 8) {
    problems.push(
      `The title ${quote(title)} is a sentence — name the subject in a few words.`,
    );
  }
  if (/\b(my|me|mine|i)\b/i.test(title)) {
    problems.push(
      `The title ${quote(title)} is about one player — a school is for everybody at its level.`,
    );
  }
  return problems;
};

export interface StepTextInput {
  description: string;
  successCriteria: string;
}

const SECTIONS = ["[What it is]", "[Why it matters]", "[How to practice]"];

/** Where a step sits in the school: the first carries the way in, the last the way out. */
export interface StepPosition {
  first?: boolean;
  last?: boolean;
}

/**
 * Whether a text names the exercise. The full title, or its name without the
 * family it is filed under — the curated steps say "the Metronome Gap Test"
 * for "Timing — Metronome Gap Test", and that is naming it.
 */
const namesExercise = (text: string, title: string): boolean => {
  const haystack = text.toLowerCase();
  const full = title.toLowerCase();
  if (haystack.includes(full)) return true;
  const short = full.split(/\s+[—–-]\s+/).pop() ?? "";
  return short.split(/\s+/).length >= 2 && haystack.includes(short);
};

/**
 * Whether a test has a measure in it. Digits, or a count in words — the
 * curated criteria say "three attempts in a row" as often as "3".
 */
const MEASURE =
  /\d|\b(once|twice|two|three|four|five|six|seven|eight|nine|ten|twelve|sixteen|half|every|whole|full|all)\b/i;

/** Every tempo a text names, as numbers: "at 140 BPM", "from 100 to 125 BPM". */
const temposIn = (text: string): number[] =>
  [...text.matchAll(/(\d{2,3})(?:\s*(?:–|-|to)\s*(\d{2,3}))?\s*BPM/gi)].flatMap(
    (match) => [match[1], match[2]].filter(Boolean).map(Number),
  );

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
  position: StepPosition = {},
  /** The top of the exercise's tempo range, when it has one. */
  exerciseMaxBpm?: number | null,
): string[] => {
  const problems: string[] = [];
  const description = text.description.trim();
  const label = quote(step.title);

  const missing = SECTIONS.filter((section) => !description.includes(section));
  if (missing.length) {
    problems.push(`${label}: the description lacks ${missing.join(", ")}.`);
  }
  if (position.first && !description.includes(SCHOOL_FRAME.first)) {
    problems.push(
      `${label} opens the school: it starts with ${SCHOOL_FRAME.first} — what the player needs before starting, and what they will be able to do at the end.`,
    );
  }
  if (position.last && !description.includes(SCHOOL_FRAME.last)) {
    problems.push(
      `${label} closes the school: it ends with ${SCHOOL_FRAME.last} — what the player has now, in concrete terms.`,
    );
  }

  const frame =
    (position.first ? SCHOOL_FRAME.extraWords : 0) +
    (position.last ? SCHOOL_FRAME.extraWords : 0);
  const words = wordCount(description);
  if (words > SCHOOL_TEXT.ceiling + frame || words < SCHOOL_TEXT.floor) {
    problems.push(
      `${label}: the description is ${words} words; a step takes ${SCHOOL_TEXT.min}–${SCHOOL_TEXT.max}${frame ? ` (plus the frame section)` : ""}. ${words < SCHOOL_TEXT.floor ? "A masterclass explains the motion, the reason and the practice fully — this is a note." : "Cut what repeats an earlier step."}`,
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
    !namesExercise(description, entry.title)
  ) {
    problems.push(
      `${label}: its exercise is ${quote(entry.title)} — [How to practice] names it by that exact title.`,
    );
  }

  // A tempo the exercise cannot be set to is a test nobody can take.
  if (entry && step.exerciseRole !== "support" && exerciseMaxBpm) {
    const tooFast = [
      ...new Set(
        temposIn(`${description} ${text.successCriteria}`).filter(
          (tempo) => tempo > exerciseMaxBpm,
        ),
      ),
    ];
    if (tooFast.length) {
      problems.push(
        `${label}: ${quote(entry.title)} goes up to ${exerciseMaxBpm} BPM, and the text asks for ${tooFast.join(", ")} BPM in it — keep the tempo inside the exercise's range, or give the step an exercise that reaches it.`,
      );
    }
  }

  if (wordCount(text.successCriteria) < 8) {
    problems.push(
      `${label}: the success criteria are a test the player can run — what they play, how fast, what it must sound like.`,
    );
  } else if (
    // Only where the app can measure it: a step with its own exercise. "Play
    // Hey Joe with the record from start to finish" is a test without a number.
    entry &&
    step.exerciseRole !== "support" &&
    !MEASURE.test(text.successCriteria)
  ) {
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
    id: "subject",
    question:
      "Is this a school of the subject — would a teacher of it recognise the course as complete and theirs, or is it a generic guitar plan with the subject's name on it?",
  },
  {
    id: "coverage",
    question:
      "Go through the syllabus as a specialist: which part of the subject is still missing, and which is covered by one thin step where it needs two or three?",
  },
  {
    id: "level",
    question:
      "Does it start exactly where the stated level stands (said in [Before you start]) — nothing the level already has, nothing out of reach too early?",
  },
  {
    id: "arc",
    question:
      "Does it run the way a course does: the basic motion, its variants, combining them, playing real music with them, and a last phase that is a performance? Is music played from the first phase, not saved for the end?",
  },
  {
    id: "specificity",
    question:
      "Is every step a concrete skill of this subject? Name any title that could sit in any roadmap.",
  },
  {
    id: "repeatable",
    question:
      "Is every step something done across several sessions — no checklist task, no setup note?",
  },
  {
    id: "exercises",
    question:
      "Is every exercise marked direct really the step itself? Does nearly every step have an exercise or a song to open — and is the library used as far as it goes for this subject?",
  },
  {
    id: "measurable",
    question:
      "Can each step end in a test the app can run — a tempo inside the exercise's range, an accuracy, a count of clean repeats?",
  },
  {
    id: "general",
    question:
      "Is it written for every player at this level, not for one person — no step that only makes sense for the player who asked?",
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
  if (normalised.length > 1 && longest.length > normalised.length / 2) {
    problems.push(
      `The right answer is the longest option in ${longest.length} of ${normalised.length} questions — a player can pass by length alone. Make the wrong options as long and as specific as the right one.`,
    );
  }
  return problems.length ? { problems } : { questions: normalised };
};
