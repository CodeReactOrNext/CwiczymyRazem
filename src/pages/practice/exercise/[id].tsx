import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

export default function PracticeExercisePage() {
  const { t } = useTranslation("exercises");
  const router = useRouter();
  const { id } = router.query;
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const userAuth = useAppSelector(selectUserAuth);

  useEffect(() => {
    if (!id) return;

    const exerciseId = (id as string).replace(/-/g, "_");
    const exercise = exercisesAgregat.find(ex => ex.id === exerciseId);

    if (exercise) {
      // Create a dummy plan for this single exercise
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
       router.push("/exercises");
    }

  }, [id, userAuth, router]);

  if (!plan) {
    return (
      <div className='flex h-[400px] items-center justify-center'>
        <div className='text-center'>
          <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-primary' />
          <p className='mt-4 text-muted-foreground'>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const [isFinishing, setIsFinishing] = useState(false);

  return (
    <PracticeSession 
      plan={plan} 
      onClose={() => router.push(`/exercises/${id}`)}
      onFinish={() => {
        setIsFinishing(true);
        router.push("/report");
      }} 
      isFinishing={isFinishing}
    />
  );
}
