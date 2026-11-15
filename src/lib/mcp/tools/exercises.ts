import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CreateCommunityExerciseInput } from "feature/communityExercises/types";
import { communityExerciseId } from "feature/communityExercises/utils/communityToExercise";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import type { GuitarSkillId } from "feature/skills/skills.types";
import { FieldValue } from "firebase-admin/firestore";
import type { GuitarTuningPreset, Instrument } from "utils/audio/tunings";
import {
  findTuningPreset,
  getStandardTuningId,
  getTuningPreset,
  getTuningsFor,
} from "utils/audio/tunings";
import { z } from "zod";

import { consumeWriteQuota, type McpContext } from "../auth";
import { TAB_FORMAT_GUIDE } from "../content/tabFormat";
import {
  COMMUNITY_EXERCISES,
  exercisesById,
  readOwnExercise,
  userRef,
} from "../data";
import { firestore } from "../db";
import {
  appLink,
  docId,
  errorResult,
  fittedResult,
  IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
  jsonResult,
  McpToolError,
  pageInput,
  pageOf,
  READ_TOOL_ANNOTATIONS,
  runTool,
  strictInput,
  WRITE_TOOL_ANNOTATIONS,
} from "../results";
import {
  checkTab,
  measuresToTab,
  renderAsciiTab,
  type TabJson,
  tabSchema,
} from "../tablature/tabJson";
import {
  formatTabIssues,
  validateTablature,
} from "../tablature/validateTablature";
import {
  EXERCISE_CATEGORIES,
  EXERCISE_DIFFICULTIES,
  SKILL_IDS,
} from "./catalog";

export const instrumentSchema = z
  .enum(["guitar", "bass"])
  .optional()
  .describe("Default guitar; bass = 4-string");

// A plain string, not an enum of every preset: the enum would repeat ~20 ids in
// every tool that takes a tab, and the tool list has a size budget. The ids are
// in the tab format guide, and an unknown one is answered with the full list.
export const tuningSchema = z
  .string()
  .optional()
  .describe(
    "Tuning id, default standard; 7-string: seven-*. See riffquest_get_tab_format",
  );

const tuningIdsFor = (instrument: Instrument) =>
  getTuningsFor(instrument)
    .map((tuning) => tuning.id)
    .join(", ");

/**
 * The instrument and tuning a tab is written for, from what the client sent:
 * the tuning alone names its instrument; neither means standard guitar.
 */
export function resolveTabTuning(
  instrument: Instrument | undefined,
  tuningId: string | undefined,
): { instrument: Instrument; tuning: GuitarTuningPreset } {
  const tuning = tuningId ? findTuningPreset(tuningId) : null;
  if (tuningId && !tuning) {
    throw new McpToolError(
      `Unknown tuning "${tuningId}". Guitar: ${tuningIdsFor("guitar")}. Bass: ${tuningIdsFor("bass")}.`,
    );
  }
  const kind = instrument ?? tuning?.instrument ?? "guitar";
  if (tuning && tuning.instrument !== kind) {
    throw new McpToolError(
      `Tuning "${tuning.id}" is for ${tuning.instrument}, not ${kind}. ${kind === "bass" ? "Bass" : "Guitar"} tunings: ${tuningIdsFor(kind)}.`,
    );
  }
  return {
    instrument: kind,
    tuning: tuning ?? getTuningPreset(getStandardTuningId(kind)),
  };
}

/** How a tuning is reported back: its id, name and strings, low to high. */
const tuningOut = (tuning: GuitarTuningPreset) => ({
  id: tuning.id,
  name: tuning.stringCount === 7 ? `${tuning.name} (7-string)` : tuning.name,
  strings: tuning.notation,
});

/** A saved exercise's tuning — standard when absent, unknown or for the other instrument. */
const storedTuning = (instrument: Instrument, tuningId: unknown) => {
  const tuning =
    typeof tuningId === "string" ? findTuningPreset(tuningId) : null;
  return tuning && tuning.instrument === instrument
    ? tuning
    : getTuningPreset(getStandardTuningId(instrument));
};

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
    .strict()
    .describe("Comfortable start, goal, and the tempo to begin at"),
  minutes: z.number().int().min(1).max(30),
  instructions: z.array(z.string().min(3).max(300)).min(1).max(8),
  tips: z.array(z.string().min(3).max(300)).max(6).optional(),
  tab: tabSchema,
  instrument: instrumentSchema,
  tuning: tuningSchema,
};

type ExerciseFields = {
  [K in keyof typeof exerciseFields]: z.infer<(typeof exerciseFields)[K]>;
};

const myExercisesUrl = appLink("/my-exercises");
const editorUrl = (id: string) =>
  appLink(`/tab-editor?edit=${encodeURIComponent(id)}`);

/**
 * Checks everything a save needs, or throws with every problem listed. A new
 * `tab` is mapped to the stored form on the way; `storedTab` is the saved one,
 * re-checked when only the instrument changes.
 */
