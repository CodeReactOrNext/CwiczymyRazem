import type { PatternType } from "feature/exercisePlan/scales/patternGenerators";
import type { ScaleType } from "feature/exercisePlan/scales/scaleDefinitions";
import { generateScaleExercise, generateSingleStringScaleExercise } from "feature/exercisePlan/scales/scaleExerciseGenerator";
import { toggleBpmStage } from "feature/exercisePlan/services/bpmProgressService";
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
  const { type, pos, pattern, string: stringParam, exam, requiredBpm, nodeId } = router.query;
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);

  const examMode = exam === 'true' && requiredBpm && nodeId
    ? { requiredBpm: Number(requiredBpm), nodeId: String(nodeId) }
    : undefined;

  useEffect(() => {
    if (!router.isReady || !type) return;

    const scaleType = type as ScaleType;

    // Single-string mode: ?type=minor_pentatonic&string=3
    if (stringParam) {
      const stringNum = parseInt(stringParam as string, 10);
      if (isNaN(stringNum) || stringNum < 1 || stringNum > 6) {
        router.replace("/scale-tree");
        return;
      }
      const exercise = generateSingleStringScaleExercise({ rootNote: "C", scaleType, stringNum });
      if (exam === 'true') {
        exercise.timeInMinutes = 3;
      }
      setPlan({
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
      });
      return;
    }

    // Box-position mode: ?type=...&pos=...&pattern=...
    if (!pos) return;
    const position = parseInt(pos as string, 10);
    const patternType = (pattern as PatternType | undefined) ?? "ascending";

    if (isNaN(position)) {
      router.replace("/scale-tree");
      return;
    }

    const exercise = generateScaleExercise({ rootNote: "C", scaleType, patternType, position });
    if (exam === 'true') {
      exercise.timeInMinutes = 3;
    }
    setPlan({
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
    });
  }, [router.isReady, type, pos, pattern, stringParam, userAuth, router]);

  const isDataReady = router.isReady && !!plan;

  const handleExamComplete = async (accuracy: number) => {
    if (!userAuth || !requiredBpm || !plan?.exercises[0]) {
      setIsFinishing(true);
      router.push(backUrl);
      return;
    }
    const exercise = plan.exercises[0];
    try {
      await toggleBpmStage(
        userAuth,
        exercise.id,
        Number(requiredBpm),
        exercise.title,
        'theory'
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsFinishing(true);
      router.push(backUrl);
    }
  };

  const backUrl = nodeId ? `/scale-tree?fromExam=true&nodeId=${nodeId}` : "/scale-tree?fromExam=true";

  if (!isDataReady) {
    return <PracticeLoadingScreen isReady={false} />;
  }

  return (
    <PracticeSession
      plan={plan!}
      examMode={examMode}
      onClose={() => router.push(backUrl)}
      onFinish={() => {
        setIsFinishing(true);
        router.push(backUrl);
      }}
      onExamComplete={handleExamComplete}
      isFinishing={isFinishing}
      skipExitDialog={true}
    />
  );
}

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises", "rating_popup"],
});
