import { AutoPlanGenerator } from "feature/practice/views/AutoPlanGenerator/AutoPlanGenerator";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout/PageLoadingLayout";
import { NextPage } from "next";
import { useRouter } from "next/router";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper/AuthLayoutWrapper";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useState } from "react";
import { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import MainContainer from "components/MainContainer";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";

const TimerAuto: NextPage = () => {
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

  const handleAutoPlanSelect = (plan: ExercisePlan) => {
    setSelectedPlan(plan);
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
        <AutoPlanGenerator
          onBack={handleBack}
          onSelectPlan={handleAutoPlanSelect}
        />
      )}
    </AuthLayoutWrapper>
  );
};

export default TimerAuto;

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
