import Button from "components/Button";
import { updateTimerTime } from "feature/user/store/userSlice";
import { SkillsType } from "feature/user/store/userSlice.types";
import { convertMsToHM } from "utils/converter/timeConverter";
import useTimer from "hooks/useTimer";
import { useState, useEffect } from "react";
import { useAppDispatch } from "store/hooks";
import CategoryBox from "./components/CategoryBox";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Router from "next/router";
import Stopwatch from "./components/Stopwatch";

interface TimerLayoutProps {
  timerData: {
    technique: number;
    theory: number;
    hearing: number;
    creativity: number;
  };
}

const TimerLayout = ({ timerData }: TimerLayoutProps) => {
  const {
    time,
    restartTime,
    startTimer,
    stopTimer,
    timerEnabled,
    setInitialStartTime,
  } = useTimer();
  const [chosenSkill, setChosenSkill] = useState<SkillsType>("technique");
  const { t } = useTranslation("timer");
  const dispatch = useAppDispatch();
  const sumTime =
    timerData.creativity +
    timerData.hearing +
    timerData.theory +
    timerData.technique;

  const calculatePercent = (time: number) => Math.floor((time / sumTime) * 100);
  const getSkillName = (chosenSkill: SkillsType) => {
    switch (chosenSkill) {
      case "creativity":
        return t("creativity");
      case "hearing":
        return t("hearing");
      case "technique":
        return t("technique");
      case "theory":
        return t("theory");
    }
  };

  const timerSubmitHandler = () => {
    const payload = {
      type: chosenSkill,
      time: time,
    };
    dispatch(updateTimerTime(payload));
    Router.push("/report");
  };

  useEffect(() => {
    if (!timerEnabled) return;
    const payload = {
      type: chosenSkill,
      time: time,
    };
    dispatch(updateTimerTime(payload));
  }, [time, chosenSkill, dispatch, timerEnabled]);

  return (
    <div className='flex flex-col items-center justify-center '>
      <Stopwatch
        time={time}
        timerEnabled={timerEnabled}
        startTimer={startTimer}
        stopTimer={stopTimer}
      />
      <div className='mb-2 flex flex-row gap-5 text-center text-2xl'>
        <div className='flex flex-row gap-1 '>
          <p>
            {t("total_time")}{" "}
            <span className='text-tertiary'>{convertMsToHM(sumTime)}</span>
          </p>
        </div>
        <div className='flex flex-row gap-1 '>
          <p>
            {t("currently_exercising")}
            <span className='m-1 text-tertiary'>
              {getSkillName(chosenSkill)}
            </span>
          </p>
        </div>
      </div>
      <p>
        {t("info_about_repot ")}
        <Link href={"/report"}>
          <a className='text-main-200'> {t("raport_link")}</a>
        </Link>
        .
      </p>
      <div className='mb-14  flex w-[330px] flex-row flex-wrap justify-center md:w-[570px] lg:w-full '>
        <CategoryBox
          title={t("technique")}
          time={timerData.technique}
          onClick={() => {
            setChosenSkill("technique");
            restartTime();
            setInitialStartTime(timerData.technique);
          }}
          percent={calculatePercent(timerData.technique)}
          chosen={chosenSkill === "technique"}
        />
        <CategoryBox
          title={t("theory")}
          time={timerData.theory}
          onClick={() => {
            setChosenSkill("theory");
            restartTime();
            setInitialStartTime(timerData.theory);
          }}
          percent={calculatePercent(timerData.theory)}
          chosen={chosenSkill === "theory"}
        />
        <CategoryBox
          title={t("hearing")}
          time={timerData.hearing}
          onClick={() => {
            setChosenSkill("hearing");
            restartTime();
            setInitialStartTime(timerData.hearing);
          }}
          percent={calculatePercent(timerData.hearing)}
          chosen={chosenSkill === "hearing"}
        />
        <CategoryBox
          title={t("creativity")}
          time={timerData.creativity}
          onClick={() => {
            setChosenSkill("creativity");
            restartTime();
            setInitialStartTime(timerData.creativity);
          }}
          percent={calculatePercent(timerData.creativity)}
          chosen={chosenSkill === "creativity"}
        />
      </div>
      <Button onClick={timerSubmitHandler}> {t("end_button")}</Button>
    </div>
  );
};

export default TimerLayout;
