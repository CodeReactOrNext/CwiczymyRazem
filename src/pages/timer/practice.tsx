import { selectTimerData, selectUserAvatar, updateLocalTimer, updateTimerTime } from "feature/user/store/userSlice";
import useTimer from "hooks/useTimer";
import AppLayout from "layouts/AppLayout";
import TimerLayout from "layouts/TimerLayout/TimerLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useCallback,useState } from "react";
import { useEffect } from "react";
import { useAppDispatch,useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import type { SkillsType } from "types/skillsTypes";
import { withAuth } from "utils/auth/serverAuth";

const TimerPractice: NextPageWithLayout = () => {
  const dispatch = useAppDispatch();
  const [chosenSkill, setChosenSkill] = useState<SkillsType | null>(null);
  const [isFinishing] = useState(false);
  
  const timer = useTimer();
  const timerData = useAppSelector(selectTimerData);
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
    router.push("/report?applyTimer=true");
  }, [timer, chosenSkill, dispatch, router]);

  const resetTimerHandler = useCallback(() => {
    timer.restartTime();
    setChosenSkill(null);
    dispatch(updateLocalTimer({ creativity: 0, hearing: 0, technique: 0, theory: 0 }));
  }, [timer, dispatch]);

  return (
    <TimerLayout
      timer={timer}
      timerData={timerData}
      chosenSkill={chosenSkill}
      timerSubmitHandler={timerSubmitHandler}
      choseSkillHandler={choseSkillHandler}
      onBack={onBack}
      onResetTimer={resetTimerHandler}
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
  translations: ["common", "timer", "toast", "exercises",'rating_popup'],
});
