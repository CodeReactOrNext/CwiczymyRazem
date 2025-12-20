import MainContainer from "components/MainContainer";
import { selectTimerData, updateTimerTime } from "feature/user/store/userSlice";
import useTimer from "hooks/useTimer";
import TimerLayout from "layouts/TimerLayout";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SkillsType } from "types/skillsTypes";
import { convertMsToHMS } from "utils/converter";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";

const TimerPractice: NextPage = () => {

  const timer = useTimer();
  const dispatch = useAppDispatch();
  const timerData = useAppSelector(selectTimerData);
  const { t } = useTranslation("timer");
  const router = useRouter();
  const [chosenSkill, setChosenSkill] = useState<SkillsType | null>(null);

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

  const handleBack = () => {
    router.push("/timer");
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

  return (
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      <TimerLayout
        timerData={timerData}
        timerSubmitHandler={timerSubmitHandler}
        choseSkillHandler={choseSkillHandler}
        chosenSkill={chosenSkill}
        timer={timer}
        onBack={handleBack}
      />
    </AppLayout>
  );
};

export default TimerPractice;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises"],
});
