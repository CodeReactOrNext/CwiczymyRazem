import type {
  RoadmapPhase,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";

import type { SongRequest } from "../songLookup";
import { describePhaseSteps } from "./descriptions";
import { findCatalogEntry, renderExerciseCatalog } from "./exerciseCatalog";
import { HOUSE_VOICE } from "./houseVoice";
import { LEVEL_RULES, type RoadmapLevel } from "./levels";
import { completeJson, GenerationError } from "./openaiJson";
import {
  attachLibrarySongs,
  type SongResolver,
  type StructureStep,
  toRoadmapPhases,
} from "./structure";
import type { UsageLedger } from "./usage";

interface ProposalOutput {
  steps: StructureStep[];
}

const proposalSchema = (count: number) => ({
  type: "object",
  properties: {
    steps: {
      type: "array",
      minItems: count,
      maxItems: count,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          skillType: {
            type: "string",
            enum: ["physical", "conceptual", "musical"],
          },
          suggestedExerciseId: {
            type: ["string", "null"],
            description:
              "An id copied exactly from the exercise library, or null",
          },
          exerciseWhy: {
            type: "string",
            description:
              "One sentence: why this exercise trains this step, or why none fits",
          },
          songTitle: {
            type: ["string", "null"],
            description:
              "Only on a step about ONE real song: its exact original title. Otherwise null",
          },
          songArtist: {
            type: ["string", "null"],
            description:
              "The artist of that original recording. Null whenever songTitle is null",
          },
        },
        required: [
          "title",
          "skillType",
          "suggestedExerciseId",
          "exerciseWhy",
          "songTitle",
          "songArtist",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["steps"],
  additionalProperties: false,
});

const PROPOSAL_SYSTEM = `You are the curriculum author for riff.quest, a guitar practice app. A student's roadmap already exists and they want more in one of its phases. You add the new step or steps at the place shown — nothing else changes. A human editor polishes what you write, so be specific and opinionated rather than safe and generic.

${LEVEL_RULES}

---

${HOUSE_VOICE}

---

RULES FOR A NEW STEP:
- A specific skill for THIS goal, 2–8 words, in the voice of the titles already there. A song title, a chord name, a tuning or a technique variant is welcome. Not "Basic strumming patterns" or any title that could sit in every roadmap.
- Not a duplicate or a rewording of any step anywhere in the roadmap — read the whole outline before writing. If the student's wish is already covered by an existing step, take the wish one step further instead of repeating it.
- It belongs in this phase, at this position: everything before it is mastered by then, everything after it is not yet.
- Something the student DOES, repeatedly, across several practice sessions — never a single checklist task.
- skillType: "physical" (a motion, coordination, technique), "conceptual" (theory, harmony, fretboard knowledge), "musical" (ear, phrasing, improvising, repertoire, performance).

EXERCISE LIBRARY — lines "id | title | difficulty | category | skills | what it trains":
- Copy the id EXACTLY as written, or use null. Never invent an id.
- Prefer an exercise this phase does not already use.
- Library difficulty for each level: Absolute Beginner → beginner, easy; Beginner → beginner, easy, medium; Intermediate → easy, medium, hard; Advanced → medium, hard.
- Song-specific and listening steps often have no exercise — null is the honest answer there.

SONGS — songTitle and songArtist:
- Only on a step about learning ONE real song: exact original title, the artist of the original recording. Every other step gets null for both. Never invent a song.

THE STUDENT'S WISH, when given, decides what the new steps are about. Without one, add what the phase most obviously lacks for this goal.`;

export interface ExtendPhaseParams {
  goal: string;
  level: RoadmapLevel;
  phases: RoadmapPhase[];
  phaseIndex: number;
  /** The new steps go right after this step; at the end of the phase when absent. */
  afterStepId?: string | null;
  count: number;
  /** What the student asked for, in their words. */
  guidance?: string;
  ledger?: UsageLedger;
  resolveSong?: SongResolver;
}

const outline = (phases: RoadmapPhase[]) =>
  phases
    .map(
      (phase, index) =>
        `Phase ${index + 1}: ${phase.title} — ${phase.steps
          .map((step) => step.title)
          .join("; ")}`,
    )
    .join("\n");

const buildProposalUser = ({
  goal,
  level,
  phases,
  phaseIndex,
  afterStepId,
  count,
  guidance,
}: ExtendPhaseParams): string => {
  const phase = phases[phaseIndex];
  const afterIndex = afterStepId
    ? phase.steps.findIndex((step) => step.id === afterStepId)
    : -1;
  const position =
    afterIndex === -1
      ? "at the END of the phase"
      : `right AFTER step ${afterIndex + 1} ("${phase.steps[afterIndex].title}")`;
  const used = phase.steps
    .map((step) => findCatalogEntry(step.suggestedExerciseId)?.title)
    .filter(Boolean);

  return `Student's goal: "${goal}"
Skill level: ${level}

THE WHOLE ROADMAP (every existing step — nothing new may repeat one):
${outline(phases)}

THE PHASE TO EXTEND — Phase ${phaseIndex + 1}: ${phase.title}
${phase.steps.map((step, index) => `${index + 1}. ${step.title}`).join("\n")}
${used.length ? `\nExercises this phase already uses: ${used.join("; ")}` : ""}

INSERT ${count} new ${count === 1 ? "step" : "steps"} ${position}.
${guidance?.trim() ? `\nTHE STUDENT'S WISH: "${guidance.trim()}"\n` : ""}
EXERCISE LIBRARY:
${renderExerciseCatalog()}`;
};

/** The model's proposal for the new steps, before the library has checked it. */
export async function proposePhaseSteps(
  params: ExtendPhaseParams,
): Promise<StructureStep[]> {
  const phase = params.phases[params.phaseIndex];
  if (!phase?.steps?.length) throw new GenerationError("No such phase", 400);

  const output = await completeJson<ProposalOutput>({
    system: PROPOSAL_SYSTEM,
    user: buildProposalUser(params),
    schemaName: "phase_extension",
    schema: proposalSchema(params.count),
    maxTokens: 6000,
    reasoningEffort: "low",
    ledger: params.ledger,
  });

  const steps = (output.steps ?? []).filter((step) => step?.title?.trim());
  if (!steps.length) {
    throw new GenerationError("The coach proposed no usable steps.");
  }
  return steps.slice(0, params.count);
}

/**
 * The phase with the new steps in place and every step renumbered. Pure, so
 * the position rule — after the named step, or at the end — is testable on
 * its own.
 */
export const insertSteps = (
  phase: RoadmapPhase,
  added: RoadmapStep[],
  afterStepId?: string | null,
): RoadmapPhase => {
  const at = afterStepId
    ? phase.steps.findIndex((step) => step.id === afterStepId)
    : -1;
  const before = at === -1 ? phase.steps : phase.steps.slice(0, at + 1);
  const after = at === -1 ? [] : phase.steps.slice(at + 1);
  return {
    ...phase,
    steps: [...before, ...added, ...after].map((step, order) => ({
      ...step,
      order,
    })),
  };
};

export interface ExtendPhaseResult {
  phase: RoadmapPhase;
  addedStepIds: string[];
  /** Songs the new steps named that the library does not have. */
  unmatchedSongs: SongRequest[];
}

/**
 * Adds steps to one phase of an existing roadmap: the model proposes them in
 * the context of everything already there, the library confirms their
 * exercises and songs the same way it does for a fresh skeleton, and then the
 * new steps get their description, success criteria and session count.
 */
export async function extendPhase(
  params: ExtendPhaseParams,
): Promise<ExtendPhaseResult> {
  const { phases, phaseIndex, level, resolveSong, ledger } = params;
  const target = phases[phaseIndex];
  if (!target?.steps?.length) throw new GenerationError("No such phase", 400);

  const proposed = await proposePhaseSteps(params);

  // The same conversion a whole skeleton goes through, on a phase of only the
  // new steps: ids, orders, library exercises checked against the level.
  const converted = toRoadmapPhases(
    [{ title: target.title, steps: proposed }],
    level,
  );
  const withSongs = resolveSong
    ? await attachLibrarySongs(
        converted.phases,
        converted.songRequests,
        resolveSong,
      )
    : { phases: converted.phases, unmatchedSongs: [] };
  const added = withSongs.phases[0].steps;
  const addedStepIds = added.map((step) => step.id);

  const inserted = insertSteps(target, added, params.afterStepId);
  const nextPhases = phases.map((phase, index) =>
    index === phaseIndex ? inserted : phase,
  );

  const described = await describePhaseSteps({
    goal: params.goal,
    level,
    phases: nextPhases,
    phaseIndex,
    stepIds: addedStepIds,
    guidance: params.guidance,
    ledger,
  });

  return {
    phase: described,
    addedStepIds,
    unmatchedSongs: withSongs.unmatchedSongs,
  };
}
