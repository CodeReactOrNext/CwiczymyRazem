import { HeroBanner } from "components/UI/HeroBanner";
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
import { useAppSelector } from "store/hooks";
import { toast } from "sonner";
import type { NextPageWithLayout } from "types/page";

const CreatePlanPage: NextPageWithLayout = () => {
  const { t } = useTranslation(["exercises", "common"]);
  const router = useRouter();
  const userAuth = useAppSelector(selectUserAuth);

  const handleCreatePlan = async (
    title: string,
    description: string,
    exercises: Exercise[]
  ): Promise<void> => {
    try {
      if (!userAuth) return;

      await createExercisePlan(userAuth, {
        title,
        description,
        category: determinePlanCategory(exercises),
        difficulty: determinePlanDifficulty(exercises),
        exercises,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      });

      toast.success(t("exercises:my_plans.create_success") as string);
      router.push("/plans");
    } catch (error) {
      logger.error(error, { context: "CreatePlanPage.handleCreatePlan" });
      toast.error(t("exercises:my_plans.create_error") as string);
    }
  };

  return (
    <PremiumGate feature="plans">
      <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
        <HeroBanner
          title="Create Plan"
          subtitle="Build your custom practice routine"
          eyebrow="Practice Plans"
          className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px] mb-6"
        />
        <div className="container mx-auto px-4 lg:px-8 pb-12">
          <CreatePlan onSubmit={handleCreatePlan} />
        </div>
      </div>
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
