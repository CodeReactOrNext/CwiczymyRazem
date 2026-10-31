import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CreateCommunityExerciseInput } from "feature/communityExercises/types";
import {
  communityDocId,
  communityExerciseId,
} from "feature/communityExercises/utils/communityToExercise";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import type { GuitarSkillId } from "feature/skills/skills.types";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import { consumeWriteQuota, type McpContext } from "../auth";
import { TAB_FORMAT_GUIDE } from "../content/tabFormat";
import { firestore } from "../db";
import {
  appLink,
  errorResult,
  jsonResult,
  McpToolError,
  runTool,
  WRITE_TOOL_ANNOTATIONS,
} from "../results";
import {
  formatTabIssues,
  TAB_LIMITS,
  validateTablature,
} from "../tablature/validateTablature";
import {
  EXERCISE_CATEGORIES,
  EXERCISE_DIFFICULTIES,
  SKILL_IDS,
} from "./catalog";

const exercisesById = new Map(
  exercisesAgregat.map((exercise) => [exercise.id, exercise]),
);
const COLLECTION = "communityExercises";

// The JSON schema the client sees. Ranges a model gets wrong in a way a
// message can explain (string side, measure length) are left to
// validateTablature, which says where and why instead of a bare type error.
const noteSchema = z.object({
  string: z.number().describe("1 = high e … 6 = low E"),
  fret: z.number().describe("0–24"),
  isHammerOn: z.boolean().optional(),
  isPullOff: z.boolean().optional(),
  isBend: z.boolean().optional(),
  bendSemitones: z.number().optional(),
  isPreBend: z.boolean().optional(),
  isRelease: z.boolean().optional(),
  isVibrato: z.boolean().optional(),
  isTap: z.boolean().optional(),
  isAccented: z.boolean().optional(),
  isGhost: z.boolean().optional(),
  isDead: z.boolean().optional(),
  isPalmMute: z.boolean().optional(),
  isLetRing: z.boolean().optional(),
  isStaccato: z.boolean().optional(),
  harmonicType: z.number().optional(),
  slideIn: z.number().optional(),
  slideOut: z.number().optional(),
  dynamics: z.number().optional(),
});

const beatSchema = z.object({
  duration: z
    .number()
    .describe("In quarter notes: 1 quarter, 0.5 eighth, 0.25 sixteenth"),
  notes: z
    .array(noteSchema)
    .max(TAB_LIMITS.maxNotesPerBeat)
    .describe("Empty = rest"),
  tuplet: z.number().int().optional(),
  pickStroke: z.enum(["down", "up"]).optional(),
  chordName: z.string().max(20).optional(),
});

export const tablatureSchema = z
  .array(
    z.object({
      timeSignature: z.tuple([z.number().int(), z.number().int()]),
      beats: z.array(beatSchema).max(TAB_LIMITS.maxBeatsPerMeasure),
    }),
  )
  .min(1)
  .max(TAB_LIMITS.maxMeasures);

const exerciseFields = {
  title: z.string().min(3).max(80),
  description: z.string().min(10).max(600),
  category: z.enum(EXERCISE_CATEGORIES),
  difficulty: z.enum(EXERCISE_DIFFICULTIES),
  relatedSkills: z.array(z.enum(SKILL_IDS)).min(1).max(4),
  bpm: z
    .object({
      min: z.number().int().min(20).max(400),
      max: z.number().int().min(20).max(400),
      recommended: z.number().int().min(20).max(400),
    })
    .describe(
      "Metronome range: comfortable start, goal, and the tempo to begin at",
    ),
  minutes: z.number().int().min(1).max(30),
  instructions: z.array(z.string().min(3).max(300)).min(1).max(8),
  tips: z.array(z.string().min(3).max(300)).max(6).optional(),
  tablature: tablatureSchema,
};

type ExerciseFields = {
  [K in keyof typeof exerciseFields]: z.infer<(typeof exerciseFields)[K]>;
};

const myExercisesUrl = appLink("/my-exercises");
const editorUrl = (id: string) =>
  appLink(`/tab-editor?edit=${encodeURIComponent(id)}`);

