import { useState, useEffect } from "react";
import Router from "next/router";

import TimerLayout from "layouts/TimerLayout";

import useTimer from "hooks/useTimer";
import { SkillsType } from "types/skillsTypes";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { selectTimerData, updateTimerTime } from "feature/user/store/userSlice";

const TimerView = () => {
  const [chosenSkill, setChosenSkill] = useState<SkillsType | null>(null);
  const timer = useTimer();
  const dispatch = useAppDispatch();
  const timerData = useAppSelector(selectTimerData);

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
