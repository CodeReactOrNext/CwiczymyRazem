import { MyPlans } from "feature/exercisePlan/components/MyPlans";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const MyPlansPage: NextPageWithLayout = () => {
  const router = useRouter();

  const handlePlanSelect = (plan: ExercisePlan) => {
    router.push(`/timer/plans?planId=${plan.id}`);
  };

  return <MyPlans onPlanSelect={handlePlanSelect} hideTabs={["routines", "playalongs"]} />;
};

MyPlansPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="my-plans" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default MyPlansPage;
