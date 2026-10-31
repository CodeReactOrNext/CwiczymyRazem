import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { communityToExercise } from "feature/communityExercises/utils/communityToExercise";
import {
  autoStepBpm,
  clampGoalBpm,
  isGoalEligibleExercise,
} from "feature/exerciseGoals/utils/goalRules";
import { EXERCISE_PLANS_COLLECTION } from "feature/exercisePlan/services/constants";
import type {
  DifficultyLevel,
  Exercise,
} from "feature/exercisePlan/types/exercise.types";
import { songToExercise } from "feature/exercisePlan/utils/songToExercise";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { consumeWriteQuota, type McpContext } from "../auth";
import { exercisesById, readOwnExercise, userRef } from "../data";
import { firestore } from "../db";
import {
  appLink,
  errorResult,
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

const MAX_PLAN_ITEMS = 20;
const DIFFICULTY_ORDER: DifficultyLevel[] = [
  "beginner",
  "easy",
  "medium",
  "hard",
];

const planItem = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("exercise"),
      id: z.string().min(1).max(120).describe("Library or own exercise id"),
      minutes: z.number().int().min(1).max(60).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("song"),
      songId: z.string().min(1).max(120),
      minutes: z.number().int().min(1).max(60).optional(),
      mode: z
        .enum(["gp", "sections"])
        .optional()
        .describe(
          "gp: their Guitar Pro tab, if attached; sections: the video map",
        ),
    })
    .strict(),
]);

type PlanItemInput = z.infer<typeof planItem>;

const planLink = (planId: string) =>
  appLink(`/timer/plans?planId=${encodeURIComponent(planId)}`);

/** Firestore takes neither functions nor undefined — the same scrub the app's plan writes do. */
const sanitize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (
    value !== null &&
    typeof value === "object" &&
    !(value instanceof Timestamp)
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([, field]) => field !== undefined && typeof field !== "function",
        )
        .map(([key, field]) => [key, sanitize(field)]),
    );
  }
  return value;
};

/** Turns the model's list of items into the plan items the app stores. */
async function resolveItems(
  uid: string,
  items: PlanItemInput[],
): Promise<Exercise[]> {
  return Promise.all(
    items.map(async (item, index) => {
      if (item.type === "exercise") {
        const library = exercisesById.get(item.id);
        if (library) {
          return {
            ...library,
            timeInMinutes: item.minutes ?? library.timeInMinutes,
          };
        }
        const own = await readOwnExercise(uid, item.id);
        if (!own) {
          throw new McpToolError(
            `Item ${index + 1}: no exercise "${item.id}" in the library or among your own exercises.`,
          );
        }
        const exercise = communityToExercise(own.data);
        return {
          ...exercise,
          timeInMinutes: item.minutes ?? exercise.timeInMinutes,
        };
      }

      const [song, progress] = await Promise.all([
        firestore.collection("songs").doc(item.songId).get(),
        userRef(uid).collection("songProgress").doc(item.songId).get(),
      ]);
      const data = song.data();
      if (!data)
        throw new McpToolError(
          `Item ${index + 1}: no song "${item.songId}" — find ids with riffquest_list_songs.`,
        );
      if (item.mode === "gp" && !progress.data()?.gpFileId) {
        throw new McpToolError(
          `Item ${index + 1}: "${data.title}" has no Guitar Pro tab attached — use mode "sections" or leave mode out.`,
        );
      }
      return songToExercise(
        {
          id: song.id,
          title: data.title,
          artist: data.artist,
          coverUrl: data.coverUrl,
        },
        item.minutes,
        item.mode,
      );
    }),
  );
}

/** What the plan card shows: the hardest item's difficulty, one category or "mixed". */
const planShape = (exercises: Exercise[]) => {
  const categories = new Set(
    exercises.filter((e) => !e.songData).map((e) => e.category),
  );
  const difficulty = exercises.reduce<DifficultyLevel>(
    (hardest, e) =>
      DIFFICULTY_ORDER.indexOf(e.difficulty) > DIFFICULTY_ORDER.indexOf(hardest)
        ? e.difficulty
        : hardest,
    "beginner",
  );
  return {
    category: categories.size === 1 ? Array.from(categories)[0] : "mixed",
    difficulty,
  };
};

const itemSummary = (exercise: Exercise) => ({
  type: exercise.songData ? "song" : "exercise",
  id: exercise.songData?.songId ?? exercise.id,
  title: exercise.title,
  minutes: exercise.timeInMinutes,
});

