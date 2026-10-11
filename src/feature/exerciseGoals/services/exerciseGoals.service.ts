import { addBpmStages } from "feature/exercisePlan/services/bpmProgressService";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { logger } from "feature/logger/Logger";
import { firebaseAddGoalCompletedLog } from "feature/logs/services/addGoalCompletedLog.service";
import type {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  runTransaction,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import {
  trackedGetDoc,
  trackedGetDocs,
  trackedSetDoc,
} from "utils/firebase/client/firestoreTracking";

import type {
  ExerciseGoal,
  ExerciseRun,
  GoalRunInput,
  GoalRunOutcome,
  NewExerciseGoal,
  RunTiming,
} from "../types/exerciseGoal.types";
import { applyGoalRun, DEFAULT_STEP_BPM } from "../utils/goalRules";

/**
 * users/{uid}/exerciseGoals/{goalId} — one doc per goal, finished ones kept as
 * history. Ids are generated, not the exercise id: raising the bar on an
 * exercise opens a new goal next to the one it was raised from.
 */
const GOALS = "exerciseGoals";
/**
 * users/{uid}/exerciseRuns/{exerciseId}/runs/{runId} — the runs drawn on an
 * exercise's goal chart. Keyed by exercise rather than by goal, so the chart
 * carries on across a raised bar.
 */
const RUNS = "exerciseRuns";
/** How many runs the chart reads back. */
const CHART_RUN_LIMIT = 80;

const goalsCollection = (uid: string) => collection(db, "users", uid, GOALS);
const runsCollection = (uid: string, exerciseId: string) =>
  collection(db, "users", uid, RUNS, exerciseId, "runs");

const toMillis = (value: unknown): number | null =>
  value instanceof Timestamp
    ? value.toMillis()
    : typeof value === "number"
      ? value
      : null;

const toGoal = (
  snapshot:
    | DocumentSnapshot<DocumentData>
    | QueryDocumentSnapshot<DocumentData>,
): ExerciseGoal => {
  const data = snapshot.data() ?? {};
  // Goals set before paths existed are a single milestone: the target.
  const startBpm: number = data.startBpm ?? data.targetBpm;
  return {
    id: snapshot.id,
    exerciseId: data.exerciseId,
    exerciseTitle: data.exerciseTitle ?? "",
    targetBpm: data.targetBpm,
    startBpm,
    stepBpm: data.stepBpm ?? DEFAULT_STEP_BPM,
    stageBpm: data.stageBpm ?? startBpm,
    strictness: data.strictness ?? "standard",
    counting: data.counting ?? "streak",
    cleanRuns: data.cleanRuns ?? 0,
    status: data.status === "completed" ? "completed" : "active",
    createdAt: toMillis(data.createdAt) ?? 0,
    completedAt: toMillis(data.completedAt),
  };
};

const toRun = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
  exerciseId: string,
): ExerciseRun => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    exerciseId,
    bpm: data.bpm,
    accuracy: data.accuracy,
    source: data.source === "goal" ? "goal" : "practice",
    goalId: data.goalId ?? null,
    clean: typeof data.clean === "boolean" ? data.clean : null,
    createdAt: toMillis(data.createdAt) ?? 0,
    timingOffsetMs:
      typeof data.timingOffsetMs === "number" ? data.timingOffsetMs : null,
    timingBiasMs:
      typeof data.timingBiasMs === "number" ? data.timingBiasMs : null,
  };
};

/** Every goal of the player, newest first. A handful of docs — read whole. */
export const getExerciseGoals = async (
  uid: string,
): Promise<ExerciseGoal[]> => {
  const snapshot = await trackedGetDocs(goalsCollection(uid));
  return snapshot.docs.map(toGoal).sort((a, b) => b.createdAt - a.createdAt);
};

export const getExerciseGoal = async (
  uid: string,
  goalId: string,
): Promise<ExerciseGoal | null> => {
  const snapshot = await trackedGetDoc(doc(goalsCollection(uid), goalId));
  return snapshot.exists() ? toGoal(snapshot) : null;
};

