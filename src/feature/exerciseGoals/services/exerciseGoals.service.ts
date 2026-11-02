import { addBpmStages } from "feature/exercisePlan/services/bpmProgressService";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { logger } from "feature/logger/Logger";
import {
  firebaseAddGoalCompletedLog,
  firebaseAddGoalCreatedLog,
} from "feature/logs/services/addGoalCompletedLog.service";
import type {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  Timestamp,
  where,
  writeBatch,
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
  ExerciseRunSource,
  GoalRunInput,
  GoalRunOutcome,
  NewExerciseGoal,
  RunTiming,
} from "../types/exerciseGoal.types";
import {
  applyGoalRun,
  DEFAULT_STEP_BPM,
  RUN_HISTORY_DOC,
  RUN_HISTORY_LIMIT,
  takesPracticeRun,
} from "../utils/goalRules";

/**
 * users/{uid}/exerciseGoals/{goalId} — one doc per goal, finished ones kept as
 * history. Ids are generated, not the exercise id: raising the bar on an
 * exercise opens a new goal next to the one it was raised from.
 */
const GOALS = "exerciseGoals";
/**
 * users/{uid}/exerciseRuns/{exerciseId}/runs/{runId} — every scored run of an
 * exercise, the latest RUN_HISTORY_LIMIT of them. Keyed by exercise rather than
 * by goal, so the chart carries on across a raised bar.
 */
const RUNS = "exerciseRuns";

const goalsCollection = (uid: string) => collection(db, "users", uid, GOALS);
const runsCollection = (uid: string, exerciseId: string) =>
  collection(db, "users", uid, RUNS, exerciseId, "runs");
/**
 * users/{uid}/settings/runHistory — `exercises.{exerciseId}`: the title, when
 * the last run was played and how many runs are kept. Runs sit under each
 * exercise, so this is how a reader finds the recently played ones without
 * walking them all, and the count is what trims them to RUN_HISTORY_LIMIT.
 */
