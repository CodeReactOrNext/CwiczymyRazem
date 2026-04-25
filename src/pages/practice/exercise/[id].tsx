import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { accuracyToStars, firebaseCompleteJourneyStepWithStars } from "feature/journey/services/journey.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

export default function PracticeExercisePage() {
  const router = useRouter();
  const { id, mode, bpm, stepId, moduleId } = router.query;
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);

  const isExamMode = mode === "exam";
  const examBpm = bpm ? parseInt(bpm as string, 10) : undefined;

  useEffect(() => {
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
        userId: userAuth || "anonymous",
        image: (exercise.imageUrl || "") as any,
      };
      setPlan(dummyPlan);
    } else {
      router.push("/practice/plans");
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
    }
    router.push({ pathname: "/journey", query: { module: moduleId, step: stepId, examResult: stars ?? "fail", accuracy: Math.round(accuracy * 100) } });
  };

  const isDataReady = router.isReady && !!plan;

  if (!sessionReady) {
    return <PracticeLoadingScreen isReady={isDataReady} onDone={() => setSessionReady(true)} />;
  }

  return (
    <PracticeSession
      plan={plan!}
      onClose={() => {
        if (moduleId) {
          router.push({ pathname: "/journey", query: { module: moduleId, ...(stepId ? { step: stepId } : {}) } });
        } else if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/practice/plans");
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
  );
}