/** The exercise's open goal, if it has one. */
const getActiveGoalFor = async (
  uid: string,
  exerciseId: string,
): Promise<ExerciseGoal | null> => {
  const snapshot = await trackedGetDocs(
    query(goalsCollection(uid), where("exerciseId", "==", exerciseId)),
  );
  return (
    snapshot.docs.map(toGoal).find((goal) => goal.status === "active") ?? null
  );
};

/**
 * Opens a goal. One open goal per exercise: setting a second would leave two
 * counts racing over the same runs, so the existing one wins and is returned.
 */
export const createExerciseGoal = async (
  uid: string,
  goal: NewExerciseGoal,
): Promise<ExerciseGoal> => {
  const existing = await getActiveGoalFor(uid, goal.exerciseId);
  if (existing) return existing;

  const ref = doc(goalsCollection(uid));
  const now = Timestamp.now();
  await trackedSetDoc(ref, {
    ...goal,
    stageBpm: goal.startBpm,
    cleanRuns: 0,
    status: "active",
    createdAt: now,
    completedAt: null,
    updatedAt: now,
  });
  return {
    ...goal,
    id: ref.id,
    stageBpm: goal.startBpm,
    cleanRuns: 0,
    status: "active",
    createdAt: now.toMillis(),
    completedAt: null,
  };
};

/** Removes a goal. Its runs stay on the exercise's chart. */
export const deleteExerciseGoal = async (
  uid: string,
  goalId: string,
): Promise<void> => {
  await deleteDoc(doc(goalsCollection(uid), goalId));
};

/** The runs of one exercise, oldest first, the latest CHART_RUN_LIMIT of them. */
export const getExerciseRuns = async (
  uid: string,
  exerciseId: string,
): Promise<ExerciseRun[]> => {
  const snapshot = await trackedGetDocs(
    query(
      runsCollection(uid, exerciseId),
      orderBy("createdAt", "desc"),
      limit(CHART_RUN_LIMIT),
    ),
  );
  return snapshot.docs.map((d) => toRun(d, exerciseId)).reverse();
};

/** How many of the player's session logs the history read looks through. */
const HISTORY_LOG_LIMIT = 120;

/**
 * One session log as a chart point, or null when it can't be one: a session of
 * several exercises (its scored run may belong to any of them), a run with no
 * tempo, or one already covered by the tracked runs.
 */
export const historyRunFromLog = (
  id: string,
  data: DocumentData,
  exerciseId: string,
  before: number,
): ExerciseRun | null => {
  const performance = data.micPerformance;
  const createdAt = new Date(data.timestamp ?? 0).getTime();
  if (data.exerciseIds?.length !== 1 || data.exerciseIds[0] !== exerciseId)
    return null;
  if (!performance?.bpm || !Number.isFinite(createdAt) || createdAt >= before)
    return null;
  return {
    id,
    exerciseId,
    bpm: Math.round(performance.bpm),
    accuracy: Math.round(performance.accuracy ?? 0),
    source: "practice",
    goalId: null,
    clean: null,
    createdAt,
    timingOffsetMs: null,
    timingBiasMs: null,
  };
};

/**
 * The exercise's scored sessions from before its runs were tracked, read off the
 * activity log: a session log carries the run's tempo and accuracy
 * (`micPerformance`) and the exercises it ran (`exerciseIds`). Only sessions of
 * this one exercise count — in a plan the scored run may belong to any of its
 * exercises. Lets a fresh goal open on the climb that led to it instead of an
 * empty chart.
 *
 * Best effort: anything that fails to read leaves the chart to the tracked runs.
 */
export const getExerciseHistory = async (
  uid: string,
  exerciseId: string,
  before: number,
): Promise<ExerciseRun[]> => {
  try {
    const snapshot = await trackedGetDocs(
      query(
        collection(db, "logs"),
        where("uid", "==", uid),
        where("exerciseIds", "array-contains", exerciseId),
        limit(HISTORY_LOG_LIMIT),
      ),
    );
    return snapshot.docs
      .map((logDoc) =>
        historyRunFromLog(logDoc.id, logDoc.data(), exerciseId, before),
      )
      .filter((run): run is ExerciseRun => run !== null)
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    logger.error(error, { context: "getExerciseHistory" });
    return [];
  }
};

