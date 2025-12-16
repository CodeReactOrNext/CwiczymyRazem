import MainContainer from "components/MainContainer";
import { selectTimerData, updateTimerTime } from "feature/user/store/userSlice";
import useTimer from "hooks/useTimer";
import useAutoLogIn from "hooks/useAutoLogIn";
import TimerLayout from "layouts/TimerLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout/PageLoadingLayout";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SkillsType } from "types/skillsTypes";
import { convertMsToHMS } from "utils/converter";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper/AuthLayoutWrapper";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const TimerPractice: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

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
      document.title = "Timer - Practice Together";
    }

    return () => {
      document.title = "Practice Together";
    };
  }, [timer.time, timer.timerEnabled, chosenSkill, t]);

  return (
    <AuthLayoutWrapper pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {!isLoggedIn ? (
        <PageLoadingLayout />
      ) : (
        <TimerLayout
          timerData={timerData}
          timerSubmitHandler={timerSubmitHandler}
          choseSkillHandler={choseSkillHandler}
          chosenSkill={chosenSkill}
          timer={timer}
          onBack={handleBack}
        />
      )}
    </AuthLayoutWrapper>
  );
};

export default TimerPractice;

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
