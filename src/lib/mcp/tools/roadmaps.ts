import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PhaseQuiz } from "feature/aiCoach/types/phaseCheck.types";
import type {
  Roadmap,
  RoadmapPhase,
  RoadmapSongRef,
  RoadmapStep,
} from "feature/aiCoach/types/roadmap.types";
import { PHASE_CHECK_QUESTIONS } from "feature/aiCoach/utils/phaseCheck";
import { estimateRoadmapWeeks } from "feature/aiCoach/utils/roadmapEstimate";
import { findCatalogEntry } from "lib/roadmaps/generation/exerciseCatalog";
import {
  ROADMAP_LEVELS,
  type RoadmapLevel,
} from "lib/roadmaps/generation/levels";
import { STRUCTURE_LIMITS } from "lib/roadmaps/generation/limits";
import { finishSkeleton } from "lib/roadmaps/generation/structure";
import { IN_APP_ROADMAP_GENERATION } from "lib/roadmaps/generationSwitch";
import { phaseFingerprint } from "lib/roadmaps/phaseQuizzes";
import { findLibrarySong } from "lib/roadmaps/songLookup";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { consumeWriteQuota, type McpContext } from "../auth";
import {
  ROADMAP_GUIDE,
  ROADMAP_LESSONS_PER_STEP,
  ROADMAP_MAX_WISHES,
  ROADMAP_SESSIONS,
  ROADMAP_STEPS_PER_WRITE,
} from "../content/roadmapGuide";
import { firestore } from "../db";
import {
  LESSON_LEVELS,
  readLessonCatalog,
  searchLessons,
} from "../lessonCatalog";
import {
  appLink,
  docId,
  errorResult,
  IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
  jsonResult,
  McpToolError,
  READ_TOOL_ANNOTATIONS,
  runTool,
  strictInput,
  WRITE_TOOL_ANNOTATIONS,
} from "../results";
import {
  checkCheckpoint,
  checkPlanReview,
  checkRoadmapPlan,
  checkStepText,
  type PlanPhaseInput,
  REVIEW_CRITERIA,
  REVIEW_CRITERION_IDS,
} from "../roadmapPlan";

const ROADMAPS = "roadmaps";
const PROGRESS = "userRoadmapProgress";
const QUIZZES = "roadmapPhaseQuizzes";
/** Roadmaps a player may keep that their assistant wrote — a shelf, not an archive. */
export const MAX_MCP_ROADMAPS = 12;

const stepInput = z
  .object({
    title: z.string().min(2).max(80),
    skillType: z.enum(["physical", "conceptual", "musical"]),
    gist: z.string().min(8).max(240),
    // Looked up in the catalog, never used as a document path.
    exerciseId: z.string().max(120).optional(),
    exerciseFit: z.enum(["direct", "support"]).optional(),
    songId: docId().optional(),
    songTitle: z.string().max(160).optional().describe("Not in the library"),
    songArtist: z.string().max(120).optional(),
  })
  .strict();

const phasesInput = z
  .array(
    z
      .object({
        title: z.string().min(2).max(60),
        steps: z
          .array(stepInput)
          .min(STRUCTURE_LIMITS.stepsPerPhase.min)
          .max(STRUCTURE_LIMITS.stepsPerPhase.max),
      })
      .strict(),
  )
  .min(STRUCTURE_LIMITS.phases.min)
  .max(STRUCTURE_LIMITS.phases.max);

const levelInput = z.enum(ROADMAP_LEVELS);

const roadmapUrl = (id: string) => appLink(`/ai-coach?roadmapId=${id}`);

const hasText = (step: RoadmapStep) =>
  !!step.description?.trim() && !!step.successCriteria?.trim();

/** Firestore refuses `undefined`; steps are full of optional fields. */
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** A step as the tools show it: what it opens, by name. */
const stepView = (step: RoadmapStep) => {
  const exercise = findCatalogEntry(step.suggestedExerciseId);
  const song = step.suggestedSong ?? step.songRequest;
  return {
    stepId: step.id,
    title: step.title,
    skillType: step.skillType ?? "physical",
    ...(step.summary && { gist: step.summary }),
    ...(exercise && {
      exercise: exercise.title,
      exerciseId: exercise.id,
      exerciseFit: step.exerciseRole ?? "direct",
    }),
    ...(song && {
      song: `${song.title} — ${song.artist}`,
      songInLibrary: !!step.suggestedSong,
    }),
    hasText: hasText(step),
  };
};

