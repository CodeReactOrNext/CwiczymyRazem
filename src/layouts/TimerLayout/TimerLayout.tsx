import "react-circular-progressbar/dist/styles.css";

import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { BeginnerMsg } from "components/BeginnerMsg/BeginnerMsg";
import { IconBox } from "components/IconBox/IconBox";
import MainContainer from "components/MainContainer";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { AnimatePresence, motion } from "framer-motion";
import type { useTimerInterface } from "hooks/useTimer";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MdAccessTime } from "react-icons/md";
import { useAppSelector } from "store/hooks";
import type { TimerInterface } from "types/api.types";
import type { SkillsType } from "types/skillsTypes";
import { calculatePercent, convertMsToHMS } from "utils/converter";

import BlinkingDot from "./components/BlinkingDot";
import CategoryBox from "./components/CategoryBox";
import { skillColors } from "./components/Stopwatch/Stopwatch";

interface TimerLayoutProps {
  timer: useTimerInterface;
  timerData: TimerInterface;
  chosenSkill: SkillsType | null;
  timerSubmitHandler: () => void;
  choseSkillHandler: (chosenSkill: SkillsType) => void;
}

// Komponent łączący animowaną tarczę z pierścieniami umiejętności
const AnimatedTimerDisplay = ({
  value,
  text,
  isPlaying,
  size = "lg",
  activeSkill,
  timerData,
}: {
  value: number;
  text: string;
  isPlaying: boolean;
  size?: "sm" | "md" | "lg";
  activeSkill?: SkillsType | null;
  timerData: {
    creativity: number;
    hearing: number;
    technique: number;
    theory: number;
  };
}) => {
  const sizeClasses = {
    sm: "h-40 w-40",
    md: "h-52 w-52",
    lg: "h-64 w-64",
  };

  const getProgressColor = () => {
    if (activeSkill) {
      return skillColors[activeSkill];
    }

    if (value > 75) return "hsl(210, 90%, 60%)";
    if (value > 50) return "hsl(260, 90%, 60%)";
    if (value > 25) return "hsl(330, 90%, 60%)";
    return "hsl(0, 90%, 60%)";
  };

  const progressColor = getProgressColor();
  const glowColor = isPlaying ? progressColor : "hsl(var(--muted))";

  // Parametry dla pierścieni umiejętności
  const radius = 120;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const gap = 12;

  const getCircleOffset = (skillTime: number) => {
    const progress = (skillTime / (30 * 60 * 1000)) * 100;
    return circumference - (progress / 100) * circumference;
  };

  const getOpacity = (skill: string) => {
    if (!activeSkill) return 0.2;
    return skill === activeSkill ? 0.15 : 0.05;
  };

  const getStrokeOpacity = (skill: string) => {
    if (!activeSkill) return 0.7;
    return skill === activeSkill ? 1 : 0.2;
  };

  const getStrokeWidth = (skill: string) => {
    if (!activeSkill) return strokeWidth;
    return skill === activeSkill ? strokeWidth + 2 : strokeWidth - 2;
  };

  return (
    <div className='relative mb-6 h-64 w-64'>
      {/* Ciemne tło timera z kolorowym gradientem */}
      <div
        className='absolute inset-0 rounded-full bg-black/80'
        style={{
          background: activeSkill
            ? `radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)`
            : "black",
          boxShadow: activeSkill
            ? `0 0 40px 5px ${progressColor}30, inset 0 0 20px 0px ${progressColor}20`
            : "none",
        }}
      />

      {/* Efekt blasku pod tarczą */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[30px] transition-all duration-700",
          sizeClasses[size]
        )}
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity: isPlaying ? 0.15 : 0.05,
        }}
      />

      {/* Pierścienie umiejętności */}
      <svg
        className='absolute inset-0 -rotate-90 transform'
        width='100%'
        height='100%'
        viewBox='0 0 264 264'
        style={{ zIndex: 10 }}>
        {Object.keys(skillColors).map((skill, index) => {
          const color = skillColors[skill as keyof typeof skillColors];
          const r = radius - gap * index;
          const isActive = skill === activeSkill;

          const filterEffect =
            isActive && activeSkill ? `drop-shadow(0 0 5px ${color})` : "none";

          return (
            <g key={skill} style={{ filter: filterEffect }}>
              <circle
                cx='132'
                cy='132'
                r={r}
                stroke={color}
                strokeWidth={getStrokeWidth(skill)}
                fill='none'
                opacity={getOpacity(skill)}
                style={{
                  transition: "opacity 0.5s ease, stroke-width 0.5s ease",
                }}
              />
              <circle
                cx='132'
                cy='132'
                r={r}
                stroke={color}
                strokeWidth={getStrokeWidth(skill)}
                fill='none'
                strokeLinecap='round'
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: getCircleOffset(
                    timerData[skill as keyof typeof timerData]
                  ),
                  transition: "all 0.5s ease",
                  opacity: getStrokeOpacity(skill),
                  filter: isActive ? "brightness(1.3)" : "brightness(0.8)",
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Animowane elementy */}
      <div
        className={cn(
          "relative rounded-full backdrop-blur-sm",
          sizeClasses[size]
        )}>
        <AnimatePresence>
          {isPlaying && (
            <div className='absolute inset-0 z-20 overflow-hidden rounded-full'>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className='absolute h-1 w-1 rounded-full bg-white'
                  initial={{
                    x: "50%",
                    y: "50%",
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: `${50 + 45 * Math.cos(i * (Math.PI / 6))}%`,
                    y: `${50 + 45 * Math.sin(i * (Math.PI / 6))}%`,
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        <motion.div
          className='absolute inset-[-2px] z-0 rounded-full'
          style={{
            background: `conic-gradient(
              from ${isPlaying ? 0 : 180}deg, 
              transparent, 
              ${glowColor}, 
              transparent
            )`,
            opacity: 0.2,
          }}
          animate={{
            rotate: isPlaying ? 360 : 0,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Główny czas w środku */}
        <div className='absolute inset-0 z-20 flex flex-col items-center justify-center rounded-full text-white'>
          <div className='text-center'>
            <p
              className='font-sans text-6xl font-semibold tracking-wider'
              style={{
                textShadow: activeSkill
                  ? `0 0 10px ${progressColor}50`
                  : "none",
              }}>
              {text}
            </p>
          </div>
        </div>

        {isPlaying && (
          <motion.div
            className='absolute inset-0 z-10 rounded-full border-[3px]'
            style={{
              borderColor: progressColor,
              opacity: 0.5,
              boxShadow: `0 0 5px ${progressColor}, inset 0 0 5px ${progressColor}`,
            }}
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
    </div>
  );
};

const TimerLayout = ({
  timer,
  timerData,
  timerSubmitHandler,
  chosenSkill,
  choseSkillHandler,
}: TimerLayoutProps) => {
  const { t } = useTranslation("timer");
  const { time, startTimer, stopTimer, timerEnabled } = timer;
  const userStats = useAppSelector(selectCurrentUserStats);

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

  // Obliczamy czas w formacie mm:ss
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <MainContainer title={"Ćwicz"}>
      <div className='h-full space-y-6 pb-8 font-openSans sm:space-y-8 sm:pb-12 md:p-8'>
        <Card className='rounded-none border-none bg-second-500/80 shadow-xl'>
          <div className='flex flex-col sm:flex-row'>
            <div className='flex justify-center p-4 pb-0 sm:flex-1 sm:py-6'>
              <AnimatedTimerDisplay
                value={100 - (time / (30 * 60 * 1000)) * 100}
                text={formatTime(time)}
                isPlaying={timerEnabled}
                activeSkill={chosenSkill}
                timerData={timerData}
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
          {(!userStats || userStats.points > 0) && <BeginnerMsg />}

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