/** Checks everything a save needs, or throws with every problem listed. */
function checkExercise(fields: Partial<ExerciseFields>) {
  const problems: string[] = [];
  const warnings: string[] = [];
  if (fields.bpm) {
    const { min, max, recommended } = fields.bpm;
    if (!(min <= recommended && recommended <= max)) {
      problems.push(
        `bpm: needs min ≤ recommended ≤ max, got ${min} / ${recommended} / ${max}`,
      );
    }
  }
  if (fields.tablature) {
    const result = validateTablature(fields.tablature as TablatureMeasure[]);
    problems.push(
      ...formatTabIssues(result.errors).map((line) => `tablature: ${line}`),
    );
    warnings.push(...formatTabIssues(result.warnings));
  }
  if (problems.length > 0) {
    throw new McpToolError(
      `Not saved. Fix these and try again:\n- ${problems.join("\n- ")}`,
    );
  }
  return warnings;
}

const toStored = (
  fields: Partial<ExerciseFields>,
): Partial<CreateCommunityExerciseInput> => {
  const stored: Partial<CreateCommunityExerciseInput> = {};
  if (fields.title !== undefined) stored.title = fields.title.trim();
  if (fields.description !== undefined)
    stored.description = fields.description.trim();
  if (fields.category !== undefined) stored.category = fields.category;
  if (fields.difficulty !== undefined) stored.difficulty = fields.difficulty;
  if (fields.relatedSkills !== undefined)
    stored.relatedSkills = Array.from(
      new Set(fields.relatedSkills),
    ) as GuitarSkillId[];
  if (fields.bpm !== undefined) stored.metronomeSpeed = fields.bpm;
  if (fields.minutes !== undefined) stored.timeInMinutes = fields.minutes;
  if (fields.instructions !== undefined)
    stored.instructions = fields.instructions.map((line) => line.trim());
  if (fields.tips !== undefined)
    stored.tips = fields.tips.map((line) => line.trim());
  if (fields.tablature !== undefined) {
    // Through JSON once: drops undefined optionals, which Firestore refuses.
    stored.tablature = JSON.parse(
      JSON.stringify(fields.tablature),
    ) as TablatureMeasure[];
  }
  return stored;
};

