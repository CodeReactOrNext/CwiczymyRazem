import { selectTimerData, selectUserAvatar } from "feature/user/store/userSlice";
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

  const choseSkillHandler = (chosenSkill: SkillsType) => {
    setChosenSkill(chosenSkill);
  };

  const onBack = () => {
    router.push("/timer");
  };

  const timerSubmitHandler = useCallback(async () => {
    setIsFinishing(true);
    
    const techniqueTime = convertMsToHMObject(timerData.technique);
    const theoryTime = convertMsToHMObject(timerData.theory);
    const hearingTime = convertMsToHMObject(timerData.hearing);
    const creativityTime = convertMsToHMObject(timerData.creativity);

    const inputData: ReportFormikInterface = {
      techniqueHours: techniqueTime.hours,
      techniqueMinutes: techniqueTime.minutes,
      theoryHours: theoryTime.hours,
      theoryMinutes: theoryTime.minutes,
      hearingHours: hearingTime.hours,
      hearingMinutes: hearingTime.minutes,
      creativityHours: creativityTime.hours,
      creativityMinutes: creativityTime.minutes,
      habbits: [],
      countBackDays: 0,
      reportTitle: "Free Practice",
      avatarUrl: avatar ?? null,
    };

    try {
      await dispatch(updateUserStats({ inputData })).unwrap();
      router.push("/report");
    } catch (error) {
      console.error("Timer submit failed:", error);
    } finally {
      setIsFinishing(false);
    }
  }, [timerData, avatar, dispatch, router]);

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