export function registerPlanTools(server: McpServer, context: McpContext) {
  const { uid } = context;
  const plans = () => firestore.collection(EXERCISE_PLANS_COLLECTION);

  async function readOwnPlan(planId: string) {
    const snapshot = await plans().doc(planId).get();
    const data = snapshot.data();
    if (!data || data.userId !== uid)
      throw new McpToolError(
        `No plan "${planId}" of yours — see riffquest_list_my_plans.`,
      );
    return { ref: snapshot.ref, data };
  }

  server.registerTool(
    "riffquest_list_my_plans",
    {
      title: "My practice plans",
      description:
        "The player's practice plans, most recently changed first, with their items and a link that starts each. Paged.",
      inputSchema: strictInput(pageInput(10, 30)),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ offset, limit }) =>
      runTool("riffquest_list_my_plans", async () => {
        const snapshot = await plans().where("userId", "==", uid).get();
        const all = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const items = ((data.exercises ?? []) as Exercise[]).map(
              itemSummary,
            );
            return {
              id: doc.id,
              title: data.title,
              description: data.description ?? "",
              totalMinutes: items.reduce(
                (sum, item) => sum + (item.minutes ?? 0),
                0,
              ),
              items,
              updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null,
              url: planLink(doc.id),
            };
          })
          .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
        const page = pageOf(all, offset, limit ?? 10);
        return jsonResult({ ...page.meta, plans: page.items });
      }),
  );

  server.registerTool(
    "riffquest_create_practice_plan",
    {
      title: "Create a practice plan",
      description: `Saves a new private practice plan: library exercises, the player's own exercises and songs, in order (up to ${MAX_PLAN_ITEMS}). Returns a link that starts it.`,
      inputSchema: strictInput({
        title: z.string().min(1).max(80),
        description: z.string().max(500).optional(),
        items: z.array(planItem).min(1).max(MAX_PLAN_ITEMS),
      }),
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    ({ title, description, items }) =>
      runTool("riffquest_create_practice_plan", async () => {
        const exercises = await resolveItems(uid, items);
        const left = await consumeWriteQuota(context, "write");
        const now = Timestamp.now();
        const ref = await plans().add(
          sanitize({
            title: title.trim(),
            description: description?.trim() ?? "",
            ...planShape(exercises),
            exercises,
            userId: uid,
            image: null,
            isPublic: false,
            createdVia: "mcp",
            createdAt: now,
            updatedAt: now,
          }) as FirebaseFirestore.DocumentData,
        );
        return jsonResult({
          ...left,
          id: ref.id,
          title,
          totalMinutes: exercises.reduce((sum, e) => sum + e.timeInMinutes, 0),
          items: exercises.map(itemSummary),
          url: planLink(ref.id),
        });
      }),
  );

  server.registerTool(
    "riffquest_update_practice_plan",
    {
      title: "Update a practice plan",
      description:
        "Changes one of the player's plans; `items` replaces the whole list.",
      inputSchema: strictInput({
        planId: z.string().min(1).max(120),
        title: z.string().min(1).max(80).optional(),
        description: z.string().max(500).optional(),
        items: z.array(planItem).min(1).max(MAX_PLAN_ITEMS).optional(),
      }),
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    ({ planId, title, description, items }) =>
      runTool("riffquest_update_practice_plan", async () => {
        if (
          title === undefined &&
          description === undefined &&
          items === undefined
        ) {
          return errorResult(
            "Nothing to change — pass a title, description or items.",
          );
        }
        const { ref } = await readOwnPlan(planId);
        const exercises = items ? await resolveItems(uid, items) : undefined;
        const left = await consumeWriteQuota(context, "write");
        await ref.update(
          sanitize({
            ...(title !== undefined ? { title: title.trim() } : {}),
            ...(description !== undefined
              ? { description: description.trim() }
              : {}),
            ...(exercises ? { exercises, ...planShape(exercises) } : {}),
            updatedAt: Timestamp.now(),
          }) as FirebaseFirestore.DocumentData,
        );
        const { data } = await readOwnPlan(planId);
        return jsonResult({
          ...left,
          id: planId,
          title: data.title,
          items: ((data.exercises ?? []) as Exercise[]).map(itemSummary),
          url: planLink(planId),
        });
      }),
  );

  server.registerTool(
    "riffquest_add_song_to_list",
    {
      title: "Add a song to my list",
      description:
        "Puts a library song on the player's list as wantToLearn or learning. Marking it learned stays in the app, where it awards points.",
      inputSchema: strictInput({
        songId: z.string().min(1).max(120),
        status: z.enum(["wantToLearn", "learning"]),
      }),
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    ({ songId, status }) =>
      runTool("riffquest_add_song_to_list", async () => {
        const songRef = firestore.collection("songs").doc(songId);
        const userSongRef = userRef(uid).collection("userSongs").doc(songId);
        const [song, current] = await Promise.all([
          songRef.get(),
          userSongRef.get(),
        ]);
        const data = song.data();
        if (!data)
          return errorResult(
            `No song "${songId}" — find ids with riffquest_list_songs.`,
          );
        const oldStatus = current.data()?.status ?? null;
        if (oldStatus === "learned") {
          return errorResult(
            `"${data.title}" is already learned — moving it back would take its points away, so do that in the app.`,
          );
        }
        if (oldStatus === status) {
          return jsonResult({
            songId,
            title: data.title,
            status,
            changed: false,
          });
        }

        const left = await consumeWriteQuota(context, "write");
        const practicing: string[] = data.practicingUsers ?? [];
        await Promise.all([
          practicing.includes(uid)
            ? null
            : songRef.update({
                practicingUsers: FieldValue.arrayUnion(uid),
                popularity: FieldValue.increment(1),
              }),
          userSongRef.set(
            {
              songId,
              status,
              title: data.title,
              artist: data.artist,
              pointsAwarded: current.data()?.pointsAwarded === true,
              lastUpdated: Timestamp.now(),
            },
            { merge: true },
          ),
        ]);
        return jsonResult({
          ...left,
          songId,
          title: data.title,
          artist: data.artist,
          status,
          changed: true,
          url: appLink("/songs"),
        });
      }),
  );

  server.registerTool(
    "riffquest_set_exercise_goal",
    {
      title: "Set a tempo goal",
      description:
        "Opens a tempo goal on a mic-scored exercise: milestones from startBpm to targetBpm, 3 clean runs each. An open goal on the exercise is returned as it is.",
      inputSchema: strictInput({
        exerciseId: z.string().min(1).max(120),
        targetBpm: z.number().int().min(20).max(400),
        startBpm: z
          .number()
          .int()
          .min(20)
          .max(400)
          .optional()
          .describe("Defaults to the bottom of the exercise's BPM range"),
        strictness: z.enum(["relaxed", "standard", "strict"]).optional(),
        counting: z
          .enum(["streak", "total"])
          .optional()
          .describe("streak: clean runs in a row; total: any clean runs"),
      }),
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    ({ exerciseId, targetBpm, startBpm, strictness, counting }) =>
      runTool("riffquest_set_exercise_goal", async () => {
        let exercise: Exercise | undefined = exercisesById.get(exerciseId);
        if (!exercise) {
          const own = await readOwnExercise(uid, exerciseId);
          exercise = own ? communityToExercise(own.data) : undefined;
        }
        if (!exercise) return errorResult(`No exercise "${exerciseId}".`);
        if (!isGoalEligibleExercise(exercise)) {
          return errorResult(
            `"${exercise.title}" isn't scored note by note at a tempo, so it can't have a tempo goal.`,
          );
        }

        const goals = userRef(uid).collection("exerciseGoals");
        const open = (
          await goals.where("exerciseId", "==", exercise.id).get()
        ).docs.find((doc) => doc.data().status !== "completed");
        if (open) {
          const data = open.data();
          return jsonResult({
            id: open.id,
            alreadyOpen: true,
            targetBpm: data.targetBpm,
            url: appLink("/goals"),
          });
        }

        const target = clampGoalBpm(targetBpm);
        const start = Math.min(
          clampGoalBpm(startBpm ?? exercise.metronomeSpeed?.min ?? 60),
          target,
        );
        const left = await consumeWriteQuota(context, "write");
        const now = Timestamp.now();
        const ref = goals.doc();
        await ref.set({
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          targetBpm: target,
          startBpm: start,
          stepBpm: autoStepBpm(start, target),
          strictness: strictness ?? "standard",
          counting: counting ?? "streak",
          stageBpm: start,
          cleanRuns: 0,
          status: "active",
          createdAt: now,
          completedAt: null,
          updatedAt: now,
        });
        return jsonResult({
          ...left,
          id: ref.id,
          exerciseId: exercise.id,
          startBpm: start,
          targetBpm: target,
          stepBpm: autoStepBpm(start, target),
          url: appLink("/goals"),
        });
      }),
  );
}
