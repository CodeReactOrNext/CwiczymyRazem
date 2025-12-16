import { PlanSelector } from "feature/practice/views/PlanSelector/PlanSelector";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout/PageLoadingLayout";
import { NextPage } from "next";
import { useRouter } from "next/router";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper/AuthLayoutWrapper";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { useState } from "react";
import MainContainer from "components/MainContainer";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";

const TimerPlans: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlan | null>(null);

  const handleBack = () => {
    if (selectedPlan) {
      setSelectedPlan(null);
    } else {
      router.push("/timer");
    }
  };

  const handlePlanSelect = (planId: string) => {
    const plan = defaultPlans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
    }
  };

  const handlePlanFinish = () => {
    setSelectedPlan(null);
    router.push("/report");
  };

  return (
    <AuthLayoutWrapper pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {!isLoggedIn ? (
        <PageLoadingLayout />
      ) : selectedPlan ? (
        <MainContainer>
          <PracticeSession plan={selectedPlan} onFinish={handlePlanFinish} />
        </MainContainer>
      ) : (
        <PlanSelector onBack={handleBack} onSelectPlan={handlePlanSelect} />
      )}
    </AuthLayoutWrapper>
  );
};

export default TimerPlans;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "timer",
        "toast",
        "exercises",
      ])),
    },
  };
}
