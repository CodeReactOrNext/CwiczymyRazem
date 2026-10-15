import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { RotationTimerBanner } from "feature/rotation/components/RotationTimerBanner";
import { useCustomRotationItem } from "feature/rotation/hooks/useCustomRotationItem";
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
import { withAuthInitialProps } from "utils/auth/authInitialProps";

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
  // Opened for a custom Rotation item (`?rotation=<id>`): the item rides along
  // to the report, which stamps it as played, and "Continue" leads back to Rotation.
  const rotationId =
    typeof router.query.rotation === "string" ? router.query.rotation : null;
  const rotationItem = useCustomRotationItem(rotationId);

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
    const query = new URLSearchParams({ applyTimer: "true" });
    if (rotationItem) {
      query.set("rotation", rotationItem.id);
      query.set("planTitle", rotationItem.title ?? "");
      query.set("returnTo", "/rotation");
    }
    router.push(`/report?${query.toString()}`);
  }, [timer, chosenSkill, dispatch, router, rotationItem]);

  const resetTimerHandler = useCallback(() => {
    timer.restartTime();
    chosenSkillRef.current = null;
    setChosenSkill(null);
    dispatch(updateLocalTimer({ creativity: 0, hearing: 0, technique: 0, theory: 0 }));
  }, [timer, dispatch]);

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen ">
      <HeroBanner
        title="Free Timer"
        subtitle="Open stopwatch for any skill"
        eyebrowContent={
          <Breadcrumbs
            items={[
              { label: "Practice", href: "/timer" },
              { label: "Free Timer" },
            ]}
          />
        }
        backgroundContent={<HeroPattern variant="timer" />}
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
      />
      {rotationItem && <RotationTimerBanner item={rotationItem} />}
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

TimerPractice.getInitialProps = withAuthInitialProps();
