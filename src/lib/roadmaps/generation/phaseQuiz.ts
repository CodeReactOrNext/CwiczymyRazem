import type { PhaseQuizQuestion } from "feature/aiCoach/types/phaseCheck.types";
import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { PHASE_CHECK_QUESTIONS } from "feature/aiCoach/utils/phaseCheck";

import { HOUSE_VOICE } from "./houseVoice";
import { LEVEL_RULES, type RoadmapLevel } from "./levels";
import { completeJson, GenerationError } from "./openaiJson";
import type { UsageLedger } from "./usage";

const OPTIONS_PER_QUESTION = 4;

interface QuizOutput {
  questions: {
    prompt: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }[];
}

const QUIZ_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      minItems: PHASE_CHECK_QUESTIONS,
      maxItems: PHASE_CHECK_QUESTIONS,
      items: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          options: {
            type: "array",
            minItems: OPTIONS_PER_QUESTION,
            maxItems: OPTIONS_PER_QUESTION,
            items: { type: "string" },
          },
          answerIndex: {
            type: "integer",
            description: `0–${OPTIONS_PER_QUESTION - 1}, the index of the right option`,
          },
          explanation: { type: "string" },
        },
        required: ["prompt", "options", "answerIndex", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

const QUIZ_SYSTEM = `You are the curriculum author for riff.quest, a guitar practice app. A student has just practised every step of one phase of their roadmap. You write the checkpoint: ${PHASE_CHECK_QUESTIONS} multiple-choice questions that tell whether they understood what they practised, not whether they memorised the text.

${LEVEL_RULES}

---

WHAT A GOOD QUESTION DOES:
- Tests one concrete thing from ONE step of this phase: a chord, a fret, a count, a motion, a listening cue, why a technique matters, what goes wrong without it, which record does it. Spread the questions across the steps; no step gets more than two.
- Asks something the student can only answer by having actually done the step — "what does the 7#9 chord add over a plain dominant?", "which finger frets the thumb-over bass note?", "on which beats does the palm lift?" — never a definition anyone could google.
- Has ${OPTIONS_PER_QUESTION} options that are all plausible to someone who skipped the practice, one of which is right. Wrong options are real mistakes or real misconceptions, not jokes or obvious throwaways. The right answer must not be the longest option every time; vary answerIndex across the quiz.
- Is answerable from the step's description and success criteria alone. Never test something the phase did not teach.
- Explanation: one or two sentences that say why the right answer is right, in the app's voice — concrete and specific, so a student who guessed learns the thing.

${HOUSE_VOICE}

STYLE:
- Prompts are one sentence, under 30 words, no preamble ("Which of the following…" is banned — ask directly).
- Options are short: a few words to one sentence, no trailing full stops, parallel in form.
- No trick questions, no "all of the above", no "none of the above".
- Match the vocabulary the steps use; the student has never seen another textbook.`;

interface QuizParams {
  goal: string;
  level: RoadmapLevel;
  phases: RoadmapPhase[];
  phaseIndex: number;
  ledger?: UsageLedger;
}

const buildQuizUser = ({ goal, level, phases, phaseIndex }: QuizParams) => {
  const phase = phases[phaseIndex];
  const stepsText = phase.steps
    .map(
      (step, index) => `${index + 1}. ${step.title}
   description: ${step.description || "(none)"}
   success criteria: ${step.successCriteria || "(none)"}`,
    )
    .join("\n");

  return `Student's goal: "${goal}"
Skill level: ${level}

PHASE ${phaseIndex + 1} of ${phases.length}: ${phase.title}
${stepsText}

Write the ${PHASE_CHECK_QUESTIONS}-question checkpoint for this phase.`;
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/**
 * The questions as the app stores them: trimmed, exactly four options each,
 * a valid answer index and a stable id. Anything the model got structurally
 * wrong is dropped rather than shown; the caller decides whether what is left
 * is enough for a quiz.
 */
export const normaliseQuizQuestions = (
  raw: QuizOutput["questions"] | undefined,
  phaseId: string,
): PhaseQuizQuestion[] => {
  const seen = new Set<string>();
  const questions: PhaseQuizQuestion[] = [];

  (raw ?? []).forEach((question) => {
    const prompt = clean(question?.prompt);
    const options = (question?.options ?? []).map(clean).filter(Boolean);
    const explanation = clean(question?.explanation);
    const answerIndex = Number(question?.answerIndex);

    if (!prompt || options.length !== OPTIONS_PER_QUESTION) return;
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length)
      return;
    if (
      !Number.isInteger(answerIndex) ||
      answerIndex < 0 ||
      answerIndex >= options.length
    )
      return;
    const key = prompt.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    questions.push({
      id: `${phaseId}-q${questions.length + 1}`,
      prompt,
      options,
      answerIndex,
      explanation,
    });
  });

  return questions;
};

/** Writes the checkpoint quiz of one phase. Fails rather than returning a thin quiz. */
export async function generatePhaseQuiz(
  params: QuizParams,
): Promise<PhaseQuizQuestion[]> {
  const phase = params.phases[params.phaseIndex];
  if (!phase?.steps?.length) throw new GenerationError("No such phase", 400);

  const output = await completeJson<QuizOutput>({
    system: QUIZ_SYSTEM,
    user: buildQuizUser(params),
    schemaName: "phase_quiz",
    schema: QUIZ_SCHEMA,
    maxTokens: 6000,
    reasoningEffort: "low",
    ledger: params.ledger,
  });

  const questions = normaliseQuizQuestions(output.questions, phase.id);
  if (questions.length < PHASE_CHECK_QUESTIONS) {
    throw new GenerationError(
      `Only ${questions.length} of ${PHASE_CHECK_QUESTIONS} checkpoint questions were usable for "${phase.title}"`,
    );
  }
  return questions;
}
