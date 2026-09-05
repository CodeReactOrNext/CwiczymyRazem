import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { journeyModules } from "feature/journey/data/journeyModules";
import { accuracyToStars, firebaseCompleteJourneyStepWithStars } from "feature/journey/services/journey.service";
import { firebaseAddExamPassedLog } from "feature/logs/services/addExamPassedLog.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

export default function PracticeExercisePage() {
  const router = useRouter();
  const { id, mode, bpm, stepId, moduleId } = router.query;
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);

  const isExamMode = mode === "exam";
  const examBpm = bpm ? parseInt(bpm as string, 10) : undefined;

  useEffect(() => {
    if (!router.isReady) return;
    if (!userAuth) {
      router.push('/login');
      return;
    }
    if (!id) return;

    const exerciseId = (id as string).replace(/-/g, "_");
    const exercise = exercisesAgregat.find(ex => ex.id === exerciseId);

    if (exercise) {
      const dummyPlan: ExercisePlan = {
        id: `exercise-${exercise.id}`,
        title: exercise.title,
        description: `Practice session for ${exercise.title}`,
        category: exercise.category,
        difficulty: exercise.difficulty,
        exercises: [exercise],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userAuth,
        image: (exercise.imageUrl || "") as any,
      };
      setPlan(dummyPlan);
    } else {
      router.push("/timer/plans");
    }
  }, [id, userAuth, router]);

  const handleExamComplete = async (accuracy: number) => {
    const stars = accuracyToStars(accuracy);
    if (stars && userAuth && stepId && moduleId) {
      await firebaseCompleteJourneyStepWithStars(
        userAuth,
        moduleId as string,
        stepId as string,
        stars
      );

      const journeyModule = journeyModules.find((m) => m.id === moduleId);
      const step = journeyModule?.stages.flatMap((s) => s.steps).find((s) => s.id === stepId);
      if (journeyModule && step) {
        await firebaseAddExamPassedLog(
          userAuth,
          journeyModule.id,
          journeyModule.title,
          step.id,
          step.title,
          stars,
          accuracy
        );
      }
    }
    router.push({ pathname: "/journey", query: { module: moduleId, step: stepId, examResult: stars ?? "fail", accuracy: Math.round(accuracy) } });
  };

  // Anonymous visitors get a 200 with a generic title before the client-side
  // redirect to /login runs, so this route is crawlable index bloat — it is the
  // in-app player, not a landing page (SEO audit 2026-09-05).
  const noIndex = (
    <Head>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
  );

  const isDataReady = router.isReady && !!plan;

  if (!isDataReady) {
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
        plan={plan!}
        onClose={() => {
          if (moduleId) {
            router.push({ pathname: "/journey", query: { module: moduleId, ...(stepId ? { step: stepId } : {}) } });
          } else if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
          } else {
            router.push("/timer/plans");
          }
        }}
        onFinish={() => {
          setIsFinishing(true);
          router.push("/report");
        }}
        isFinishing={isFinishing}
        examMode={isExamMode}
        examBpm={examBpm}
        onExamComplete={isExamMode ? handleExamComplete : undefined}
        skipExitDialog={!!moduleId}
      />
    </>
  );
}
