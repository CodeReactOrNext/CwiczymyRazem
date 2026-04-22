import { HeroBanner } from "components/UI/HeroBanner";
import { MyPlans } from "feature/exercisePlan/components/MyPlans";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { PremiumFeaturePreview } from "feature/premium/components/PremiumFeaturePreview";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { selectUserInfo } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { Clock, Zap, Settings, CheckCircle } from "lucide-react";

const MyPlansPage: NextPageWithLayout = () => {
  const router = useRouter();
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

  const handlePlanSelect = (plan: ExercisePlan) => {
    router.push(`/timer/plans?planId=${plan.id}`);
  };

  // Show premium preview for non-premium users
  if (!isPremium && userInfo !== null) {
    return (
      <PremiumFeaturePreview
        eyebrow="Practice Plans"
        title="My Plans"
        description="Create and customize your own practice routines. Build structured practice plans from scratch or use templates, then execute them in focused practice sessions with progress tracking."
        features={[
          {
            icon: <Clock className="h-5 w-5" />,
            label: "Custom Schedules",
            description: "Create practice routines with custom timing and structure",
          },
          {
            icon: <Settings className="h-5 w-5" />,
            label: "Plan Builder",
            description: "Drag-and-drop interface to build your perfect practice plan",
          },
          {
            icon: <CheckCircle className="h-5 w-5" />,
            label: "Execution Tracking",
            description: "Run your plans and track completion and progress",
          },
          {
            icon: <Zap className="h-5 w-5" />,
            label: "Custom Exercises",
            description: "Create your own exercises and add them to your practice plans",
          },
        ]}
        previewImagePath="/images/premium/my-plans.png"
        previewImageAlt="My Plans - Practice plan builder preview"
        availableIn="both"
      />
    );
  }

  return (
    <PremiumGate feature="plans">
      <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
        <HeroBanner
          title="My Plans"
          subtitle="Your custom practice routines"
          eyebrow="Practice Plans"
          className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px] mb-6"
          buttonText="Create Plan"
          onClick={() => router.push('/plans/create')}
        />
        <MyPlans onPlanSelect={handlePlanSelect} hideTabs={["routines", "playalongs"]} hideLayout hideSectionHeader />
      </div>
    </PremiumGate>
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
