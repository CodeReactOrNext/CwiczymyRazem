import Link from "next/link";
import Router from "next/router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import Button from "components/Button";
import Stopwatch from "./components/Stopwatch";
import BeginnerMsg from "components/BeginnerMsg";
import CategoryBox from "./components/CategoryBox";

import useTimer from "hooks/useTimer";
import { useAppDispatch } from "store/hooks";
import { SkillsType } from "types/skillsTypes";
import { convertMsToHM } from "utils/converter/timeConverter";
import { updateTimerTime } from "feature/user/store/userSlice";
import { TimerInterface } from "feature/user/store/userSlice.types";
import { calculatePercent } from "utils/converter/calculatePercent";

interface TimerLayoutProps {
  timerData: TimerInterface;
}

const TimerLayout = ({ timerData }: TimerLayoutProps) => {
  const { t } = useTranslation("timer");

  const {
    time,
    restartTime,
    startTimer,
    stopTimer,
    timerEnabled,
    setInitialStartTime,
  } = useTimer();
  const [chosenSkill, setChosenSkill] = useState<SkillsType | null>(null);

  const dispatch = useAppDispatch();
  const sumTime =
    timerData.creativity +
    timerData.hearing +
    timerData.theory +
    timerData.technique;

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
    if (chosenSkill) {
      const payload = {
        type: chosenSkill,
        time: time,
      };
      dispatch(updateTimerTime(payload));
    }
    Router.push("/report");
  };

  const choseSkillHandler = (chosenSkill: SkillsType) => {
    stopTimer();
    setChosenSkill(chosenSkill);
    restartTime();
    setInitialStartTime(timerData[chosenSkill]);
  };

  useEffect(() => {
    if (!timerEnabled || !chosenSkill) return;
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
        isSkillChosen={!!chosenSkill}
      />
      <div className=' flex flex-row gap-5 p-4 text-center font-openSans md:text-2xl'>
        <div className='flex flex-row gap-1 '>
          <p className='flex flex-col text-sm xs:text-base'>
            {t("total_time")}{" "}
            <span className='text-tertiary'>{convertMsToHM(sumTime)}</span>
          </p>
        </div>
        <div className='flex flex-row gap-1 '>
          <p className='flex flex-col text-sm xs:text-base'>
            {t("currently_exercising")}
            <span className='m-1 text-tertiary'>
              {chosenSkill ? getSkillName(chosenSkill) : "Nie wybrano"}
            </span>
          </p>
        </div>
      </div>

      <div className='mb-14 flex w-[330px] flex-row flex-wrap justify-center md:w-[570px] lg:w-full '>
        <CategoryBox
          title={t("technique")}
          time={timerData.technique}
          onClick={() => {
            choseSkillHandler("technique");
          }}
          percent={calculatePercent(timerData.technique, sumTime)}
          chosen={chosenSkill === "technique"}
        />
        <CategoryBox
          title={t("theory")}
          time={timerData.theory}
          onClick={() => {
            choseSkillHandler("theory");
          }}
          percent={calculatePercent(timerData.theory, sumTime)}
          chosen={chosenSkill === "theory"}
        />
        <CategoryBox
          title={t("hearing")}
          time={timerData.hearing}
          onClick={() => {
            choseSkillHandler("hearing");
          }}
          percent={calculatePercent(timerData.hearing, sumTime)}
          chosen={chosenSkill === "hearing"}
        />
        <CategoryBox
          title={t("creativity")}
          time={timerData.creativity}
          onClick={() => {
            choseSkillHandler("creativity");
          }}
          percent={calculatePercent(timerData.creativity, sumTime)}
          chosen={chosenSkill === "creativity"}
        />
      </div>
      <BeginnerMsg />
      <p className='p-4 text-center font-openSans'>
        {t("info_about_repot ")}
        <Link href={"/report"}>
          <a className='text-link'> {t("raport_link")}</a>
        </Link>
      </p>
      <Button onClick={timerSubmitHandler}> {t("end_button")}</Button>
    </div>
  );
};

export default TimerLayout;