/**
 * Puts a regular practice run on the chart — only for an exercise with an open
 * goal, since the chart is the only place runs are shown. Practice runs never
 * count toward the goal; that takes goal mode.
 */
export const recordPracticeRun = async (
  uid: string,
  exerciseId: string,
  run: GoalRunInput,
  timing: RunTiming | null = null,
): Promise<void> => {
  try {
    const goal = await getActiveGoalFor(uid, exerciseId);
    if (!goal) return;
    await trackedSetDoc(doc(runsCollection(uid, exerciseId)), {
      bpm: run.bpm,
      accuracy: run.accuracy,
      timingOffsetMs: timing?.medianOffsetMs ?? null,
      timingBiasMs: timing?.biasMs ?? null,
      source: "practice",
      goalId: goal.id,
      clean: null,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    logger.error(error, { context: "recordPracticeRun" });
  }
};

/** Ticks the exercise's "Speeds mastered" ladder up to a tempo played clean. */
const tickBpmLadder = async (
  uid: string,
  exercise: Exercise,
  upToBpm: number,
) => {
  const stages = generateBpmStages(exercise.metronomeSpeed).filter(
    (bpm) => bpm <= upToBpm,
  );
  if (!stages.length) return;
  await addBpmStages(
    uid,
    exercise.id,
    stages,
    exercise.title,
    exercise.category,
  ).catch(() => undefined);
};

/**
 * What clearing a milestone sets off: the tempo ladder ticked up to it, and,
 * for the last one, the feed entry. Neither is worth failing the run over.
 */
const onStageCleared = async (
  uid: string,
  goal: ExerciseGoal,
  exercise: Exercise,
  outcome: GoalRunOutcome,
) => {
  await Promise.all([
    tickBpmLadder(uid, exercise, outcome.stageBpm),
    outcome.justCompleted
      ? firebaseAddGoalCompletedLog(uid, {
          goalId: goal.id,
          exerciseId: goal.exerciseId,
          exerciseTitle: goal.exerciseTitle,
          targetBpm: goal.targetBpm,
        })
      : Promise.resolve(),
  ]);
};

/**
 * Judges a goal-mode run and saves it: the run goes on the chart and the goal's
 * count — or its milestone, when the run cleared one — moves in the same transaction, so two runs finishing close together
 * can't both read the count the other one is about to change.
 */
export const recordGoalRun = async (
  uid: string,
  goalId: string,
  exercise: Exercise,
  run: GoalRunInput,
  timing: RunTiming | null = null,
): Promise<{ goal: ExerciseGoal; outcome: GoalRunOutcome }> => {
  const goalRef = doc(goalsCollection(uid), goalId);

  const result = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(goalRef);
    if (!snapshot.exists()) throw new Error(`Goal ${goalId} not found`);
    const goal = toGoal(snapshot);
    const outcome = applyGoalRun(goal, run);
    const now = Timestamp.now();

    transaction.set(doc(runsCollection(uid, goal.exerciseId)), {
      bpm: run.bpm,
      accuracy: run.accuracy,
      timingOffsetMs: timing?.medianOffsetMs ?? null,
      timingBiasMs: timing?.biasMs ?? null,
      source: "goal",
      goalId,
      clean: outcome.clean,
      createdAt: now,
    });

    if (goal.status !== "active") return { goal, outcome };

    // A cleared milestone opens the next one with an empty count; the last
    // one keeps its full count on the finished goal.
    const moved = outcome.stageCleared && !outcome.justCompleted;
    const progress = {
      stageBpm: outcome.nextStageBpm ?? goal.stageBpm,
      cleanRuns: moved ? 0 : outcome.cleanRuns,
    };
    transaction.update(goalRef, {
      ...progress,
      updatedAt: now,
      ...(outcome.justCompleted
        ? { status: "completed", completedAt: now }
        : {}),
    });

    const updated: ExerciseGoal = {
      ...goal,
      ...progress,
      ...(outcome.justCompleted
        ? { status: "completed" as const, completedAt: now.toMillis() }
        : {}),
    };
    return { goal: updated, outcome };
  });

  if (result.outcome.stageCleared) {
    await onStageCleared(uid, result.goal, exercise, result.outcome).catch(
      (error) => logger.error(error, { context: "onStageCleared" }),
    );
  }

  return result;
};
