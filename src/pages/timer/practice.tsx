import { HeroBanner } from "components/UI/HeroBanner";
import { selectTimerData, updateLocalTimer, updateTimerTime } from "feature/user/store/userSlice";
import useTimer from "hooks/useTimer";
import AppLayout from "layouts/AppLayout";
import TimerLayout from "layouts/TimerLayout/TimerLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useCallback,useRef,useState } from "react";
import { useEffect } from "react";
import { useAppDispatch,useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import type { SkillsType } from "types/skillsTypes";
import { withAuth } from "utils/auth/serverAuth";

const TimerPractice: NextPageWithLayout = () => {
  const dispatch = useAppDispatch();
  const [chosenSkill, setChosenSkill] = useState<SkillsType | null>(null);
  // Synchronicznie aktualny skill — subskrybent timera musi go czytać z refa,
  // bo `notify()` jest wołane zanim React przerenderuje i przepnie subskrypcję.
  const chosenSkillRef = useRef<SkillsType | null>(null);
  const [isFinishing] = useState(false);
  
  const timer = useTimer();
  const timerData = useAppSelector(selectTimerData);
  const router = useRouter();

  const choseSkillHandler = (newSkill: SkillsType) => {
    if (chosenSkillRef.current) {
      timer.stopTimer();
      dispatch(
        updateTimerTime({ type: chosenSkillRef.current, time: timer.getTime() })
      );
    }
    // Ustawiamy ref PRZED seedem, żeby notify() z setInitialStartTime trafił
    // na nowy skill, a nie na poprzedni.
    chosenSkillRef.current = newSkill;
    setChosenSkill(newSkill);
    timer.setInitialStartTime(timerData[newSkill]);
  };

  const onBack = () => {
    router.push("/timer");
  };

  useEffect(() => {
    if (!timer.timerEnabled || !chosenSkill) return;

    return timer.subscribe((time) => {
      const activeSkill = chosenSkillRef.current;
      if (!activeSkill) return;
      if (time === 0 && timerData[activeSkill] > 0) return;
      dispatch(updateTimerTime({ type: activeSkill, time }));
    });
  }, [chosenSkill, dispatch, timer.timerEnabled, timer, timerData]);

  const timerSubmitHandler = useCallback(() => {
    timer.stopTimer();
    if (chosenSkill) {
      dispatch(updateTimerTime({
        type: chosenSkill,
        time: timer.getTime(),
      }));
    }
    router.push("/report?applyTimer=true");
  }, [timer, chosenSkill, dispatch, router]);

  const resetTimerHandler = useCallback(() => {
    timer.restartTime();
    chosenSkillRef.current = null;
    setChosenSkill(null);
    dispatch(updateLocalTimer({ creativity: 0, hearing: 0, technique: 0, theory: 0 }));
  }, [timer, dispatch]);

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen ">
      <HeroBanner
        title="Exercises"
        subtitle="Build your skills with focused practice exercises"
        eyebrow="Exercise Hub"
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
        rightContent={
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5"
          >
            Back
          </button>
        }
      />
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
    </div>
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
