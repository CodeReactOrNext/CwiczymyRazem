import { GoalRunVerdict } from "feature/exerciseGoals/components/GoalRunVerdict";
import { getExerciseGoal, recordGoalRun } from "feature/exerciseGoals/services/exerciseGoals.service";
import { getGoalExercise } from "feature/exerciseGoals/services/goalExercises.service";
import type { ExerciseGoal } from "feature/exerciseGoals/types/exerciseGoal.types";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import type { GoalRunConfig } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { logger } from "feature/logger/Logger";
import { useRequireUserAuth } from "hooks/useRequireUserAuth";
import { useTranslation } from "hooks/useTranslation";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

/**
 * Goal mode: the goal's exercise, played run after run, each run that reaches
 * the end judged against the goal's current milestone. A cleared milestone
 * sets the metronome to the next one for the following run. The only place a
 * goal can be reached.
 */
export default function GoalPracticePage() {
  const { t } = useTranslation("goals");
  const router = useRouter();
  const userAuth = useRequireUserAuth();
  const goalId = typeof router.query.goalId === "string" ? router.query.goalId : null;
  const [exercise, setExercise] = useState<Exercise | null>(null);
  // Kept apart from the exercise: the goal moves on as milestones are cleared,
  // and the plan built from the exercise must not be rebuilt when it does.
  const [goal, setGoal] = useState<ExerciseGoal | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  // A goal reached in this sitting opens the raise-the-bar offer on the way back.
  const [isReached, setIsReached] = useState(false);

  useEffect(() => {
    if (!router.isReady || !userAuth || !goalId) return undefined;
    let cancelled = false;
    getExerciseGoal(userAuth, goalId)
      .then(async (fetched) => {
        const found = fetched?.status === "active" ? await getGoalExercise(fetched.exerciseId) : null;
        if (cancelled) return;
        if (!fetched || fetched.status !== "active" || !found) {
          router.replace("/goals");
          return;
        }
        setExercise(found);
        setGoal(fetched);
      })
      .catch((error) => {
        logger.error(error, { context: "GoalPracticePage" });
        router.replace("/goals");
      });
    return () => {
      cancelled = true;
    };
  }, [router, router.isReady, userAuth, goalId]);

  const plan = useMemo<ExercisePlan | null>(() => {
    if (!exercise || !goalId || !userAuth) return null;
    return {
      id: `goal-${goalId}`,
      title: exercise.title,
      description: exercise.description,
      category: exercise.category,
      difficulty: exercise.difficulty,
      exercises: [exercise],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userAuth,
      image: null,
    };
  }, [exercise, goalId, userAuth]);

  const goalRun = useMemo<GoalRunConfig | undefined>(() => {
    if (!goal || !exercise || !userAuth) return undefined;
    return {
      targetBpm: goal.stageBpm,
      summaryEyebrow: t("verdict.eyebrow", { bpm: goal.targetBpm }),
      pendingContent: <GoalRunVerdict state={{ kind: "saving" }} />,
      onRunComplete: async (run) => {
        if (run.bpm === null) return <GoalRunVerdict state={{ kind: "not_scored" }} />;
        const scored = { bpm: run.bpm, accuracy: Math.round(run.accuracy) };
        try {
          const result = await recordGoalRun(userAuth, goal.id, exercise, scored, run.timing);
          if (result.outcome.justCompleted) setIsReached(true);
          setGoal(result.goal);
          return <GoalRunVerdict state={{ kind: "judged", goal: result.goal, run: scored, outcome: result.outcome }} />;
        } catch (error) {
          logger.error(error, { context: "recordGoalRun" });
          return <GoalRunVerdict state={{ kind: "error" }} />;
        }
      },
    };
  }, [goal, exercise, userAuth, t]);

  const backToGoals = () => {
    router.push(isReached && goalId ? `/goals?completed=${goalId}` : "/goals");
  };

  // The in-app player, not a landing page — keep it out of the index.
  const noIndex = (
    <Head>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
  );

  if (!router.isReady || !plan || !goalRun) {
    return (
      <>
        {noIndex}
        <PracticeLoadingScreen isReady={false} />
      </>
    );
  }

  return (
    <>
      {noIndex}
      <PracticeSession
        plan={plan}
        goalRun={goalRun}
        onClose={backToGoals}
        onFinish={() => {
          setIsFinishing(true);
          backToGoals();
        }}
        isFinishing={isFinishing}
      />
    </>
  );
}
