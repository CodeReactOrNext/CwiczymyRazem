import { generateScaleExercise } from "feature/exercisePlan/scales/scaleExerciseGenerator";
import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";
import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { withAuth } from "utils/auth/serverAuth";

export default function PracticeScalePage() {
  const router = useRouter();
  const { type, pos, pattern } = router.query;
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);

  useEffect(() => {
    if (!router.isReady || !type || !pos) return;

    const scaleType = type as ScaleType;
    const position = parseInt(pos as string, 10);
    const patternType = (pattern as PatternType | undefined) ?? "ascending";

    if (isNaN(position)) {
      router.replace("/scale-tree");
      return;
    }

    const exercise = generateScaleExercise({
      rootNote: "C",
      scaleType,
      patternType,
      position,
    });

    const exercisePlan: ExercisePlan = {
      id: `scale-plan-${exercise.id}`,
      title: exercise.title,
      description: exercise.description,
      category: exercise.category,
      difficulty: exercise.difficulty,
      exercises: [exercise],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userAuth ?? "anonymous",
      image: null,
    };

    setPlan(exercisePlan);
  }, [router.isReady, type, pos, pattern, userAuth, router]);

  const isDataReady = router.isReady && !!plan;

  if (!sessionReady) {
    return (
      <PracticeLoadingScreen
        isReady={isDataReady}
        onDone={() => setSessionReady(true)}
      />
    );
  }

  return (
    <PracticeSession
      plan={plan!}
      onClose={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/scale-tree");
        }
      }}
      onFinish={() => {
        setIsFinishing(true);
        router.push("/scale-tree");
      }}
      isFinishing={isFinishing}
    />
  );
}

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises", "rating_popup"],
});
