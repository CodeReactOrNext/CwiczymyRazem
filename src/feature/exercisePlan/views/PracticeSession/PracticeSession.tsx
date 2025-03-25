import "react-circular-progressbar/dist/styles.css";

import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExerciseLayout } from "feature/exercisePlan/components/layout/ExerciseLayout";
import { updateTimerTime } from "feature/user/store/userSlice";
import { AnimatePresence, motion } from "framer-motion";
import useTimer from "hooks/useTimer";
import { Clock, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { useTranslation } from "react-i18next";
import {
  FaCompress,
  FaExpand,
  FaPause,
  FaPlay,
  FaStepForward,
} from "react-icons/fa";
import { useAppDispatch } from "store/hooks";
import type { SkillsType } from "types/skillsTypes";

import { ExerciseCompleteDialog } from "../../components/ExerciseCompleteDialog";
import { ExerciseDescription } from "../../components/ExerciseDescription";
import { Metronome } from "../../components/Metronome/Metronome";
import { useExerciseTimer } from "../../hooks/useExerciseTimer";
import type {
  ExercisePlan,
  LocalizedContent,
} from "../../types/exercise.types";

interface PracticeSessionProps {
  plan: ExercisePlan;
  onFinish?: () => void;
}

const categoryColors = {
  technique: "bg-blue-100 text-blue-800 border-blue-200",
  theory: "bg-emerald-100 text-emerald-800 border-emerald-200",
  creativity: "bg-purple-100 text-purple-800 border-purple-200",
  hearing: "bg-orange-100 text-orange-800 border-orange-200",
};

export const PracticeSession = ({ plan, onFinish }: PracticeSessionProps) => {
  const { t, i18n } = useTranslation(["exercises", "common"]);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const timer = useTimer();
  const currentLang = i18n.language as keyof LocalizedContent;
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [exerciseKey, setExerciseKey] = useState(0);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>();
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const currentExercise = plan.exercises[currentExerciseIndex];
  const nextExercise = plan.exercises[currentExerciseIndex + 1];
  const isLastExercise = currentExerciseIndex === plan.exercises.length - 1;

  const {
    timeLeft,
    isPlaying,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
  } = useExerciseTimer({
    duration: currentExercise.timeInMinutes * 60,
    onComplete: () => {
      if (isLastExercise) {
        handleExerciseComplete();
      } else {
        handleNextExercise();
      }
    },
  });

  const updateTime = useCallback(() => {
    const timeInMs = timer.time;
    if (timeInMs > 0) {
      const skillType = currentExercise.category as SkillsType;

      dispatch(
        updateTimerTime({
          type: skillType,
          time: timeInMs,
        })
      );
    }
  }, [currentExercise.category, dispatch, timer.time]);

  const handleExerciseComplete = () => {
    setShowCompleteDialog(true);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < plan.exercises.length - 1) {
      setExerciseKey((prev) => prev + 1);
      setCurrentExerciseIndex((prev) => prev + 1);
      resetTimer();
    } else {
      handleExerciseComplete();
    }
  };

  const toggleTimer = () => {
    if (isPlaying) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - lastPosition.current.x,
      y: e.clientY - lastPosition.current.y,
    };
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  const calculateBounds = useCallback(
    (mouseEvent: MouseEvent | React.MouseEvent) => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const container = containerRef.current.getBoundingClientRect();
      const scaledWidth = imageDimensions.width * imageScale;
      const scaledHeight = imageDimensions.height * imageScale;

      const canMoveHorizontally = scaledWidth > container.width;
      const canMoveVertically = scaledHeight > container.height;

      const x = canMoveHorizontally
        ? mouseEvent.clientX - dragStart.current.x
        : 0;
      const y = canMoveVertically
        ? mouseEvent.clientY - dragStart.current.y
        : 0;

      return { x, y };
    },
    [imageScale, imageDimensions]
  );

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    animationFrame.current = requestAnimationFrame(() => {
      const { x, y } = calculateBounds(e);
      lastPosition.current = { x, y };
      setImagePosition({ x, y });
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
  };

  const resetImagePosition = () => {
    lastPosition.current = { x: 0, y: 0 };
    setImagePosition({ x: 0, y: 0 });
    setImageScale(1);
  };

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    document.title = `(${currentExerciseIndex + 1}/${plan.exercises.length}) ${
      currentExercise.title[currentLang]
    } - Practice`;
    return () => {
      document.title = "Guitar Practice";
    };
  }, [
    currentExerciseIndex,
    currentExercise.title[currentLang],
    plan.exercises.length,
  ]);

  useEffect(() => {
    timer.startTimer();
    return () => {
      updateTime();
      timer.stopTimer();
    };
  }, []);

  useEffect(() => {
    if (!timer.timerEnabled) return;
    updateTime();
  }, [timer.time, timer.timerEnabled, updateTime]);

  if (!plan) {
    return (
      <div className='flex h-64 flex-col items-center justify-center'>
        <p className='mb-4 text-lg text-muted-foreground'>
          {t("exercises:practice_session.plan_not_found")}
        </p>
        <Button onClick={onFinish}>{t("common:back")}</Button>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6 font-openSans'>
      <TooltipProvider>
        <ExerciseLayout
          title={plan.title}
          actions={
            <div className='flex items-center gap-2'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={toggleFullscreen}>
                    {isFullscreen ? (
                      <FaCompress className='h-4 w-4' />
                    ) : (
                      <FaExpand className='h-4 w-4' />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen
                    ? "Wyjdź z trybu pełnoekranowego"
                    : "Tryb pełnoekranowy"}
                </TooltipContent>
              </Tooltip>
              <Button variant='outline' onClick={onFinish}>
                Zakończ sesję
              </Button>
            </div>
          }
          showBreadcrumbs={false}>
          <div className='container'>
            {/* Obraz ćwiczenia */}
            {currentExercise.image && (
              <div className='relative mb-6  overflow-hidden rounded-lg bg-card/50'>
                <div
                  ref={containerRef}
                  className={cn(
                    "relative h-full w-full cursor-grab select-none overflow-hidden",
                    isDragging && "cursor-grabbing"
                  )}
                  onMouseDown={handleDragStart}
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}>
                  <div
                    className='transition-all duration-100 ease-out'
                    style={{
                      transform: `translate3d(${imagePosition.x}px, ${imagePosition.y}px, 0) scale(${imageScale})`,
                      transformOrigin: "center center",
                    }}>
                    <Image
                      src={currentExercise.image}
                      alt={currentExercise.title[currentLang]}
                      className='h-full w-full object-contain'
                      priority
                      draggable={false}
                      onLoad={handleImageLoad}
                    />
                  </div>
                </div>
                <div className='absolute right-4 top-4 flex gap-2'>
                  <Button
                    variant='secondary'
                    size='icon'
                    onClick={handleZoomOut}
                    disabled={imageScale <= 0.5}
                    className='bg-background/80 backdrop-blur-sm'>
                    <Minus className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='secondary'
                    size='icon'
                    onClick={handleZoomIn}
                    disabled={imageScale >= 2}
                    className='bg-background/80 backdrop-blur-sm'>
                    <Plus className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='secondary'
                    size='icon'
                    onClick={resetImagePosition}
                    className='bg-background/80 backdrop-blur-sm'>
                    <FaCompress className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}

            <div className='grid gap-6 md:grid-cols-[1fr,2fr,1fr]'>
              <div className='space-y-4'>
                <Card className='overflow-hidden bg-muted/5'>
                  <div className='p-4'>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between text-sm'>
                        <Badge variant='outline'>
                          {currentExerciseIndex + 1} z {plan.exercises.length}
                        </Badge>
                        <span className='text-muted-foreground'>
                          {Math.floor(timeLeft / 60)}:
                          {String(timeLeft % 60).padStart(2, "0")} pozostało
                        </span>
                      </div>

                      <div className='space-y-1'>
                        <div className='relative h-2 w-full overflow-hidden rounded-full bg-muted/30'>
                          {plan.exercises.map((exercise, idx) => {
                            const width = (1 / plan.exercises.length) * 100;
                            const left = (idx / plan.exercises.length) * 100;

                            return (
                              <Tooltip key={idx}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      "absolute h-full transition-all duration-500",
                                      idx < currentExerciseIndex
                                        ? "bg-primary/80" // Ukończone ćwiczenia
                                        : idx === currentExerciseIndex
                                        ? "bg-primary" // Aktywne ćwiczenie
                                        : "bg-muted/20", // Pozostałe ćwiczenia
                                      idx === currentExerciseIndex &&
                                        "after:absolute after:inset-0 after:animate-pulse after:bg-primary/20"
                                    )}
                                    style={{
                                      left: `${left}%`,
                                      width: `${width}%`,
                                      // Dla aktywnego ćwiczenia, pokazujemy postęp w ramach tego ćwiczenia
                                      ...(idx === currentExerciseIndex && {
                                        clipPath: `inset(0 ${
                                          100 -
                                          (timeLeft /
                                            (currentExercise.timeInMinutes *
                                              60)) *
                                            100
                                        }% 0 0)`,
                                      }),
                                    }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent
                                  className='flex flex-col gap-1 p-3'
                                  side='bottom'>
                                  <div className='font-medium'>
                                    {exercise.title[currentLang]}
                                  </div>
                                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                    <Badge
                                      variant='secondary'
                                      className='h-5 px-1.5 text-xs'>
                                      {idx + 1}/{plan.exercises.length}
                                    </Badge>
                                    <span>•</span>
                                    <span>{exercise.timeInMinutes} min</span>
                                    {idx < currentExerciseIndex && (
                                      <>
                                        <span>•</span>
                                        <span className='text-green-600'>
                                          Ukończone
                                        </span>
                                      </>
                                    )}
                                    {idx === currentExerciseIndex && (
                                      <>
                                        <span>•</span>
                                        <span className='text-primary'>
                                          W trakcie
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}

                          {/* Separator między ćwiczeniami */}
                          {plan.exercises.map(
                            (_, idx) =>
                              idx < plan.exercises.length - 1 && (
                                <div
                                  key={`separator-${idx}`}
                                  className='absolute top-0 h-full w-px bg-background/50'
                                  style={{
                                    left: `${
                                      ((idx + 1) / plan.exercises.length) * 100
                                    }%`,
                                  }}
                                />
                              )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Instrukcje */}
                <Card className='overflow-hidden bg-card/50'>
                  <div className='border-b border-border/50 bg-muted/5 p-3'>
                    <h3 className='font-medium'>
                      {t("exercises:instructions")}
                    </h3>
                  </div>
                  <div className='space-y-2 p-4'>
                    {currentExercise.instructions.map((instruction, index) => (
                      <div
                        key={index}
                        className='flex items-start gap-2 text-sm text-muted-foreground'>
                        <span className='mt-1 h-1.5 w-1.5 rounded-full bg-primary' />
                        <span>{instruction[currentLang]}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Panel środkowy - Główny obszar ćwiczenia */}
              <div className='space-y-6'>
                {/* Timer i kontrolki */}
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={exerciseKey}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className='space-y-6'>
                    <Card className='relative overflow-hidden border-2 border-primary/10'>
                      <div className='absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent' />
                      <div className='relative'>
                        {/* Opis ćwiczenia */}
                        <ExerciseDescription exercise={currentExercise} />

                        {/* Timer i kontrolki */}
                        <div className='flex flex-col items-center gap-8 p-8 pt-0'>
                          {/* Timer */}
                          <div className='relative'>
                            <div className='relative h-48 w-48'>
                              <CircularProgressbar
                                value={
                                  (timeLeft /
                                    (currentExercise.timeInMinutes * 60)) *
                                  100
                                }
                                text={`${Math.floor(timeLeft / 60)}:${String(
                                  timeLeft % 60
                                ).padStart(2, "0")}`}
                                styles={buildStyles({
                                  pathColor: isPlaying
                                    ? "hsl(var(--primary))"
                                    : "hsl(var(--muted))",
                                  textColor: "hsl(var(--foreground))",
                                  trailColor: "hsl(var(--muted)/0.2)",
                                  pathTransition: isPlaying
                                    ? "stroke-dashoffset 0.5s linear"
                                    : "none",
                                  textSize: "28px",
                                  strokeLinecap: "round",
                                })}
                              />
                              {isPlaying && (
                                <motion.div
                                  className='absolute inset-0 rounded-full border-2 border-primary/30'
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Kontrolki */}
                          <div className='flex w-full max-w-sm gap-4'>
                            <Button
                              size='lg'
                              onClick={toggleTimer}
                              className={cn(
                                "flex-1 text-lg transition-all",
                                isPlaying
                                  ? "bg-primary/90 hover:bg-primary/80"
                                  : ""
                              )}>
                              {isPlaying ? (
                                <FaPause className='h-6 w-6' />
                              ) : (
                                <FaPlay className='h-6 w-6' />
                              )}
                            </Button>
                            {!isLastExercise && (
                              <Button
                                size='lg'
                                variant='outline'
                                onClick={handleNextExercise}
                                className='flex-1'>
                                <FaStepForward className='h-6 w-6' />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className='space-y-4'>
                {currentExercise.metronomeSpeed && (
                  <Metronome
                    initialBpm={currentExercise.metronomeSpeed.recommended}
                    minBpm={currentExercise.metronomeSpeed.min}
                    maxBpm={currentExercise.metronomeSpeed.max}
                    recommendedBpm={currentExercise.metronomeSpeed.recommended}
                  />
                )}
                <Card className='overflow-hidden bg-card/50'>
                  <div className='border-b border-border/50 bg-muted/5 p-3'>
                    <h3 className='text-sm font-medium'>Wskazówki</h3>
                  </div>
                  <div className='p-4'>
                    <ul className='space-y-2 text-sm'>
                      {currentExercise.tips.map((tip, index) => (
                        <li
                          key={index}
                          className='flex items-start gap-2 text-muted-foreground'>
                          <span className='mt-0.5 text-primary'>💡</span>
                          {tip[currentLang]}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                {/* Następne ćwiczenie */}
                {nextExercise && (
                  <Card className='overflow-hidden bg-card/50'>
                    <div className='border-b border-border/50 bg-muted/5 p-3'>
                      <h3 className='text-sm font-medium'>
                        Następne ćwiczenie
                      </h3>
                    </div>
                    <div className='p-4'>
                      <div className='space-y-2'>
                        <h4 className='font-medium'>
                          {nextExercise.title[currentLang]}
                        </h4>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <Clock className='h-4 w-4' />
                          <span>{nextExercise.timeInMinutes} min</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <ExerciseCompleteDialog
            isOpen={showCompleteDialog}
            onClose={() => {
              setShowCompleteDialog(false);
              onFinish?.();
            }}
            onRestart={() => {
              setShowCompleteDialog(false);
              resetTimer();
              startTimer();
            }}
            exerciseTitle={currentExercise.title[currentLang]}
            duration={currentExercise.timeInMinutes}
          />
        </ExerciseLayout>
      </TooltipProvider>
    </div>
  );
};