/**
 * Whether the assistant may change this roadmap. One it wrote, always. One
 * the in-app generator wrote, only now that the generator and its paid Refine
 * are closed — otherwise nothing could change those roadmaps any more.
 */
const assistantMayEdit = (roadmap: Roadmap) =>
  roadmap.source === "mcp" || !IN_APP_ROADMAP_GENERATION;

const quizRef = (roadmapId: string, phaseId: string) =>
  firestore.collection(QUIZZES).doc(`${roadmapId}_${phaseId}`);

const phaseWritten = (phase: RoadmapPhase) => phase.steps.every(hasText);

/**
 * Which phases have a checkpoint written from the text they have now. A quiz
 * whose fingerprint no longer matches is stale: the app would write a new one
 * with our own model the next time the player sat it.
 */
async function currentCheckpoints(roadmap: Roadmap): Promise<Set<string>> {
  if (!roadmap.phases.length) return new Set();
  const snaps = await firestore.getAll(
    ...roadmap.phases.map((phase) => quizRef(roadmap.id, phase.id)),
  );
  const current = new Set<string>();
  snaps.forEach((snap, index) => {
    const quiz = snap.data() as PhaseQuiz | undefined;
    const phase = roadmap.phases[index];
    if (
      quiz?.questions?.length &&
      quiz.fingerprint === phaseFingerprint(phase)
    ) {
      current.add(phase.id);
    }
  });
  return current;
}

/** Phase numbers, from 1, that are fully written and have no current checkpoint. */
const checkpointsToWrite = (roadmap: Roadmap, current: Set<string>) =>
  roadmap.phases
    .map((phase, index) => ({ phase, number: index + 1 }))
    .filter(({ phase }) => phaseWritten(phase) && !current.has(phase.id))
    .map(({ number }) => number);

const withoutText = (roadmap: Roadmap) =>
  roadmap.phases
    .flatMap((phase) => phase.steps)
    .filter((step) => !hasText(step))
    .map((step) => ({ stepId: step.id, title: step.title }));

