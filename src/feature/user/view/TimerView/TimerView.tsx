import { selectTimerData, updateTimerTime } from "feature/user/store/userSlice";
import useTimer from "hooks/useTimer";
import TimerLayout from "layouts/TimerLayout";
import Router from "next/router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { SkillsType } from "types/skillsTypes";
import { useTranslation } from "react-i18next";
import { convertMsToHMS } from "utils/converter";

const TimerView = () => {
  const [chosenSkill, setChosenSkill] = useState<SkillsType | null>(null);
  const timer = useTimer();
  const dispatch = useAppDispatch();
  const timerData = useAppSelector(selectTimerData);
  const { t } = useTranslation("timer");

  const timerSubmitHandler = () => {
    if (chosenSkill) {
      const payload = {
        type: chosenSkill,
        time: timer.time,
      };
      dispatch(updateTimerTime(payload));
    }
    Router.push("/report");
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
      document.title = "Timer - Ćwiczymy Razem";
    }

    return () => {
      document.title = "Ćwiczymy Razem";
    };
  }, [timer.time, timer.timerEnabled, chosenSkill, t]);

  return (
    <TimerLayout
      timerData={timerData}
      timerSubmitHandler={timerSubmitHandler}
      choseSkillHandler={choseSkillHandler}
      chosenSkill={chosenSkill}
      timer={timer}
    />
  );
};

export default TimerView;
