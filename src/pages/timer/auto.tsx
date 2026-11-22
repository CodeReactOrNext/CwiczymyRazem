import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import MainContainer from "components/MainContainer";
import { PageShell } from "components/PageShell/PageShell";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { AutoPlanGenerator } from "feature/practice/views/AutoPlanGenerator/AutoPlanGenerator";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { useSessionEntryGate } from "feature/sessionEntry/useSessionEntryGate";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import type { ReactElement } from "react";
import { useEffect,useState } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const TimerAuto: NextPageWithLayout = () => {
  const router = useRouter();
  const { t } = useTranslation("practice_hub");
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

  const sessionOpen = useSessionEntryGate(!!selectedPlan);

  return (
    <PremiumGate feature="timer-auto" requiredPlan="master">
      {selectedPlan && sessionOpen ? (
        <MainContainer>
          <PracticeSession onClose={handleBack} plan={selectedPlan} onFinish={handlePlanFinish} isFinishing={isFinishing} />
        </MainContainer>
      ) : (
        <PageShell>
          <HeroBanner
            title={t("modes.auto.title")}
            subtitle={t("modes.auto.description")}
            eyebrowContent={
              <Breadcrumbs
                items={[
                  { label: t("title"), href: "/timer" },
                  { label: t("modes.auto.title") },
                ]}
              />
            }
            backgroundContent={<HeroPattern withShuffle />}
            compact
          />
          <AutoPlanGenerator
            onBack={handleBack}
            onSelectPlan={handleAutoPlanSelect}
            isStarting={isStarting}
          />
        </PageShell>
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

TimerAuto.getInitialProps = withAuthInitialProps();
  