function checkExercise(
  fields: Partial<ExerciseFields>,
  instrument: GuitarTuningPreset,
  storedTab?: TablatureMeasure[],
) {
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
  let measures: TablatureMeasure[] | undefined;
  if (fields.tab || storedTab) {
    const checked = fields.tab
      ? checkTab(fields.tab, instrument)
      : {
          measures: storedTab!,
          validation: validateTablature(storedTab!, instrument),
        };
    measures = fields.tab ? checked.measures : undefined;
    problems.push(
      ...formatTabIssues(checked.validation.errors).map(
        (line) => `tab: ${line}`,
      ),
    );
    warnings.push(...formatTabIssues(checked.validation.warnings));
  }
  if (problems.length > 0) {
    throw new McpToolError(
      `Not saved. Fix these and try again:\n- ${problems.join("\n- ")}`,
    );
  }
  return { warnings, measures };
}

const toStored = (
  fields: Partial<ExerciseFields>,
  measures: TablatureMeasure[] | undefined,
  tuning: GuitarTuningPreset,
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
  if (fields.instrument !== undefined || fields.tuning !== undefined) {
    stored.instrument = tuning.instrument;
    stored.tuningId = tuning.id;
  }
  if (measures !== undefined) {
    // Through JSON once: drops undefined optionals, which Firestore refuses.
    stored.tablature = JSON.parse(
      JSON.stringify(measures),
    ) as TablatureMeasure[];
  }
  return stored;
};

/** A tab as a client gets it back: the JSON to work with, the text tab to show. */
const tabOut = (measures: TablatureMeasure[], tuning: GuitarTuningPreset) => ({
  tab: measuresToTab(measures) satisfies TabJson,
  asciiTab: renderAsciiTab(measures, tuning),
});

