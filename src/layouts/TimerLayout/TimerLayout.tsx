import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import BeginnerMsg from "components/BeginnerMsg";
import IconBox from "components/IconBox";
import MainContainer from "components/MainContainer";
import type { useTimerInterface } from "hooks/useTimer";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MdAccessTime } from "react-icons/md";
import type { TimerInterface } from "types/api.types";
import type { SkillsType } from "types/skillsTypes";
import { calculatePercent, convertMsToHMS } from "utils/converter";

import BlinkingDot from "./components/BlinkingDot";
import CategoryBox from "./components/CategoryBox";
import Stopwatch from "./components/Stopwatch";
import { skillColors } from "./components/Stopwatch/Stopwatch";

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

  const skillsData = [
    {
      id: "technique" as SkillsType,
      title: t("technique"),
      time: timerData.technique,
      color: skillColors.technique,
      percent: calculatePercent(timerData.technique, sumTime),
    },
    {
      id: "theory" as SkillsType,
      title: t("theory"),
      time: timerData.theory,
      color: skillColors.theory,
      percent: calculatePercent(timerData.theory, sumTime),
    },
    {
      id: "hearing" as SkillsType,
      title: t("hearing"),
      time: timerData.hearing,
      color: skillColors.hearing,
      percent: calculatePercent(timerData.hearing, sumTime),
    },
    {
      id: "creativity" as SkillsType,
      title: t("creativity"),
      time: timerData.creativity,
      color: skillColors.creativity,
      percent: calculatePercent(timerData.creativity, sumTime),
    },
  ];

  return (
    <MainContainer title={"Ćwicz"}>
      <div className='h-full space-y-6 pb-8 font-openSans sm:space-y-8 sm:pb-12'>
        <Card className='rounded-none border-none bg-second-500/80 shadow-xl'>
          <div className='flex flex-col sm:flex-row'>
            <div className='flex justify-center p-4 pb-0 sm:flex-1 sm:py-6'>
              <Stopwatch
                time={time}
                timerData={timerData}
                activeSkill={chosenSkill}
              />
            </div>

            <div className='flex flex-row p-4 sm:flex-1 sm:flex-col sm:p-6'>
              <div className='flex-1 rounded-md bg-second-400/50 p-3 sm:mb-4 sm:p-4'>
                <span className='mb-3 hidden text-second-50 md:block'>
                  {t("currently_exercising")}
                </span>
                <div className='flex items-center gap-2'>
                  <BlinkingDot isActive={timerEnabled} />
                  <span className=' font-medium text-white sm:text-base'>
                    {chosenSkill ? getSkillName(chosenSkill) : "Nie wybrano"}
                  </span>
                </div>
              </div>

              <div className='ml-3 flex-1 rounded-md bg-second-400/50 p-3  sm:ml-0 sm:mt-4 sm:p-4'>
                <span className='mb-3 hidden  text-second-50 sm:text-sm md:block'>
                  {t("total_time")}
                </span>
                <div className='flex items-center'>
                  <IconBox Icon={MdAccessTime} small />
                  <span className='ml-1  text-base font-medium text-white sm:text-lg'>
                    {convertMsToHMS(sumTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className='px-3 sm:px-4'>
          <div className='grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6'>
            {skillsData.map((skill) => (
              <CategoryBox
                key={skill.id}
                title={skill.title}
                time={skill.time}
                skillColor={skill.color}
                timerEnabled={timerEnabled}
                onStart={() => {
                  choseSkillHandler(skill.id);
                  startTimer();
                }}
                onStop={stopTimer}
                percent={skill.percent}
                chosen={chosenSkill === skill.id}
              />
            ))}
          </div>
        </div>

        <div className='mx-auto mt-4 w-full max-w-3xl space-y-6 px-4 sm:mt-6 sm:space-y-8'>
          <BeginnerMsg />

          <div className='flex justify-center py-2'>
            <Button
              onClick={timerSubmitHandler}
              className='px-6 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-base'
              variant='default'
              size='lg'>
              {t("end_button")}
              <ArrowRight />
            </Button>
          </div>

          <p className='text-center text-xs text-muted-foreground sm:text-sm'>
            {t("info_about_repot ")}{" "}
            <Link href='/report' className='text-primary hover:underline'>
              {t("raport_link")}
            </Link>
          </p>
        </div>
      </div>
    </MainContainer>
  );
};

export default TimerLayout;
