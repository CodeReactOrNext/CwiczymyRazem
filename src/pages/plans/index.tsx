import { HeroBanner } from "components/UI/HeroBanner";
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

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      <HeroBanner
        title="My Plans"
        subtitle="Your custom practice routines"
        eyebrow="Practice Plans"
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px] mb-6"
        buttonText="Create Plan"
        onClick={() => router.push('/plans?view=create')}
      />
      <MyPlans onPlanSelect={handlePlanSelect} hideTabs={["routines", "playalongs"]} hideLayout hideSectionHeader />
    </div>
  );
};

MyPlansPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="my-plans" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default MyPlansPage;
