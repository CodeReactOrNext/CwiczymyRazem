import Link from "next/link";
import { useTranslation } from "react-i18next";

import Button from "components/UI/Button";
import Metronom from "components/Metronom/";
import Stopwatch from "./components/Stopwatch";
import BeginnerMsg from "components/BeginnerMsg";
import CategoryBox from "./components/CategoryBox";

import { SkillsType } from "types/skillsTypes";
import { useTimerInterface } from "hooks/useTimer";
import { convertMsToHM } from "utils/converter/timeConverter";
import { TimerInterface } from "feature/user/store/userSlice.types";
import { calculatePercent } from "utils/converter/calculatePercent";

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
    <div className='mb-10 flex flex-col items-center justify-center '>
      <div className='flex w-full flex-col items-center gap-5 border-main-opposed-200/70 bg-main-opposed-600/50 p-5 radius-default md:w-auto md:flex-row md:border-2'>
        <div className=' order-3 flex flex-row gap-5 p-4 text-center font-openSans md:order-none md:flex-col md:text-right  md:text-2xl'>
          <p className='flex flex-col text-sm xs:text-base'>
            {t("total_time")}{" "}
            <span className='text-tertiary'>{convertMsToHM(sumTime)}</span>
          </p>
          <p className='flex flex-col text-sm xs:text-base'>
            {t("currently_exercising")}
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
        <Metronom />
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
      <BeginnerMsg />
      <p className='p-4 text-center font-openSans text-xs sm:text-base'>
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
