import { isCatalogExerciseId, renderExerciseCatalog } from "./exerciseCatalog";
import type { RoadmapLevel } from "./levels";
import { completeJson } from "./openaiJson";

interface MatchOutput {
  exerciseIds: string[];
}

const MATCH_SCHEMA = {
  type: "object",
  properties: {
    exerciseIds: {
      type: "array",
      items: { type: "string" },
      description: "0–2 ids copied exactly from the library, best first",
    },
  },
  required: ["exerciseIds"],
  additionalProperties: false,
};

const MATCH_SYSTEM = `You pick, from the riff.quest exercise library, the exercise a roadmap step should practise. The library is given as lines "id | title | difficulty | category | skills | what it trains".

Return up to 2 ids, best first, copied exactly. Return an empty list when nothing in the library trains the step — a wrong exercise is worse than none. Match the skill first, then the difficulty to the student's level (Absolute Beginner → beginner/easy; Beginner → beginner/easy/medium; Intermediate → easy/medium/hard; Advanced → medium/hard).`;

/**
 * Exercise search for a single step, from the library in context. Replaces the
 * file-search agent over a JSON dump that was five months and 64 exercises out
 * of date, and could return ids that no longer exist.
 */
export async function matchExercisesForStep(params: {
  stepTitle: string;
  description: string;
  goal: string;
  level: RoadmapLevel | string;
}): Promise<string[]> {
  const output = await completeJson<MatchOutput>({
    system: MATCH_SYSTEM,
    user: `Roadmap step: "${params.stepTitle}"
Student goal: "${params.goal}"
Level: ${params.level}
${params.description ? `Step description: ${params.description.slice(0, 1000)}\n` : ""}
EXERCISE LIBRARY:
${renderExerciseCatalog()}`,
    schemaName: "exercise_match",
    schema: MATCH_SCHEMA,
    maxTokens: 4000,
    reasoningEffort: "low",
  });

  return output.exerciseIds.filter(isCatalogExerciseId).slice(0, 2);
}
