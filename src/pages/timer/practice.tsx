import { selectTimerData, selectUserAvatar, updateTimerTime } from "feature/user/store/userSlice";
import { updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import useTimer from "hooks/useTimer";
import AppLayout from "layouts/AppLayout";
import TimerLayout from "layouts/TimerLayout/TimerLayout";
import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "store/hooks";
import { withAuth } from "utils/auth/serverAuth";
import { convertMsToHMObject } from "utils/converter/timeConverter";
import { useEffect } from "react";

import type { SkillsType } from "types/skillsTypes";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const TimerPractice: NextPageWithLayout = () => {
  const dispatch = useAppDispatch();
  const [chosenSkill, setChosenSkill] = useState<SkillsType | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const timer = useTimer();
  const timerData = useAppSelector(selectTimerData);
  const avatar = useAppSelector(selectUserAvatar);
  const router = useRouter();

  const choseSkillHandler = (newSkill: SkillsType) => {
    if (chosenSkill) {
      timer.stopTimer();
      dispatch(updateTimerTime({ type: chosenSkill, time: timer.time }));
    }
    setChosenSkill(newSkill);
    timer.setInitialStartTime(timerData[newSkill]);
  };

  const onBack = () => {
    router.push("/timer");
  };

  useEffect(() => {
    if (!timer.timerEnabled || !chosenSkill) return;

    if (timer.time === 0 && timerData[chosenSkill] > 0) return;

    dispatch(updateTimerTime({
      type: chosenSkill,
      time: timer.time,
    }));
  }, [timer.time, chosenSkill, dispatch, timer.timerEnabled, timerData]);

  const timerSubmitHandler = useCallback(() => {
    timer.stopTimer();
    if (chosenSkill) {
      dispatch(updateTimerTime({
        type: chosenSkill,
        time: timer.time,
      }));
    }
    router.push("/report");
  }, [timer, chosenSkill, dispatch, router]);

  return (
    <TimerLayout
      timer={timer}
      timerData={timerData}
      chosenSkill={chosenSkill}
      timerSubmitHandler={timerSubmitHandler}
      choseSkillHandler={choseSkillHandler}
      onBack={onBack}
      isFinishing={isFinishing}
    />
  );
};

TimerPractice.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default TimerPractice;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises"],
});
