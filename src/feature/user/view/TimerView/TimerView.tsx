import MainContainer from "components/MainContainer";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { PracticeModeSelector } from "feature/practice/components/PracticeModeSelector/PracticeModeSelector";
import { AutoPlanGenerator } from "feature/practice/views/AutoPlanGenerator/AutoPlanGenerator";
import { PlanSelector } from "feature/practice/views/PlanSelector/PlanSelector";
import { selectTimerData, updateTimerTime } from "feature/user/store/userSlice";
import useTimer from "hooks/useTimer";
import TimerLayout from "layouts/TimerLayout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { SkillsType } from "types/skillsTypes";
import { convertMsToHMS } from "utils/converter";

type PracticeMode = "timer" | "plan" | "auto" | null;

const TimerView = () => {
  const [mode, setMode] = useState<PracticeMode>(null);
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlan | null>(null);
  const [chosenSkill, setChosenSkill] = useState<SkillsType | null>(null);
  const timer = useTimer();
  const dispatch = useAppDispatch();
  const timerData = useAppSelector(selectTimerData);
  const { t } = useTranslation("timer");
  const router = useRouter();

  const handleModeSelect = (selectedMode: PracticeMode) => {
    setMode(selectedMode);
  };

  const handleBack = () => {
    setMode(null);
    setSelectedPlan(null);
  };

  const handlePlanSelect = (planId: string) => {
    const plan = defaultPlans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
    }
  };

  const handleAutoPlanSelect = (plan: ExercisePlan) => {
    setSelectedPlan(plan);
  };

  const handlePlanFinish = () => {
    setSelectedPlan(null);
    setMode(null);
    router.push("/report");
  };

  const timerSubmitHandler = () => {
    if (chosenSkill) {
      const payload = {
        type: chosenSkill,
        time: timer.time,
      };
      dispatch(updateTimerTime(payload));
    }
    router.push("/report");
  };

  const choseSkillHandler = (chosenSkill: SkillsType) => {
    timer.stopTimer();
    setChosenSkill(chosenSkill);
    timer.restartTime();
    timer.setInitialStartTime(timerData[chosenSkill]);
  };

  useEffect(() => {
    if (!timer.timerEnabled || !chosenSkill) return;
    const payload = {
      type: chosenSkill,
      time: timer.time,
    };
    dispatch(updateTimerTime(payload));
  }, [timer.time, chosenSkill, dispatch, timer.timerEnabled]);

  useEffect(() => {
    if (timer.timerEnabled && chosenSkill) {
      document.title = `${convertMsToHMS(timer.time)} - ${t(chosenSkill)}`;
    } else {
      document.title = "Timer - Riff Quest";
    }

    return () => {
      document.title = "Riff Quest";
    };
  }, [timer.time, timer.timerEnabled, chosenSkill, t]);

  const renderContent = () => {
    if (selectedPlan) {
      return (
        <MainContainer>
          <PracticeSession plan={selectedPlan} onFinish={handlePlanFinish} />
        </MainContainer>
      );
    }

    switch (mode) {
      case "timer":
        return (
          <TimerLayout
            timerData={timerData}
            timerSubmitHandler={timerSubmitHandler}
            choseSkillHandler={choseSkillHandler}
            chosenSkill={chosenSkill}
            timer={timer}
            onBack={handleBack}
          />
        );
      case "plan":
        return (
          <PlanSelector onBack={handleBack} onSelectPlan={handlePlanSelect} />
        );
      case "auto":
        return (
            <AutoPlanGenerator
              onBack={handleBack}
              onSelectPlan={handleAutoPlanSelect}
            />
        );
      default:
        return <PracticeModeSelector onSelectMode={handleModeSelect} />;
    }
  };

  return renderContent();
};

export default TimerView;
