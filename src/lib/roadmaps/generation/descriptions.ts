import type {
  RoadmapPhase,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";

import { findCatalogEntry } from "./exerciseCatalog";
import { renderExemplars } from "./houseStyle";
import { HOUSE_VOICE } from "./houseVoice";
import { DESCRIPTION_LENGTH, wordCount } from "./lengths";
import { LEVEL_RULES, type RoadmapLevel } from "./levels";
import { completeJson, GenerationError } from "./openaiJson";
import type { UsageLedger } from "./usage";

export const SESSIONS_RANGE = { min: 2, max: 14 } as const;

interface DescribedStep {
  id: string;
  description: string;
  successCriteria: string;
  sessionsRequired: number;
  exerciseSetup: string | null;
}

interface DescriptionsOutput {
  steps: DescribedStep[];
}

const DESCRIPTIONS_SCHEMA = {
  type: "object",
  properties: {
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "The step id, copied exactly" },
          description: { type: "string" },
          successCriteria: { type: "string" },
          sessionsRequired: {
            type: "integer",
            description: `${SESSIONS_RANGE.min}–${SESSIONS_RANGE.max}, calibrated to the step`,
          },
          exerciseSetup: {
            type: ["string", "null"],
            description:
              "For a configurable app exercise only: the settings for this step in a few words (key, chords or scale, tempo). Null otherwise",
          },
        },
        required: [
          "id",
          "description",
          "successCriteria",
          "sessionsRequired",
          "exerciseSetup",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["steps"],
  additionalProperties: false,
};

const DESCRIPTIONS_SYSTEM = `You are the curriculum author for riff.quest, a guitar practice app. You write the text of roadmap steps in the app's house style. A human editor polishes it afterwards, so specific and concrete beats cautious and general.

${LEVEL_RULES}

---

HOUSE STYLE — match these two curated steps closely (structure, tone, level of detail):

${renderExemplars()}

---

${HOUSE_VOICE}

---

WHAT EVERY DESCRIPTION DOES:
- Sections in square brackets, one per line, then the text.
  - Physical step: [What it is] ONE sentence. [Why it matters] ONE sentence. [How to practice] at most THREE sentences. Nothing else — no [Common trap] section on a physical step.
  - Conceptual or musical step: [What it is] / [Why it matters] / [How to practice], each 2–3 sentences (add [Common trap] in 1–2 sentences only when there is a real, specific trap — not on every step).
  - If you are about to write a fourth sentence in a section, stop and cut one of the existing three instead.
- Be concrete: name chords, strings, positions, counting ("1 & 2 &"), the actual motion, a real song or record when the goal is an artist or a genre. Tempo targets belong in the success criteria, as numbers.
- When the step has an app exercise marked "trains this step", [How to practice] tells the student to play it BY ITS EXACT TITLE and what to listen for in it ("Then play Timing — Quarter Notes, and check that every re-entry lands on the click"). Never mention an exercise that is not assigned to that step.
- When the app exercise is marked "warm-up only", it does NOT contain the step's material — not the riff, not the phrase, not the song. At most one clause may send the student to it by its exact title as a warm-up before the real work ("Warm up with Play by Ear — Medium, then…"). Never write that the step's phrase, riff or song is played "in" that exercise, and never build [How to practice] around it. Leaving it out of the text altogether is fine.
- exerciseSetup: when the app exercise is one the student configures (its title says "Pick Your…", "Builder", or it takes a key, chords, a scale or a tempo), give the settings for THIS step in a few words — "A minor, i–VI–III–VII, 80 BPM". The app shows it next to the exercise. Null for every other exercise and for steps without one.
- "plan note" is what the plan's author meant the step to be. Write the step it describes; do not quote it.
- Explain the "why" with something real: what the technique makes possible, what a record does with it, what goes wrong without it.
- Length: physical ${DESCRIPTION_LENGTH.physical.min}–${DESCRIPTION_LENGTH.physical.max} words, conceptual and musical ${DESCRIPTION_LENGTH.conceptual.min}–${DESCRIPTION_LENGTH.conceptual.max} words. The sentence caps above are what gets you there — count sentences as you write, not words after the fact.

NEVER:
- "Start slow and increase gradually", "practice with a metronome", "focus on accuracy" and similar filler. Say the specific thing instead.
- Re-explain a mastered step. Everything in earlier phases and earlier steps is known; at most one clause of reference, then move on.
- Restate the title as the first sentence.
- Vague success criteria. The criteria are a test the student can run: what they play, how fast, what it must sound like, what must not happen.

sessionsRequired — an integer ${SESSIONS_RANGE.min}–${SESSIONS_RANGE.max}, calibrated per step and varied across the phase: a listening or setup step 2–3; a quick refinement of a known motion 4–5; a new technique or coordination 6–8; a deep musical skill that needs weeks to sink in (improvising over changes, transcription, phrasing, ear) 9–14. Never give every step the same number.

Return one entry per requested step id, with the id copied exactly.`;

interface DescribeParams {
  goal: string;
  level: RoadmapLevel;
  phases: RoadmapPhase[];
  phaseIndex: number;
  /** Only these steps of the phase; every step when omitted. */
  stepIds?: string[];
  /**
   * What the student asked to change, in their words, when a step is being
   * rewritten on request rather than written for the first time.
   */
  guidance?: string;
  /** The student's brief, rendered by `briefForModel`; empty when there is none. */
  brief?: string;
  /** Where the call's token usage is recorded. */
  ledger?: UsageLedger;
}

const exerciseLine = (step: RoadmapStep) => {
  const entry = findCatalogEntry(step.suggestedExerciseId);
  if (!entry) return "app exercise: none";
  const role =
    step.exerciseRole === "support" ? "warm-up only" : "trains this step";
  return `app exercise (${role}): "${entry.title}" — ${entry.description}${
    entry.whyItMatters ? ` ${entry.whyItMatters.slice(0, 220)}` : ""
  }${step.exerciseWhy ? `\n   why this exercise: ${step.exerciseWhy}` : ""}`;
};

/** A step as the other phases see it: its title, and what it is about when the plan said. */
const outlineStep = (step: RoadmapStep) =>
  step.summary ? `${step.title} (${step.summary})` : step.title;

const buildDescriptionsUser = ({
  goal,
  level,
  phases,
  phaseIndex,
  stepIds,
  guidance,
  brief,
}: DescribeParams): string => {
  const phase = phases[phaseIndex];
  const wanted = new Set(stepIds ?? phase.steps.map((step) => step.id));

  const previous = phases
    .slice(0, phaseIndex)
    .map(
      (p, i) =>
        `Phase ${i + 1}: ${p.title} — ${p.steps.map(outlineStep).join("; ")}`,
    )
    .join("\n");
  // The later phases with their steps: a description that knows a song or a
  // technique has its own step further on does not teach it here.
  const upcoming = phases
    .slice(phaseIndex + 1)
    .map(
      (p, i) =>
        `Phase ${phaseIndex + 2 + i}: ${p.title} — ${p.steps.map((s) => s.title).join("; ")}`,
    )
    .join("\n");

  const stepsText = phase.steps
    .map((step, index) => {
      const marker = wanted.has(step.id) ? "WRITE" : "context only";
      return `${index + 1}. [${marker}] id=${step.id}
   title: ${step.title}
   skill type: ${step.skillType ?? "physical"}${step.summary ? `\n   plan note: ${step.summary}` : ""}${
     step.suggestedSong
       ? `\n   library song (has a tab in the app): "${step.suggestedSong.title}" — ${step.suggestedSong.artist}`
       : ""
   }
   ${exerciseLine(step)}`;
    })
    .join("\n");

  return `Student's goal: "${goal}"
Skill level: ${level}
${brief?.trim() ? `\n${brief.trim()}\n` : ""}
${previous ? `ALREADY MASTERED (earlier phases — never re-explain):\n${previous}\n\n` : ""}CURRENT PHASE ${phaseIndex + 1} of ${phases.length}: ${phase.title}
${stepsText}
${upcoming ? `\nUPCOMING PHASES (do not teach ahead):\n${upcoming}` : ""}
${
  guidance?.trim()
    ? `\nTHE STUDENT ASKED FOR THIS CHANGE — it decides how the steps marked WRITE are written, as long as it stays about this step's skill: "${guidance.trim()}"\n`
    : ""
}
Write description, successCriteria and sessionsRequired for every step marked WRITE. Steps earlier in this phase are mastered by the time a later one is practised.`;
};

const clampSessions = (value: unknown): number => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 8;
  return Math.min(SESSIONS_RANGE.max, Math.max(SESSIONS_RANGE.min, n));
};

const MAX_SETUP_LENGTH = 80;

/**
 * The settings line for the step's exercise — only when the step has one, and
 * cleared when a rewrite no longer gives any.
 */
const exerciseSetupOf = (
  step: RoadmapStep,
  setup: string | null | undefined,
): { exerciseSetup?: string } => {
  const text = step.suggestedExerciseId
    ? (setup ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_SETUP_LENGTH)
    : "";
  return text ? { exerciseSetup: text } : { exerciseSetup: undefined };
};

/**
 * Writes the steps of one phase in a single call, so the texts of a phase are
 * coherent with each other and the model sees the exercise each step owns.
 * Returns the phase with the requested steps filled in; every requested step
 * must come back, or the call fails.
 */
export async function describePhaseSteps(
  params: DescribeParams,
): Promise<RoadmapPhase> {
  const phase = params.phases[params.phaseIndex];
  if (!phase) throw new GenerationError("No such phase", 400);

  const wanted = params.stepIds ?? phase.steps.map((step) => step.id);
  const output = await completeJson<DescriptionsOutput>({
    system: DESCRIPTIONS_SYSTEM,
    user: buildDescriptionsUser(params),
    schemaName: "phase_descriptions",
    schema: DESCRIPTIONS_SCHEMA,
    maxTokens: 6000 + wanted.length * 1500,
    reasoningEffort: "low",
    ledger: params.ledger,
  });

  const byId = new Map(output.steps.map((step) => [step.id, step]));
  // An id copied with a character off is still the right text in the right
  // place: when the model answered one entry per requested step, an entry
  // whose id matches nothing is taken for the step at its position, rather
  // than failing the whole phase over a typo in a uuid.
  if (output.steps.length === wanted.length) {
    const known = new Set(wanted);
    wanted.forEach((id, index) => {
      const atPosition = output.steps[index];
      if (
        !byId.get(id)?.description?.trim() &&
        atPosition?.description?.trim() &&
        !known.has(atPosition.id)
      ) {
        byId.set(id, atPosition);
      }
    });
  }
  const missing = wanted.filter((id) => !byId.get(id)?.description?.trim());
  if (missing.length) {
    throw new GenerationError(
      `Descriptions missing for ${missing.length} of ${wanted.length} steps in "${phase.title}"`,
    );
  }

  return {
    ...phase,
    steps: phase.steps.map((step) => {
      const written = wanted.includes(step.id) ? byId.get(step.id) : undefined;
      if (!written) return step;
      return {
        ...step,
        description: written.description.trim(),
        successCriteria: written.successCriteria.trim(),
        sessionsRequired: clampSessions(written.sessionsRequired),
        ...exerciseSetupOf(step, written.exerciseSetup),
      };
    }),
  };
}

/** Word count of a description, for the quality gate and the tests. */
export const descriptionWords = wordCount;
