import MainContainer from "components/MainContainer";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { PracticeModeSelector } from "feature/practice/components/PracticeModeSelector/PracticeModeSelector";
import { AutoPlanGenerator } from "feature/practice/views/AutoPlanGenerator/AutoPlanGenerator";
import { PlanSelector } from "feature/practice/views/PlanSelector/PlanSelector";
import { selectTimerData, updateTimerTime } from "feature/user/store/userSlice";
import useTimer from "hooks/useTimer";
import { useTranslation } from "hooks/useTranslation";
import TimerLayout from "layouts/TimerLayout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { SkillsType } from "types/skillsTypes";
import { convertMsToHMS } from "utils/converter";

type PracticeMode = "timer" | "plan" | "auto" | "song" | "challenges" | null;

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
    if (selectedMode === "challenges") {
      router.push("/timer/challenges");
      return;
    }
    if (selectedMode === "song") {
      router.push("/timer/song-select");
      return;
    }
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
    timer.stopTimer();
    if (chosenSkill) {
      const payload = {
        type: chosenSkill,
        time: timer.time,
      };
      dispatch(updateTimerTime(payload));
    }
    router.push("/report");
  };

  const choseSkillHandler = (newSkill: SkillsType) => {
    if (chosenSkill) {
      timer.stopTimer();
      dispatch(updateTimerTime({ type: chosenSkill, time: timer.time }));
    }
    setChosenSkill(newSkill);
    timer.setInitialStartTime(timerData[newSkill]);
  };

  useEffect(() => {
    if (!timer.timerEnabled || !chosenSkill) return;

    // Safety check: if time is 0 but Redux has time, we might be in a transition state
    if (timer.time === 0 && timerData[chosenSkill] > 0) return;

    const payload = {
      type: chosenSkill,
      time: timer.time,
    };
    dispatch(updateTimerTime(payload));
  }, [timer.time, chosenSkill, dispatch, timer.timerEnabled, timerData]);

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
