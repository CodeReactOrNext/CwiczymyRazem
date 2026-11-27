import "react-circular-progressbar/dist/styles.css";

import { Accordion } from "assets/components/ui/accordion";
import { Button, PRESSABLE } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import MainContainer from "components/MainContainer";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { StateDot } from "feature/exercisePlan/views/PracticeSession/components/StateDot";
import { AmpSimButton } from "feature/toneStudio/components/AmpSimButton";
import type { useTimerInterface } from "hooks/useTimer";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { TimerInterface } from "types/api.types";
import type { SkillsType } from "types/skillsTypes";
import { calculatePercent, convertMsToHMS } from "utils/converter";

import CategoryBox from "./components/CategoryBox";
import FreeTimerIntervalAlert from "./components/FreeTimerIntervalAlert";
import FreeTimerMetronome from "./components/FreeTimerMetronome";
import SkillRow from "./components/SkillRow";
import { skillColors } from "./components/Stopwatch/Stopwatch";

interface TimerLayoutProps {
  timer: useTimerInterface;
  timerData: TimerInterface;
  chosenSkill: SkillsType | null;
  timerSubmitHandler: () => void;
  choseSkillHandler: (chosenSkill: SkillsType) => void;
  onBack: () => void;
  onResetTimer?: () => void;
  isFinishing?: boolean;
}

const RING_RADIUS = 120;
const RING_GAP = 12;
// A ring is full after half an hour on its skill.
const RING_FULL_MS = 30 * 60 * 1000;

type DialSkill = keyof typeof skillColors;

// The clock with one ring per skill. Flat on purpose: no glow or particles,
// the running skill is told apart by a thicker ring and the dimmed others.
const TimerDial = ({
  text,
  activeSkill,
  activeSkillName,
  timerData,
}: {
  text: string;
  activeSkill?: SkillsType | null;
  activeSkillName?: string;
  timerData: Record<DialSkill, number>;
}) => (
  // force-dark: the dial is a dark disc in either theme, and so is its text.
  <div className='force-dark relative h-48 w-48 lg:h-64 lg:w-64'>
    <svg
      className='absolute inset-0 -rotate-90'
      width='100%'
      height='100%'
      viewBox='0 0 264 264'>
      <circle cx='132' cy='132' r='131' fill='black' />
      {(Object.keys(skillColors) as DialSkill[]).map((skill, index) => {
        const color = skillColors[skill];
        const r = RING_RADIUS - RING_GAP * index;
        const circumference = 2 * Math.PI * r;
        const progress = Math.min(1, timerData[skill] / RING_FULL_MS);
        const isActive = skill === activeSkill;
        const width = !activeSkill ? 5 : isActive ? 7 : 4;

        return (
          <g key={skill}>
            <circle
              cx='132'
              cy='132'
              r={r}
              stroke={color}
              strokeWidth={width}
              fill='none'
              opacity={0.16}
            />
            {progress > 0 && (
              <circle
                cx='132'
                cy='132'
                r={r}
                stroke={color}
                strokeWidth={width}
                fill='none'
                strokeLinecap='round'
                opacity={!activeSkill || isActive ? 1 : 0.4}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference * (1 - progress),
                  transition: "stroke-dashoffset 0.5s ease, opacity 0.5s ease",
                }}
              />
            )}
          </g>
        );
      })}
    </svg>

    <div className='absolute inset-0 flex flex-col items-center justify-center gap-1 text-white'>
      <p
        translate='no'
        className='font-sans text-4xl font-semibold tabular-nums tracking-wider lg:text-5xl'>
        {text}
      </p>
      {/* Desktop names the skill right next to the dial; the phone has no
          such line, so the dial carries it. */}
      {activeSkillName && (
        <p translate='no' className='text-xs font-medium text-zinc-400 lg:hidden'>
          {activeSkillName}
        </p>
      )}
    </div>
  </div>
);

