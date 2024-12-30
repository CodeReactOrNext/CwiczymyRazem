import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button } from "components/UI";
import Metronom from "components/Metronom/";
import Stopwatch from "./components/Stopwatch";
import BeginnerMsg from "components/BeginnerMsg";
import CategoryBox from "./components/CategoryBox";

import { SkillsType } from "types/skillsTypes";
import { useTimerInterface } from "hooks/useTimer";
import { convertMsToHM, calculatePercent } from "utils/converter";
import { TimerInterface } from "types/api.types";
import ExercisePlan from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";
import MainContainer from "components/MainContainer";

interface TimerLayoutProps {
  timer: useTimerInterface;
  timerData: TimerInterface;
  chosenSkill: SkillsType | null;
  timerSubmitHandler: () => void;
  choseSkillHandler: (chosenSkill: SkillsType) => void;
}

const TimerLayout = ({
  timer,
  timerData,
  timerSubmitHandler,
  chosenSkill,
  choseSkillHandler,
}: TimerLayoutProps) => {
  const { t } = useTranslation("timer");
  const { time, startTimer, stopTimer, timerEnabled } = timer;

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

  const sumTime =
    timerData.creativity +
    timerData.hearing +
    timerData.theory +
    timerData.technique;

  return (
    <MainContainer title={t("title")}>
      <div className='mb-10 flex flex-col items-center justify-center '>
        <div className='flex w-full flex-row items-center gap-5 p-5 radius-default md:w-auto md:flex-col '>
          <div className='order-3 flex  flex-col gap-5  p-4 text-center font-openSans md:order-none  md:flex-row  md:text-2xl'>
            <p className='flex flex-col text-sm xs:text-base '>
              <span className='content-box'>{t("total_time")} </span>
              <span className='content-boxtext-tertiary m-1'>
                {convertMsToHM(sumTime)}
              </span>
            </p>
            <p className='flex flex-col text-sm xs:text-base'>
              <span className='content-box'> {t("currently_exercising")}</span>

              <span className='m-1 text-tertiary'>
                {chosenSkill ? getSkillName(chosenSkill) : "Nie wybrano"}
              </span>
            </p>
          </div>
          <Stopwatch
            time={time}
            timerEnabled={timerEnabled}
            startTimer={startTimer}
            stopTimer={stopTimer}
            isSkillChosen={!!chosenSkill}
          />
        </div>
        <div className='mt-5 flex w-full flex-row flex-wrap justify-evenly md:w-[570px] md:justify-center lg:w-full '>
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
        <ExercisePlan />
        <BeginnerMsg />
        <p className='p-4 text-center  font-openSans text-xs sm:text-base'>
          {t("info_about_repot ")}
          <Link href={"/report"} className='text-link'>
            {t("raport_link")}
          </Link>
        </p>
        <Button onClick={timerSubmitHandler}> {t("end_button")}</Button>
      </div>
    </MainContainer>
  );
};

export default TimerLayout;
