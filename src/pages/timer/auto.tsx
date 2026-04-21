import { HeroBanner } from "components/UI/HeroBanner";
import MainContainer from "components/MainContainer";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { AutoPlanGenerator } from "feature/practice/views/AutoPlanGenerator/AutoPlanGenerator";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import AppLayout from "layouts/AppLayout";
import posthog from "posthog-js";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect,useState } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const TimerAuto: NextPageWithLayout = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlan | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    posthog.capture("auto_timer_viewed");
  }, []);

  const handleBack = () => {
    if (selectedPlan) {
      setSelectedPlan(null);
    } else {
      router.push("/timer");
    }
  };

  const handleAutoPlanSelect = (plan: ExercisePlan) => {
    posthog.capture("auto_plan_selected", { plan_id: plan.id });
    setIsStarting(true);
    setTimeout(() => {
      setSelectedPlan(plan);
      setIsStarting(false);
    }, 500);
  };

  const handlePlanFinish = () => {
    setIsFinishing(true);
    router.push("/report");
  };

  return (
    <PremiumGate feature="timer-auto" requiredPlan="master">
      {selectedPlan ? (
        <MainContainer>
          <PracticeSession onClose={handleBack} plan={selectedPlan} onFinish={handlePlanFinish} isFinishing={isFinishing} />
        </MainContainer>
      ) : (
        <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
          <HeroBanner
            title="Exercises"
            subtitle="Build your skills with focused practice exercises"
            eyebrow="Exercise Hub"
            className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
            rightContent={
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5"
              >
                Back
              </button>
            }
          />
          <AutoPlanGenerator
            onBack={handleBack}
            onSelectPlan={handleAutoPlanSelect}
            isStarting={isStarting}
          />
        </div>
      )}
    </PremiumGate>
  );
};

TimerAuto.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default TimerAuto;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises",'rating_popup'],
});
  