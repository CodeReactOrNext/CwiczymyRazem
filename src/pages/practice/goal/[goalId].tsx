import { GoalRunVerdict } from "feature/exerciseGoals/components/GoalRunVerdict";
import { getExerciseGoal, recordGoalRun } from "feature/exerciseGoals/services/exerciseGoals.service";
import type { ExerciseGoal } from "feature/exerciseGoals/types/exerciseGoal.types";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import type { GoalRunConfig } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { logger } from "feature/logger/Logger";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

/**
 * Goal mode: the goal's exercise, played run after run, each run that reaches
 * the end judged against the goal. The only place a goal can be reached.
 */
export default function GoalPracticePage() {
  const { t } = useTranslation("goals");
  const router = useRouter();
  const userAuth = useAppSelector(selectUserAuth);
  const goalId = typeof router.query.goalId === "string" ? router.query.goalId : null;
  const [loaded, setLoaded] = useState<{ goal: ExerciseGoal; exercise: Exercise } | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  // A goal reached in this sitting opens the raise-the-bar offer on the way back.
  const [isReached, setIsReached] = useState(false);

  useEffect(() => {
    if (!router.isReady) return undefined;
    if (!userAuth) {
      router.push("/login");
      return undefined;
    }
    if (!goalId) return undefined;
    let cancelled = false;
    getExerciseGoal(userAuth, goalId)
      .then((goal) => {
        if (cancelled) return;
        const exercise = goal && exercisesAgregat.find((candidate) => candidate.id === goal.exerciseId);
        if (!goal || goal.status !== "active" || !exercise) {
          router.replace("/goals");
          return;
        }
        setLoaded({ goal, exercise });
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
    if (!loaded || !userAuth) return null;
    const { exercise } = loaded;
    return {
      id: `goal-${loaded.goal.id}`,
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
  }, [loaded, userAuth]);

  const goalRun = useMemo<GoalRunConfig | undefined>(() => {
    if (!loaded || !userAuth) return undefined;
    const { goal, exercise } = loaded;
    return {
      targetBpm: goal.targetBpm,
      summaryEyebrow: t("verdict.eyebrow", { bpm: goal.targetBpm }),
      pendingContent: <GoalRunVerdict state={{ kind: "saving" }} />,
      onRunComplete: async (run) => {
        if (run.bpm === null) return <GoalRunVerdict state={{ kind: "not_scored" }} />;
        const scored = { bpm: run.bpm, accuracy: Math.round(run.accuracy) };
        try {
          const result = await recordGoalRun(userAuth, goal.id, exercise, scored, run.timing);
          if (result.outcome.justCompleted) setIsReached(true);
          return <GoalRunVerdict state={{ kind: "judged", goal: result.goal, run: scored, outcome: result.outcome }} />;
        } catch (error) {
          logger.error(error, { context: "recordGoalRun" });
          return <GoalRunVerdict state={{ kind: "error" }} />;
        }
      },
    };
  }, [loaded, userAuth, t]);

  const backToGoals = () => {
    router.push(isReached && loaded ?`/goals?completed=${loaded.goal.id}` : "/goals");
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