export function registerExerciseTools(server: McpServer, context: McpContext) {
  const { uid } = context;
  const exercises = () => firestore.collection(COLLECTION);

  async function readOwn(id: string) {
    const docId = communityDocId(id) ?? id;
    const snapshot = await exercises().doc(docId).get();
    const data = snapshot.data();
    if (!data || data.authorId !== uid) {
      throw new McpToolError(
        `No exercise "${id}" of yours — see get_my_exercises.`,
      );
    }
    return { ref: snapshot.ref, id: snapshot.id, data };
  }

  server.registerTool(
    "get_tab_format",
    {
      title: "Tab format guide",
      description:
        "The riff.quest tab format (JSON measures → beats → notes): the rules validate_tablature enforces, the techniques it supports and a worked example.",
      annotations: { readOnlyHint: true },
    },
    () =>
      runTool("get_tab_format", async () => ({
        content: [{ type: "text", text: TAB_FORMAT_GUIDE }],
      })),
  );

  server.registerResource(
    "tab-format",
    "riffquest://docs/tab-format",
    { title: "riff.quest tab format", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [
        { uri: uri.href, mimeType: "text/markdown", text: TAB_FORMAT_GUIDE },
      ],
    }),
  );

  server.registerTool(
    "validate_tablature",
    {
      title: "Check a tab",
      description:
        "Checks a tab without saving anything: every measure adds up to its time signature, strings and frets are on the neck, durations are real note values. Lists each problem with its measure and beat.",
      inputSchema: { tablature: tablatureSchema },
      annotations: { readOnlyHint: true },
    },
    ({ tablature }) =>
      runTool("validate_tablature", async () => {
        const result = validateTablature(tablature as TablatureMeasure[]);
        return jsonResult({
          ok: result.ok,
          errors: formatTabIssues(result.errors),
          warnings: formatTabIssues(result.warnings),
          stats: result.stats,
        });
      }),
  );

  server.registerTool(
    "get_exercise_tablature",
    {
      title: "Read an exercise's tab",
      description:
        "The tab of a library exercise or one of the player's own, in the same JSON format create_exercise takes.",
      inputSchema: { id: z.string().min(1).max(120) },
      annotations: { readOnlyHint: true },
    },
    ({ id }) =>
      runTool("get_exercise_tablature", async () => {
        const library = exercisesById.get(id);
        if (library) {
          if (!library.tablature?.length)
            return errorResult(`"${library.title}" has no tab.`);
          return jsonResult({
            id,
            title: library.title,
            bpm: library.metronomeSpeed,
            tablature: library.tablature,
          });
        }
        const own = await readOwn(id);
        return jsonResult({
          id: communityExerciseId(own.id),
          title: own.data.title,
          bpm: own.data.metronomeSpeed,
          tablature: own.data.tablature ?? [],
        });
      }),
  );

  server.registerTool(
    "get_my_exercises",
    {
      title: "My exercises",
      description:
        "Exercises the player made themselves (in the app or through create_exercise), newest first.",
      annotations: { readOnlyHint: true },
    },
    () =>
      runTool("get_my_exercises", async () => {
        const snapshot = await exercises().where("authorId", "==", uid).get();
        return jsonResult(
          snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: communityExerciseId(doc.id),
                title: data.title,
                category: data.category,
                difficulty: data.difficulty,
                skills: data.relatedSkills ?? [],
                bpm: data.metronomeSpeed ?? null,
                minutes: data.timeInMinutes,
                tabMeasures: data.tablature?.length ?? 0,
                isPublic: data.isPublic === true,
                createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
                editUrl: editorUrl(doc.id),
              };
            })
            .sort((a, b) =>
              (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
            ),
        );
      }),
  );

  server.registerTool(
    "create_exercise",
    {
      title: "Create an exercise from a tab",
      description:
        "Saves a new exercise with a tab as the player's PRIVATE exercise (My exercises) — only the player sees it; publishing is done in the app. The tab (in the format get_tab_format describes) is validated first and nothing is saved if it has errors. Counts toward the daily limit of new exercises.",
      inputSchema: exerciseFields,
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (fields) =>
      runTool("create_exercise", async () => {
        const warnings = checkExercise(fields);
        await consumeWriteQuota(context, "exercise");
        const user = (
          await firestore.collection("users").doc(uid).get()
        ).data();
        const ref = await exercises().add({
          ...toStored(fields),
          tips: fields.tips?.map((line) => line.trim()) ?? [],
          videoUrl: null,
          imageUrl: null,
          isPublic: false,
          authorId: uid,
          authorUsername: user?.displayName ?? "Player",
          averageRating: 0,
          ratingCount: 0,
          playCount: 0,
          thanksCount: 0,
          createdVia: "mcp",
          createdAt: FieldValue.serverTimestamp(),
        });
        return jsonResult({
          id: communityExerciseId(ref.id),
          title: fields.title,
          saved: true,
          warnings,
          playUrl: myExercisesUrl,
          editUrl: editorUrl(ref.id),
          usage: `Use id "${communityExerciseId(ref.id)}" in create_practice_plan or set_exercise_goal.`,
        });
      }),
  );

  server.registerTool(
    "update_exercise",
    {
      title: "Update my exercise",
      description:
        "Changes one of the player's own exercises. Only the fields you pass change; a new tablature replaces the old one and is validated first. Counts toward the daily change limit.",
      inputSchema: {
        id: z.string().min(1).max(120),
        ...Object.fromEntries(
          Object.entries(exerciseFields).map(([key, schema]) => [
            key,
            schema.optional(),
          ]),
        ),
      } as { id: z.ZodString } & {
        [K in keyof typeof exerciseFields]: z.ZodOptional<
          (typeof exerciseFields)[K]
        >;
      },
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    ({ id, ...fields }) =>
      runTool("update_exercise", async () => {
        const own = await readOwn(id);
        const changes = toStored(fields as Partial<ExerciseFields>);
        if (Object.keys(changes).length === 0)
          return errorResult("Nothing to change — pass at least one field.");
        const warnings = checkExercise(fields as Partial<ExerciseFields>);
        await consumeWriteQuota(context, "write");
        await own.ref.update({
          ...changes,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return jsonResult({
          id: communityExerciseId(own.id),
          updated: Object.keys(changes),
          warnings,
          playUrl: myExercisesUrl,
          editUrl: editorUrl(own.id),
        });
      }),
  );
}
