import { AutoPlanGenerator } from "feature/practice/views/AutoPlanGenerator/AutoPlanGenerator";
import { NextPage } from "next";
import { useRouter } from "next/router";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";
import { useState } from "react";
import { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import MainContainer from "components/MainContainer";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";

const TimerAuto: NextPage = () => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlan | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleBack = () => {
    if (selectedPlan) {
      setSelectedPlan(null);
    } else {
      router.push("/timer");
    }
  };

  const handleAutoPlanSelect = (plan: ExercisePlan) => {
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
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {selectedPlan ? (
        <MainContainer>
          <PracticeSession plan={selectedPlan} onFinish={handlePlanFinish} isFinishing={isFinishing} />
        </MainContainer>
      ) : (
        <AutoPlanGenerator
          onBack={handleBack}
          onSelectPlan={handleAutoPlanSelect}
          isStarting={isStarting}
        />
      )}
    </AppLayout>
  );
};

export default TimerAuto;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises"],
});
