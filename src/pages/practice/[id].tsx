import { getUserExercisePlan } from "feature/exercisePlan/services/getUserExercisePlan";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

export default function PracticePage() {
  const { t } = useTranslation("exercises");
  const router = useRouter();
  const { id } = router.query;
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
  const userAuth = useAppSelector(selectUserAuth);

  useEffect(() => {
    const loadPlan = async () => {
      if (!id || !userAuth) return;

      try {
        const loadedPlan = await getUserExercisePlan(userAuth, id as string);
        setPlan(loadedPlan);
      } catch (error) {
        console.error("Error loading plan:", error);
        toast.error(t("errors.load_plan_failed"));
        router.push("/exercises");
      }
    };

    loadPlan();
  }, [id, userAuth, router, t]);

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
      onClose={() => router.push("/exercises")}
      onFinish={() => {
        setIsFinishing(true);
        router.push("/report");
      }} 
      isFinishing={isFinishing}
    />
  );
}