export function registerExerciseTools(server: McpServer, context: McpContext) {
  const { uid } = context;
  const exercises = () => firestore.collection(COMMUNITY_EXERCISES);

  async function readOwn(id: string) {
    const own = await readOwnExercise(uid, id);
    if (!own) {
      throw new McpToolError(
        `No exercise "${id}" of yours — see riffquest_get_my_exercises.`,
      );
    }
    return own;
  }

  server.registerTool(
    "riffquest_get_tab_format",
    {
      title: "Tab format guide",
      description:
        "The tab format guide: shape, rules, techniques and a worked example.",
      inputSchema: strictInput({}),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    () =>
      runTool("riffquest_get_tab_format", async () => ({
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
    "riffquest_validate_tablature",
    {
      title: "Check a tab",
      description:
        "Checks a tab without saving it: measure lengths, strings, frets, techniques. Lists each problem by measure and beat, and returns the tab as text (asciiTab).",
      inputSchema: strictInput({
        tab: tabSchema,
        instrument: instrumentSchema,
        tuning: tuningSchema,
      }),
      outputSchema: {
        ok: z.boolean(),
        errors: z.array(z.string()),
        warnings: z.array(z.string()),
        stats: z.object({
          measures: z.number(),
          beats: z.number(),
          notes: z.number(),
        }),
        asciiTab: z.string(),
      },
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ tab, instrument, tuning: tuningId }) =>
      runTool("riffquest_validate_tablature", async () => {
        const { tuning } = resolveTabTuning(instrument, tuningId);
        const { measures, validation } = checkTab(tab, tuning);
        return jsonResult({
          ok: validation.ok,
          errors: formatTabIssues(validation.errors),
          warnings: formatTabIssues(validation.warnings),
          stats: validation.stats,
          asciiTab: renderAsciiTab(measures, tuning),
        });
      }),
  );

  server.registerTool(
    "riffquest_get_exercise_tablature",
    {
      title: "Read an exercise's tab",
      description:
        "The tab of a library or own exercise: as JSON in the format riffquest_create_exercise takes (tab) and as text (asciiTab). Long tabs in parts with fromMeasure / toMeasure.",
      inputSchema: strictInput({
        id: docId(),
        fromMeasure: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("First measure to return, counted from 1 (default 1)"),
        toMeasure: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Last measure to return (default: the last one)"),
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ id, fromMeasure, toMeasure }) =>
      runTool("riffquest_get_exercise_tablature", async () => {
        const library = exercisesById.get(id);
        const source = library
          ? {
              id,
              title: library.title,
              instrument: library.instrument ?? "guitar",
              tuningId: library.tuningId,
              bpm: library.metronomeSpeed,
              tablature: library.tablature ?? [],
            }
          : await readOwn(id).then((own) => ({
              id: communityExerciseId(own.id),
              title: own.data.title,
              instrument: own.data.instrument ?? "guitar",
              tuningId: own.data.tuningId,
              bpm: own.data.metronomeSpeed,
              tablature: own.data.tablature ?? [],
            }));
        if (!source.tablature.length)
          return errorResult(`"${source.title}" has no tab.`);

        const total = source.tablature.length;
        const first = fromMeasure ?? 1;
        const last = Math.min(toMeasure ?? total, total);
        if (first > last) {
          return errorResult(
            `"${source.title}" has ${total} measures — fromMeasure has to be between 1 and ${total}, and not after toMeasure.`,
          );
        }
        const { tablature, tuningId, ...about } = source;
        const tuning = storedTuning(about.instrument, tuningId);
        return fittedResult(
          (shown) => ({
            ...about,
            tuning: tuningOut(tuning),
            totalMeasures: total,
            fromMeasure: first,
            toMeasure: first + shown.length - 1,
            ...tabOut(shown, tuning),
          }),
          tablature.slice(first - 1, last),
          "Ask for the rest with fromMeasure set to the measure after toMeasure.",
        );
      }),
  );

  server.registerTool(
    "riffquest_get_my_exercises",
    {
      title: "My exercises",
      description: "Exercises the player made themselves, newest first. Paged.",
      inputSchema: strictInput(pageInput(20, 50)),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ offset, limit }) =>
      runTool("riffquest_get_my_exercises", async () => {
        const snapshot = await exercises().where("authorId", "==", uid).get();
        const all = snapshot.docs
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
              instrument: data.instrument ?? "guitar",
              tuning: storedTuning(data.instrument ?? "guitar", data.tuningId)
                .id,
              tabMeasures: data.tablature?.length ?? 0,
              isPublic: data.isPublic === true,
              createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
              editUrl: editorUrl(doc.id),
            };
          })
          .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        const page = pageOf(all, offset, limit ?? 20);
        return jsonResult({ ...page.meta, exercises: page.items });
      }),
  );

  server.registerTool(
    "riffquest_create_exercise",
    {
      title: "Create an exercise from a tab",
      description:
        "Saves a new exercise with a tab as the player's private exercise (publishing is done in the app). The tab is checked first and nothing is saved if it has errors. Returns the tab as text (asciiTab) and a link to play it.",
      inputSchema: strictInput(exerciseFields),
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (fields) =>
      runTool("riffquest_create_exercise", async () => {
        const { tuning } = resolveTabTuning(fields.instrument, fields.tuning);
        const { warnings, measures } = checkExercise(fields, tuning);
        const left = await consumeWriteQuota(context, "exercise");
        const user = (await userRef(uid).get()).data();
        const ref = await exercises().add({
          ...toStored(fields, measures, tuning),
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
          ...left,
          id: communityExerciseId(ref.id),
          title: fields.title,
          saved: true,
          warnings,
          tuning: tuningOut(tuning),
          asciiTab: renderAsciiTab(measures ?? [], tuning),
          playUrl: myExercisesUrl,
          editUrl: editorUrl(ref.id),
          usage: `Use id "${communityExerciseId(ref.id)}" in riffquest_create_practice_plan or riffquest_set_exercise_goal.`,
        });
      }),
  );

  server.registerTool(
    "riffquest_update_exercise",
    {
      title: "Update my exercise",
      description:
        "Changes one of the player's own exercises: only the fields given. A new tab is checked first.",
      inputSchema: z
        .object(exerciseFields)
        .partial()
        .extend({ id: docId() })
        .strict(),
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    ({ id, ...fields }) =>
      runTool("riffquest_update_exercise", async () => {
        const own = await readOwn(id);
        if (Object.keys(fields).length === 0)
          return errorResult("Nothing to change — pass at least one field.");
        // A new instrument or tuning re-checks the stored tab against its
        // strings. A tuning alone names its instrument; a new instrument
        // without one starts at that instrument's standard.
        const ownInstrument: Instrument = own.data.instrument ?? "guitar";
        const retuned =
          fields.instrument !== undefined || fields.tuning !== undefined;
        const tuning = retuned
          ? resolveTabTuning(
              fields.instrument ?? (fields.tuning ? undefined : ownInstrument),
              fields.tuning,
            ).tuning
          : storedTuning(ownInstrument, own.data.tuningId);
        const { warnings, measures } = checkExercise(
          fields,
          tuning,
          !fields.tab && retuned ? own.data.tablature : undefined,
        );
        const changes = toStored(fields, measures, tuning);
        const left = await consumeWriteQuota(context, "write");
        await own.ref.update({
          ...changes,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return jsonResult({
          ...left,
          id: communityExerciseId(own.id),
          // The names the client sent, not the stored ones (bpm, not metronomeSpeed).
          updated: Object.keys(fields),
          warnings,
          ...(retuned ? { tuning: tuningOut(tuning) } : {}),
          ...(measures
            ? { asciiTab: renderAsciiTab(measures, tuning) }
            : {}),
          playUrl: myExercisesUrl,
          editUrl: editorUrl(own.id),
        });
      }),
  );
}