export function registerRoadmapTools(server: McpServer, context: McpContext) {
  const { uid } = context;

  /** The library songs a plan names by id, in one read. */
  async function readSongs(phases: PlanPhaseInput[]) {
    const ids = [
      ...new Set(
        phases
          .flatMap((phase) => phase.steps)
          .map((step) => step.songId)
          .filter((id): id is string => !!id),
      ),
    ];
    const songs = new Map<string, RoadmapSongRef>();
    if (!ids.length) return songs;
    const snaps = await firestore.getAll(
      ...ids.map((id) => firestore.collection("songs").doc(id)),
    );
    snaps.forEach((snap) => {
      const data = snap.data();
      if (!data?.title || !data?.artist) return;
      songs.set(snap.id, {
        id: snap.id,
        title: String(data.title),
        artist: String(data.artist),
        ...(data.coverUrl ? { coverUrl: String(data.coverUrl) } : {}),
      });
    });
    return songs;
  }

  async function ownRoadmaps(): Promise<Roadmap[]> {
    const snap = await firestore
      .collection(ROADMAPS)
      .where("userId", "==", uid)
      .get();
    return snap.docs.map((doc) => doc.data() as Roadmap);
  }

  /** The player's roadmap by id, or a refusal the model can act on. */
  async function readOwn(roadmapId: string): Promise<Roadmap> {
    const snap = await firestore.collection(ROADMAPS).doc(roadmapId).get();
    const roadmap = snap.data() as Roadmap | undefined;
    if (!roadmap || roadmap.userId !== uid) {
      throw new McpToolError(
        `No roadmap "${roadmapId}" of yours. riffquest_get_roadmap without an id lists them.`,
      );
    }
    return roadmap;
  }

  server.registerTool(
    "riffquest_get_roadmap_guide",
    {
      title: "Roadmap guide",
      description:
        "The roadmap guide: the shape of a plan and of a step's text, the rules the checks enforce, two worked steps.",
      inputSchema: strictInput({}),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    () =>
      runTool("riffquest_get_roadmap_guide", async () => ({
        content: [{ type: "text", text: ROADMAP_GUIDE }],
      })),
  );

  server.registerResource(
    "roadmap-guide",
    "riffquest://docs/roadmap-guide",
    { title: "riff.quest roadmap guide", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [
        { uri: uri.href, mimeType: "text/markdown", text: ROADMAP_GUIDE },
      ],
    }),
  );

  server.registerTool(
    "riffquest_check_roadmap_plan",
    {
      title: "Check a roadmap plan",
      description:
        "Checks a roadmap plan without saving it: ids, level fit, size, song placement, duplicates. Lists each problem by step title.",
      inputSchema: strictInput({ level: levelInput, phases: phasesInput }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ level, phases }) =>
      runTool("riffquest_check_roadmap_plan", async () => {
        const check = checkRoadmapPlan(
          phases,
          level as RoadmapLevel,
          await readSongs(phases),
        );
        return jsonResult({
          ok: check.problems.length === 0,
          problems: check.problems,
          notes: check.notes,
          size: check.size,
          // What code cannot judge — answered one by one when the plan is saved.
          reviewCriteria: REVIEW_CRITERIA,
        });
      }),
  );

  server.registerTool(
    "riffquest_create_roadmap",
    {
      title: "Save a roadmap plan",
      description: `Saves a plan that passes riffquest_check_roadmap_plan as a private roadmap, with its review (every criterion of the roadmap guide answered) and the player's wishes. Returns a stepId per step; the steps have no text yet. Up to ${MAX_MCP_ROADMAPS} per player.`,
      inputSchema: strictInput({
        title: z.string().min(3).max(80),
        goal: z.string().min(5).max(500),
        level: levelInput,
        phases: phasesInput,
        wishes: z
          .array(z.string().min(3).max(200))
          .max(ROADMAP_MAX_WISHES)
          .optional()
          .describe("What the player asked for, a line each"),
        review: z
          .array(
            z
              .object({
                criterion: z.enum(REVIEW_CRITERION_IDS),
                pass: z.boolean(),
                note: z.string().min(12).max(300),
              })
              .strict(),
          )
          .max(REVIEW_CRITERION_IDS.length),
        playerApproved: z.boolean().describe("They saw this plan and agreed"),
      }),
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    ({ title, goal, level, phases, wishes, review, playerApproved }) =>
      runTool("riffquest_create_roadmap", async () => {
        const songs = await readSongs(phases);
        const check = checkRoadmapPlan(phases, level as RoadmapLevel, songs);
        if (check.problems.length) {
          return errorResult(
            `Not saved — the plan has problems:\n${check.problems.map((problem) => `- ${problem}`).join("\n")}`,
          );
        }
        const reviewProblems = checkPlanReview(review, playerApproved);
        if (reviewProblems.length) {
          return errorResult(
            `Not saved — the review is not done:\n${reviewProblems.map((problem) => `- ${problem}`).join("\n")}`,
          );
        }
        const constraints = (wishes ?? [])
          .map((wish) => wish.replace(/\s+/g, " ").trim())
          .filter(Boolean);
        const existing = (await ownRoadmaps()).filter(
          (roadmap) => roadmap.source === "mcp",
        );
        if (existing.length >= MAX_MCP_ROADMAPS) {
          return errorResult(
            `You already keep ${MAX_MCP_ROADMAPS} roadmaps written this way — that is the limit.`,
          );
        }

        // A song given by id is already resolved; one given by name gets the
        // same library lookup the in-app generator uses.
        const byName = new Map(
          [...songs.values()].map((song) => [
            `${song.title.toLowerCase()}::${song.artist.toLowerCase()}`,
            song,
          ]),
        );
        const finished = await finishSkeleton(
          goal.trim(),
          level as RoadmapLevel,
          check.structure,
          {
            resolveSong: async (request) =>
              byName.get(
                `${request.title.toLowerCase()}::${request.artist.toLowerCase()}`,
              ) ?? findLibrarySong(request),
          },
        );

        const left = await consumeWriteQuota(context, "write");
        const now = new Date().toISOString();
        const roadmap: Roadmap = {
          id: uuidv4(),
          userId: uid,
          title: title.trim(),
          goal: goal.trim(),
          level,
          createdAt: now,
          updatedAt: now,
          phases: finished.phases,
          visibility: "private",
          source: "mcp",
          ...(constraints.length ? { constraints } : {}),
        };
        await firestore
          .collection(ROADMAPS)
          .doc(roadmap.id)
          .set(clean(roadmap));

        return jsonResult({
          ...left,
          roadmapId: roadmap.id,
          phases: roadmap.phases.map((phase) => ({
            title: phase.title,
            steps: phase.steps.map(stepView),
          })),
          stepsWithoutText: withoutText(roadmap).length,
          notes: check.notes,
          url: roadmapUrl(roadmap.id),
        });
      }),
  );

  server.registerTool(
    "riffquest_write_roadmap_steps",
    {
      title: "Write roadmap steps",
      description: `Writes or rewrites the text of up to ${ROADMAP_STEPS_PER_WRITE} steps of one of the player's roadmaps, each with up to ${ROADMAP_LESSONS_PER_STEP} lessons. A text that fails the guide's checks saves nothing and says why. Returns the steps still without text and the phases whose checkpoint is to write.`,
      inputSchema: strictInput({
        roadmapId: docId(),
        steps: z
          .array(
            z
              .object({
                stepId: z.string().min(1).max(64),
                description: z.string().min(40).max(2400),
                successCriteria: z.string().min(10).max(700),
                sessionsRequired: z
                  .number()
                  .int()
                  .min(ROADMAP_SESSIONS.min)
                  .max(ROADMAP_SESSIONS.max),
                exerciseSetup: z.string().max(80).optional(),
                lessonIds: z
                  .array(z.string().min(1).max(20))
                  .max(ROADMAP_LESSONS_PER_STEP)
                  .optional()
                  .describe("From riffquest_find_lessons; [] removes them"),
              })
              .strict(),
          )
          .min(1)
          .max(ROADMAP_STEPS_PER_WRITE),
      }),
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    ({ roadmapId, steps }) =>
      runTool("riffquest_write_roadmap_steps", async () => {
        const ids = steps.map((step) => step.stepId);
        if (new Set(ids).size !== ids.length) {
          return errorResult("A stepId is given twice — one text per step.");
        }

        // Only lessons the index really has go on a step.
        const wanted = [...new Set(steps.flatMap((s) => s.lessonIds ?? []))];
        const known = wanted.length
          ? new Set((await readLessonCatalog()).map((lesson) => lesson.id))
          : new Set<string>();
        const unknown = wanted.filter((id) => !known.has(id));
        if (unknown.length) {
          return errorResult(
            `Nothing saved: no lesson ${unknown.map((id) => `"${id}"`).join(", ")} — ids come from riffquest_find_lessons.`,
          );
        }

        /** The roadmap with the texts in, or the reasons they cannot go in. */
        const apply = (roadmap: Roadmap) => {
          if (!assistantMayEdit(roadmap)) {
            throw new McpToolError(
              "This roadmap was generated in the app — its steps are changed there, with Refine.",
            );
          }
          const byId = new Map(
            roadmap.phases.flatMap((phase) =>
              phase.steps.map((step) => [step.id, step] as const),
            ),
          );
          const problems: string[] = [];
          const texts = new Map<string, (typeof steps)[number]>();
          for (const text of steps) {
            const step = byId.get(text.stepId);
            if (!step) {
              problems.push(`No step "${text.stepId}" in this roadmap.`);
              continue;
            }
            problems.push(...checkStepText(step, text));
            texts.set(step.id, text);
          }
          if (problems.length) return { problems };
          return {
            roadmap: {
              ...roadmap,
              updatedAt: new Date().toISOString(),
              phases: roadmap.phases.map((phase) => ({
                ...phase,
                steps: phase.steps.map((step): RoadmapStep => {
                  const text = texts.get(step.id);
                  if (!text) return step;
                  const setup = step.suggestedExerciseId
                    ? text.exerciseSetup?.replace(/\s+/g, " ").trim()
                    : "";
                  const next: RoadmapStep = {
                    ...step,
                    description: text.description.trim(),
                    successCriteria: text.successCriteria.trim(),
                    sessionsRequired: text.sessionsRequired,
                  };
                  if (setup) next.exerciseSetup = setup;
                  else delete next.exerciseSetup;
                  // Left out: the step keeps the lessons it has.
                  if (text.lessonIds?.length) {
                    next.suggestedLessonIds = [...new Set(text.lessonIds)];
                  } else if (text.lessonIds) {
                    delete next.suggestedLessonIds;
                  }
                  return next;
                }),
              })),
            },
          };
        };

        // Checked before anything is counted: a refused text costs nothing.
        const first = apply(await readOwn(roadmapId));
        if (first.problems) {
          return errorResult(
            `Nothing saved:\n${first.problems.map((problem) => `- ${problem}`).join("\n")}`,
          );
        }

        const left = await consumeWriteQuota(context, "write");
        const ref = firestore.collection(ROADMAPS).doc(roadmapId);
        const saved = await firestore.runTransaction(async (transaction) => {
          const current = (await transaction.get(ref)).data() as
            | Roadmap
            | undefined;
          if (!current || current.userId !== uid) {
            throw new McpToolError("The roadmap is gone — nothing was saved.");
          }
          const next = apply(current);
          if (!next.roadmap) {
            throw new McpToolError(
              "The roadmap changed meanwhile — read it again with riffquest_get_roadmap.",
            );
          }
          transaction.update(ref, {
            phases: clean(next.roadmap.phases),
            updatedAt: next.roadmap.updatedAt,
          });
          return next.roadmap;
        });

        const missing = withoutText(saved);
        return jsonResult({
          ...left,
          saved: steps.length,
          stepsWithoutText: missing,
          // A rewritten step makes its phase's checkpoint stale; a phase just
          // completed has none yet.
          checkpointsToWrite: checkpointsToWrite(
            saved,
            await currentCheckpoints(saved),
          ),
          ...(missing.length === 0 && {
            estimatedWeeks: estimateRoadmapWeeks(saved.phases),
          }),
          url: roadmapUrl(roadmapId),
        });
      }),
  );

  server.registerTool(
    "riffquest_find_lessons",
    {
      title: "Find lessons",
      description:
        "Searches the app's index of YouTube guitar lessons by plain words (a technique, a style, a song, an artist). Candidates for a roadmap step, best match first.",
      inputSchema: strictInput({
        text: z.string().min(2).max(120),
        level: z.enum(LESSON_LEVELS as [string, ...string[]]).optional(),
        limit: z.number().int().min(1).max(15).optional().describe("Default 8"),
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ text, level, limit }) =>
      runTool("riffquest_find_lessons", async () => {
        const found = searchLessons(await readLessonCatalog(), text, {
          level: level as (typeof LESSON_LEVELS)[number] | undefined,
          limit: limit ?? 8,
        });
        return jsonResult({
          lessons: found.map((lesson) => ({
            lessonId: lesson.id,
            title: lesson.title,
            channel: lesson.channel,
            level: lesson.level,
            topics: lesson.topics,
            minutes: lesson.minutes,
          })),
        });
      }),
  );

  server.registerTool(
    "riffquest_write_roadmap_checkpoint",
    {
      title: "Write a phase checkpoint",
      description: `Writes the checkpoint quiz of one phase of one of the player's roadmaps: ${PHASE_CHECK_QUESTIONS} multiple-choice questions on that phase's steps. The phase's steps need their text first.`,
      inputSchema: strictInput({
        roadmapId: docId(),
        phase: z.number().int().min(1).max(STRUCTURE_LIMITS.phases.max),
        questions: z
          .array(
            z
              .object({
                prompt: z.string().min(8).max(240),
                options: z.array(z.string().min(1).max(160)).min(4).max(4),
                answerIndex: z.number().int().min(0).max(3),
                explanation: z.string().min(8).max(400),
              })
              .strict(),
          )
          .min(PHASE_CHECK_QUESTIONS)
          .max(PHASE_CHECK_QUESTIONS),
      }),
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    ({ roadmapId, phase: phaseNumber, questions }) =>
      runTool("riffquest_write_roadmap_checkpoint", async () => {
        const roadmap = await readOwn(roadmapId);
        if (!assistantMayEdit(roadmap)) {
          return errorResult(
            "This roadmap was generated in the app — its checkpoints are written there.",
          );
        }
        const phase = roadmap.phases[phaseNumber - 1];
        if (!phase) {
          return errorResult(
            `This roadmap has ${roadmap.phases.length} phases — there is no phase ${phaseNumber}.`,
          );
        }
        if (!phaseWritten(phase)) {
          return errorResult(
            `Phase ${phaseNumber} still has steps without text — the checkpoint is written from them.`,
          );
        }
        const checked = checkCheckpoint(questions, phase.id);
        if ("problems" in checked) {
          return errorResult(
            `Nothing saved:\n${checked.problems.map((problem) => `- ${problem}`).join("\n")}`,
          );
        }

        const left = await consumeWriteQuota(context, "write");
        const quiz: PhaseQuiz = {
          roadmapId,
          phaseId: phase.id,
          fingerprint: phaseFingerprint(phase),
          questions: checked.questions,
          createdAt: new Date().toISOString(),
        };
        await quizRef(roadmapId, phase.id).set(quiz);

        const current = await currentCheckpoints(roadmap);
        return jsonResult({
          ...left,
          phase: phaseNumber,
          questions: checked.questions.length,
          checkpointsToWrite: checkpointsToWrite(roadmap, current),
          url: roadmapUrl(roadmapId),
        });
      }),
  );

  server.registerTool(
    "riffquest_get_roadmap",
    {
      title: "Player's roadmaps",
      description:
        "Without an id: the player's roadmaps with how many steps are done. With roadmapId: its phases and steps (stepId, exercise, song, whether the text is written). With stepId too: that step's full text.",
      inputSchema: strictInput({
        roadmapId: docId().optional(),
        stepId: z.string().min(1).max(64).optional(),
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ roadmapId, stepId }) =>
      runTool("riffquest_get_roadmap", async () => {
        if (!roadmapId) {
          if (stepId) {
            return errorResult("stepId needs the roadmapId it belongs to.");
          }
          const roadmaps = await ownRoadmaps();
          const runs = roadmaps.length
            ? await firestore.getAll(
                ...roadmaps.map((roadmap) =>
                  firestore.collection(PROGRESS).doc(`${uid}_${roadmap.id}`),
                ),
              )
            : [];
          return jsonResult({
            roadmaps: roadmaps
              .map((roadmap, index) => {
                const sessions = (runs[index]?.data()?.stepProgress ??
                  {}) as Record<string, number>;
                const steps = roadmap.phases.flatMap((phase) => phase.steps);
                return {
                  roadmapId: roadmap.id,
                  title: roadmap.title,
                  level: roadmap.level,
                  steps: steps.length,
                  stepsDone: steps.filter(
                    (step) =>
                      (sessions[step.id] ?? 0) >= (step.sessionsRequired || 1),
                  ).length,
                  stepsWithoutText: steps.filter((step) => !hasText(step))
                    .length,
                  writtenByAssistant: roadmap.source === "mcp",
                  updatedAt: roadmap.updatedAt,
                  url: roadmapUrl(roadmap.id),
                };
              })
              .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
          });
        }

        const roadmap = await readOwn(roadmapId);
        if (stepId) {
          const step = roadmap.phases
            .flatMap((phase) => phase.steps)
            .find((candidate) => candidate.id === stepId);
          if (!step) {
            return errorResult(`No step "${stepId}" in this roadmap.`);
          }
          return jsonResult({
            ...stepView(step),
            description: step.description,
            successCriteria: step.successCriteria,
            sessionsRequired: step.sessionsRequired,
            ...(step.exerciseSetup && { exerciseSetup: step.exerciseSetup }),
          });
        }

        const [runSnap, checkpoints] = await Promise.all([
          firestore.collection(PROGRESS).doc(`${uid}_${roadmapId}`).get(),
          currentCheckpoints(roadmap),
        ]);
        const sessions = (runSnap.data()?.stepProgress ?? {}) as Record<
          string,
          number
        >;
        return jsonResult({
          roadmapId: roadmap.id,
          title: roadmap.title,
          goal: roadmap.goal,
          level: roadmap.level,
          writtenByAssistant: roadmap.source === "mcp",
          ...(roadmap.constraints?.length && { wishes: roadmap.constraints }),
          checkpointsToWrite: assistantMayEdit(roadmap)
            ? checkpointsToWrite(roadmap, checkpoints)
            : [],
          phases: roadmap.phases.map((phase) => ({
            title: phase.title,
            checkpointWritten: checkpoints.has(phase.id),
            steps: phase.steps.map((step) => ({
              ...stepView(step),
              done: (sessions[step.id] ?? 0) >= (step.sessionsRequired || 1),
            })),
          })),
          url: roadmapUrl(roadmap.id),
        });
      }),
  );
}