const runHistoryRef = (uid: string) =>
  doc(db, "users", uid, "settings", RUN_HISTORY_DOC);

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
  // the feed row isn't worth holding up the dialog — it swallows its own errors
  void firebaseAddGoalCreatedLog(uid, {
    goalId: ref.id,
    exerciseId: goal.exerciseId,
    exerciseTitle: goal.exerciseTitle,
    targetBpm: goal.targetBpm,
    startBpm: goal.startBpm,
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

/** The runs of one exercise, oldest first, the latest RUN_HISTORY_LIMIT of them. */
export const getExerciseRuns = async (
  uid: string,
  exerciseId: string,
): Promise<ExerciseRun[]> => {
  const snapshot = await trackedGetDocs(
    query(
      runsCollection(uid, exerciseId),
      orderBy("createdAt", "desc"),
      limit(RUN_HISTORY_LIMIT),
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

/** A run its goal judged, and where that left the goal. */
export interface JudgedRun {
  goal: ExerciseGoal;
  outcome: GoalRunOutcome;
}

interface SaveRunOptions {
  source: ExerciseRunSource;
  /** The goal the run may be judged against; null saves it unjudged. */
  goalId: string | null;
  /** Whether the goal, as the transaction reads it, takes this run. */
  judges: (goal: ExerciseGoal) => boolean;
}

/**
 * Saves one scored run and, when its goal takes it, moves the goal's count — or
 * its milestone, when the run cleared one — in the same transaction, so two runs
 * finishing close together can't both read the count the other one is about to
 * change. The run history index is stamped on the way.
 */
const saveRun = async (
  uid: string,
  exercise: Pick<Exercise, "id" | "title">,
  run: GoalRunInput,
  timing: RunTiming | null,
  { source, goalId, judges }: SaveRunOptions,
): Promise<{
  judged: JudgedRun | null;
  exerciseId: string;
  keptRuns: number | null;
}> => {
  const historyRef = runHistoryRef(uid);
  const goalRef = goalId ? doc(goalsCollection(uid), goalId) : null;

  return runTransaction(db, async (transaction) => {
    const [history, goalSnapshot] = await Promise.all([
      transaction.get(historyRef),
      goalRef ? transaction.get(goalRef) : Promise.resolve(null),
    ]);
    if (goalSnapshot && !goalSnapshot.exists()) {
      throw new Error(`Goal ${goalId} not found`);
    }
    const goal = goalSnapshot ? toGoal(goalSnapshot) : null;
    const outcome = goal && judges(goal) ? applyGoalRun(goal, run) : null;
    const now = Timestamp.now();
    // The goal's own id for the exercise, as goal runs were always kept under it.
    const exerciseId = goal?.exerciseId ?? exercise.id;

    transaction.set(doc(runsCollection(uid, exerciseId)), {
      bpm: run.bpm,
      accuracy: run.accuracy,
      timingOffsetMs: timing?.medianOffsetMs ?? null,
      timingBiasMs: timing?.biasMs ?? null,
      source,
      goalId: goal?.id ?? null,
      clean: outcome?.clean ?? null,
      createdAt: now,
    });

    // Runs saved before the index existed aren't counted — trimRuns counts them.
    const counted = history.data()?.exercises?.[exerciseId]?.count;
    const keptRuns = typeof counted === "number" ? counted + 1 : null;
    transaction.set(
      historyRef,
      {
        exercises: {
          [exerciseId]: {
            title: exercise.title,
            lastRunAt: now,
            ...(keptRuns !== null ? { count: keptRuns } : {}),
          },
        },
      },
      { merge: true },
    );

    if (!goal || !outcome || !goalRef) {
      return { judged: null, exerciseId, keptRuns };
    }
    if (goal.status !== "active") {
      return { judged: { goal, outcome }, exerciseId, keptRuns };
    }

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
    return { judged: { goal: updated, outcome }, exerciseId, keptRuns };
  });
};

/** Most old runs one trim deletes — a batch takes 500 writes. */
const MAX_TRIMMED_RUNS = 400;

/**
 * Keeps the exercise's latest RUN_HISTORY_LIMIT runs and deletes the older ones.
 * `keptRuns` is the count the index holds; null when it holds none yet (runs
 * saved before it), and then they are counted here once.
 */
const trimRuns = async (
  uid: string,
  exerciseId: string,
  keptRuns: number | null,
): Promise<void> => {
  const runs = runsCollection(uid, exerciseId);
  const count = keptRuns ?? (await getCountFromServer(runs)).data().count;
  const excess = count - RUN_HISTORY_LIMIT;
  if (excess <= 0 && keptRuns !== null) return;

  const batch = writeBatch(db);
  let deleted = 0;
  if (excess > 0) {
    const oldest = await trackedGetDocs(
      query(
        runs,
        orderBy("createdAt", "asc"),
        limit(Math.min(excess, MAX_TRIMMED_RUNS)),
      ),
    );
    oldest.docs.forEach((runDoc) => batch.delete(runDoc.ref));
    deleted = oldest.size;
  }
  // A known count only moves by what was deleted: a run saved meanwhile has
  // already added itself to it.
  batch.set(
    runHistoryRef(uid),
    {
      exercises: {
        [exerciseId]: {
          count: keptRuns === null ? count - deleted : increment(-deleted),
        },
      },
    },
    { merge: true },
  );
  await batch.commit();
};

/** What follows a saved run, none of it worth failing the run over. */
const afterRun = async (
  uid: string,
  exercise: Exercise,
  { judged, exerciseId, keptRuns }: Awaited<ReturnType<typeof saveRun>>,
) => {
  void trimRuns(uid, exerciseId, keptRuns).catch((error) =>
    logger.error(error, { context: "trimRuns" }),
  );
  if (judged?.outcome.stageCleared) {
    await onStageCleared(uid, judged.goal, exercise, judged.outcome).catch(
      (error) => logger.error(error, { context: "onStageCleared" }),
    );
  }
};

/**
 * Saves a run played outside goal mode — in a plan, a routine, the library. It
 * always goes into the exercise's history; when the exercise has an open goal
 * and the run was a real attempt at its milestone (see takesPracticeRun), the
 * goal judges it just like a goal-mode run. Resolves to that judgement, or null.
 */
export const recordPracticeRun = async (
  uid: string,
  exercise: Exercise,
  run: GoalRunInput,
  timing: RunTiming | null,
  isFullLength: boolean,
): Promise<JudgedRun | null> => {
  try {
    const goal = await getActiveGoalFor(uid, exercise.id);
    const saved = await saveRun(uid, exercise, run, timing, {
      source: "practice",
      goalId: goal?.id ?? null,
      judges: (current) => takesPracticeRun(current, run, isFullLength),
    });
    await afterRun(uid, exercise, saved);
    return saved.judged;
  } catch (error) {
    logger.error(error, { context: "recordPracticeRun" });
    return null;
  }
};

/** Judges a goal-mode run against its goal and saves it. */
export const recordGoalRun = async (
  uid: string,
  goalId: string,
  exercise: Exercise,
  run: GoalRunInput,
  timing: RunTiming | null = null,
): Promise<JudgedRun> => {
  const saved = await saveRun(uid, exercise, run, timing, {
    source: "goal",
    goalId,
    judges: () => true,
  });
  // saveRun throws when the goal is gone, and a goal-mode run is always judged.
  if (!saved.judged) throw new Error(`Goal ${goalId} did not judge the run`);
  await afterRun(uid, exercise, saved);
  return saved.judged;
};
