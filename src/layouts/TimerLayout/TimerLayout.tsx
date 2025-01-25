import { Button } from "assets/components/ui/button";
import BeginnerMsg from "components/BeginnerMsg";
import IconBox from "components/IconBox";
import MainContainer from "components/MainContainer";
import type { useTimerInterface } from "hooks/useTimer";
import BlinkingDot from "layouts/TimerLayout/components/BlinkingDot";
import { skillColors } from "layouts/TimerLayout/components/Stopwatch/Stopwatch";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MdAccessTime } from "react-icons/md";
import type { TimerInterface } from "types/api.types";
import type { SkillsType } from "types/skillsTypes";
import { calculatePercent, convertMsToHMS } from "utils/converter";

import CategoryBox from "./components/CategoryBox";
import Stopwatch from "./components/Stopwatch";

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
    <MainContainer title={"Ćwicz"}>
      <div className='mb-10 flex flex-col items-center justify-center '>
        <div className='flex w-auto flex-col  gap-5 p-5 radius-default md:flex-row '>
          <Stopwatch time={time} timerData={timerData} />
          <div className='flex  flex-col gap-5 p-4 font-openSans md:order-none  md:flex-col  md:text-2xl'>
            <div className='flex min-w-[200px] flex-col border border-second-400/60 bg-second-500 p-4 radius-default xs:text-base '>
              <span className='text-sm text-secondText'>
                {t("total_time")}{" "}
              </span>
              <div className='flex items-center'>
                <IconBox Icon={MdAccessTime} small />

                <span className=' m-1 font-sans text-2xl tracking-wider'>
                  {convertMsToHMS(sumTime)}
                </span>
              </div>
            </div>

            <div className='flex flex-col border border-second-400/60 bg-second-500 p-4 radius-default xs:text-base'>
              <span className='text-sm text-secondText'>
                {t("currently_exercising")}
              </span>
              <div className='flex items-center gap-1'>
                <BlinkingDot isActive={timerEnabled} />

                <span className='m-1 font-openSans  text-lg'>
                  {chosenSkill ? getSkillName(chosenSkill) : "Nie wybrano"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-5 flex w-full flex-row flex-wrap justify-evenly md:w-[570px] md:justify-center lg:w-full '>
          <CategoryBox
            title={t("technique")}
            time={timerData.technique}
            skillColor={skillColors.technique}
            timerEnabled={timerEnabled}
            onStart={() => {
              choseSkillHandler("technique");
              startTimer();
            }}
            onStop={stopTimer}
            percent={calculatePercent(timerData.technique, sumTime)}
            chosen={chosenSkill === "technique"}
          />

          <CategoryBox
            title={t("theory")}
            skillColor={skillColors.theory}
            time={timerData.theory}
            timerEnabled={timerEnabled}
            percent={calculatePercent(timerData.theory, sumTime)}
            chosen={chosenSkill === "theory"}
            onStart={() => {
              choseSkillHandler("theory");
              startTimer();
            }}
            onStop={stopTimer}
          />
          <CategoryBox
            title={t("hearing")}
            skillColor={skillColors.hearing}
            time={timerData.hearing}
            timerEnabled={timerEnabled}
            onStart={() => {
              choseSkillHandler("hearing");
              startTimer();
            }}
            onStop={stopTimer}
            percent={calculatePercent(timerData.hearing, sumTime)}
            chosen={chosenSkill === "hearing"}
          />
          <CategoryBox
            title={t("creativity")}
            skillColor={skillColors.creativity}
            time={timerData.creativity}
            timerEnabled={timerEnabled}
            onStart={() => {
              choseSkillHandler("creativity");
              startTimer();
            }}
            onStop={stopTimer}
            percent={calculatePercent(timerData.creativity, sumTime)}
            chosen={chosenSkill === "creativity"}
          />
        </div>
        {/* <ExercisePlan /> TODO */}
        <BeginnerMsg />
        <p className='m-5 p-4  text-center font-openSans text-xs sm:text-base'>
          {t("info_about_repot ")}{" "}
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