const TimerLayout = ({
  timer,
  timerData,
  timerSubmitHandler,
  chosenSkill,
  choseSkillHandler,
  onBack,
  onResetTimer,
  isFinishing
}: TimerLayoutProps) => {
  const { t } = useTranslation("timer");
  const { startTimer, stopTimer, timerEnabled } = timer;
  const [time, setTime] = useState(() => timer.getTime());
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  useEffect(() => {
    setTime(timer.getTime());
    return timer.subscribe((t) => setTime(t));
  }, [timer]);

  useEffect(() => {
    document.title = `${formatTime(time)} — Riff Quest`;
    return () => {
      document.title = "Riff Quest";
    };
  }, [time]);

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

  const startSkill = (skill: SkillsType) => {
    choseSkillHandler(skill);
    startTimer();
  };

  // Nothing tracked yet: finishing would only open an empty report, so the
  // main action becomes "back" and the manual log is offered on its own.
  const hasTrackedTime = sumTime > 0 || timerEnabled;

  return (
    <MainContainer noBorder>
      <div className={cn(" mx-auto h-full w-full max-w-6xl space-y-6 sm:space-y-8", PAGE_CONTENT)}>
        <Card size='sm'>
          <div className='flex flex-col gap-8 p-2 sm:p-4 lg:flex-row lg:items-center lg:gap-10'>
            <div className='flex shrink-0 justify-center'>
              <TimerDial
                text={formatTime(time)}
                activeSkill={chosenSkill}
                activeSkillName={chosenSkill ? getSkillName(chosenSkill) : undefined}
                timerData={timerData}
              />
            </div>

            <div className='grid min-w-0 flex-1 grid-cols-1 gap-6 lg:content-center lg:gap-10'>
              <div className='flex flex-col gap-4'>
                {chosenSkill ? (
                  // Desktop: pause sits where the start was a moment ago.
                  <div className='hidden flex-wrap items-end justify-between gap-x-8 gap-y-5 lg:flex'>
                    <div>
                      <p className='text-sm font-medium text-zinc-400'>
                        {t("currently_exercising")}
                      </p>
                      <div className='mt-1.5 flex items-center gap-2.5'>
                        <StateDot on={timerEnabled} className='h-2 w-2' />
                        <span translate="no" className='text-2xl font-bold text-white'>
                          {getSkillName(chosenSkill)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size='lg'
                      translate='no'
                      className='min-w-[140px]'
                      onClick={() => (timerEnabled ? stopTimer() : startTimer())}>
                      {timerEnabled ? (
                        <>
                          <Pause fill='currentColor' />
                          {t("pause")}
                        </>
                      ) : (
                        <>
                          <Play fill='currentColor' />
                          {t("start")}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className='text-lg font-semibold text-white'>
                    {t("choose_practising")}
                  </p>
                )}

                {/* Desktop chooser. One column where this middle column gets
                    squeezed between the clock and the metronome (lg), so labels
                    never run into the neighbouring button. */}
                {!chosenSkill && (
                  <div className='hidden gap-2 lg:grid lg:grid-cols-1 xl:grid-cols-2'>
                    {skillsData.map((skill) => (
                      <button
                        key={skill.id}
                        type='button'
                        onClick={() => startSkill(skill.id)}
                        className={cn(PRESSABLE, "flex min-w-0 items-center gap-2.5 rounded-lg border-b-black/30 bg-white/10 px-4 py-3 text-left text-sm text-zinc-100 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring")}>
                        <Play className='h-3.5 w-3.5 shrink-0 fill-current' style={{ color: skill.color }} />
                        <span translate="no" className='min-w-0 break-words'>{skill.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Phone: one list is the chooser, the summary and the pause,
                    so nothing has to be scrolled to below the metronome. */}
                <div className='flex flex-col gap-2 lg:hidden'>
                  {skillsData.map((skill) => (
                    <SkillRow
                      key={skill.id}
                      skillId={skill.id}
                      title={skill.title}
                      time={skill.time}
                      percent={skill.percent}
                      skillColor={skill.color}
                      chosen={chosenSkill === skill.id}
                      timerEnabled={timerEnabled}
                      onStart={() => startSkill(skill.id)}
                      onStop={() => stopTimer()}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className='text-sm font-medium text-zinc-400'>
                  {t("total_time")}
                </p>
                <p translate="no" className='mt-1.5 text-2xl font-bold leading-none text-white tabular-nums'>
                  {convertMsToHMS(sumTime)}
                </p>
              </div>
            </div>

            <div className='flex flex-col gap-3 lg:w-[320px] lg:shrink-0 lg:self-stretch'>
              {/* Electron-only amp simulator (renders nothing on web) */}
              <AmpSimButton h='h-10' />
              <Accordion type='multiple' className='flex flex-col gap-3'>
                <FreeTimerMetronome />
                <FreeTimerIntervalAlert elapsedMs={sumTime} isRunning={timerEnabled} />
              </Accordion>
            </div>
          </div>
        </Card>

        {/* Desktop only: on the phone the list above already is the summary. */}
        <div className='hidden gap-6 lg:grid lg:grid-cols-4'>
          {skillsData.map((skill) => (
            <CategoryBox
              key={skill.id}
              skillId={skill.id}
              title={skill.title}
              time={skill.time}
              skillColor={skill.color}
              timerEnabled={timerEnabled}
              onStart={() => startSkill(skill.id)}
              onStop={() => stopTimer()}
              percent={skill.percent}
              chosen={chosenSkill === skill.id}
              // Until a category is picked the chooser above is the one way
              // to start; the cards only switch or pause once a session runs.
              showControls={!!chosenSkill}
            />
          ))}
        </div>

        <div className='mx-auto mt-4 w-full max-w-3xl space-y-6 px-4 sm:mt-6 sm:space-y-8'>
          <div className='flex items-center justify-center gap-3 py-2'>
            {onResetTimer && (
              <Button
                onClick={() => setResetDialogOpen(true)}
                variant='subtle'
                size='lg'
                disabled={isFinishing || sumTime === 0}
              >
                <RotateCcw />
                {t("reset_button")}
              </Button>
            )}
            {!hasTrackedTime ? (
            <BackLink label={t("back_to_practice")} onClick={onBack} />
            ) : (
            <Button
              onClick={timerSubmitHandler}
              size='lg'
              className='min-w-[140px]'
              loading={isFinishing}
            >
              {isFinishing ? (
                  <span translate="no">{t("saving")}</span>
              ) : (
                  <span translate="no" className="flex items-center gap-2">
                    {t("end_button")}
                    <ArrowRight />
                  </span>
              )}
            </Button>
            )}
          </div>

          {onResetTimer && (
            <ConfirmDialog
              open={resetDialogOpen}
              onOpenChange={setResetDialogOpen}
              title={t("reset_dialog.title")}
              description={t("reset_dialog.description")}
              cancelLabel={t("reset_dialog.cancel")}
              confirmLabel={t("reset_dialog.confirm")}
              onConfirm={() => {
                onResetTimer();
                setResetDialogOpen(false);
              }}
              destructive
            />
          )}

          <p className='text-center text-xs text-muted-foreground sm:text-sm'>
            {hasTrackedTime ? (
              <>
                {t("info_about_report")}{" "}
                <Link href='/report' className='text-primary hover:underline'>
                  {t("report_link")}
                </Link>
              </>
            ) : (
              <>
                {t("practised_away")}{" "}
                <Link href='/report' className='text-primary hover:underline'>
                  {t("log_manually")}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </MainContainer>
  );
};

export default TimerLayout;
