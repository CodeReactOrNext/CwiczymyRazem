import { cn } from "assets/lib/utils";
import { PAGE_CONTENT, PageShell } from "components/PageShell/PageShell";
import { PageTitle } from "components/PageTitle/PageTitle";
import { CreatePlan } from "feature/exercisePlan/components/CreatePlanDialog/CreatePlan";
import { createExercisePlan } from "feature/exercisePlan/services/createExercisePlan";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { determinePlanCategory } from "feature/exercisePlan/utils/deteminePlanCategory";
import { determinePlanDifficulty } from "feature/exercisePlan/utils/determinePlanDifficulty";
import { logger } from "feature/logger/Logger";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";

const CreatePlanPage: NextPageWithLayout = () => {
  const { t } = useTranslation(["exercises", "common"]);
  const router = useRouter();
  const userAuth = useAppSelector(selectUserAuth);

  const handleCreatePlan = async (
    title: string,
    description: string,
    exercises: Exercise[],
    isPublic: boolean,
    appearance?: { icon?: string; color?: string }
  ): Promise<void> => {
    try {
      if (!userAuth) return;

      await createExercisePlan(userAuth, {
        title,
        description,
        isPublic,
        category: determinePlanCategory(exercises),
        difficulty: determinePlanDifficulty(exercises),
        exercises,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
        icon: appearance?.icon,
        color: appearance?.color,
      });

      // Bottom corner: top-right lands on the plans list's own "Create Plan" button.
      toast.success(t("exercises:my_plans.create_success") as string, {
        position: "bottom-right",
      });
      router.push("/plans");
    } catch (error) {
      logger.error(error, { context: "CreatePlanPage.handleCreatePlan" });
      toast.error(t("exercises:my_plans.create_error") as string);
    }
  };

  return (
    <PremiumGate feature="plans">
      <PageShell>
        <div className={cn(PAGE_CONTENT, "md:pt-10")}>
          <PageTitle title='Create plan' className='mb-5' />
          <CreatePlan onSubmit={handleCreatePlan} />
        </div>
      </PageShell>
    </PremiumGate>
  );
};

CreatePlanPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="my-plans" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default CreatePlanPage;
