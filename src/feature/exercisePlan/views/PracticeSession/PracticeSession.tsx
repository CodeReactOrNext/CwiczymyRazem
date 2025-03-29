import "react-circular-progressbar/dist/styles.css";

import { Button } from "assets/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaCompress, FaExpand } from "react-icons/fa";

import { ExerciseCompleteDialog } from "../../components/ExerciseCompleteDialog";
import { Metronome } from "../../components/Metronome/Metronome";
import type { ExercisePlan } from "../../types/exercise.types";
import { ExerciseImage } from "./components/ExerciseImage";
import { ExerciseProgress } from "./components/ExerciseProgress";
import { InstructionsCard } from "./components/InstructionsCard";
import { MainTimerSection } from "./components/MainTimerSection";
import { NextExerciseCard } from "./components/NextExerciseCard";
import { TipsCard } from "./components/TipsCard";
import { useImageHandling } from "./hooks/useImageHandling";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import ImageModal from "./modals/ImageModal";
import SessionModal from "./modals/SessionModal";
import { useRouter } from "next/router";

interface PracticeSessionProps {
  plan: ExercisePlan;
  onFinish: () => void;
}

const headerGradients = {
  technique:
    "from-blue-500/30 to-indigo-500/20 hover:from-blue-500/40 hover:to-indigo-500/30",
  theory:
    "from-emerald-500/30 to-green-500/20 hover:from-emerald-500/40 hover:to-green-500/30",
  creativity:
    "from-purple-500/30 to-pink-500/20 hover:from-purple-500/40 hover:to-pink-500/30",
  hearing:
    "from-orange-500/30 to-amber-500/20 hover:from-orange-500/40 hover:to-amber-500/30",
  mixed:
    "from-red-500/30 to-yellow-500/20 hover:from-red-500/40 hover:to-yellow-500/30",
};

export const PracticeSession = ({ plan, onFinish }: PracticeSessionProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const sessionState = usePracticeSessionState({ plan, onFinish });
  const {
    currentExerciseIndex,
    exerciseKey,
    isFullscreen,
    showCompleteDialog,
    isMobileView,
    isFullSessionModalOpen,
    isImageModalOpen,
    isMounted,
    currentExercise,
    nextExercise,
    isLastExercise,
    timeLeft,
    isPlaying,
    formattedTimeLeft,
    timerProgressValue,
    setShowCompleteDialog,
    setIsFullSessionModalOpen,
    setIsImageModalOpen,
    handleExerciseComplete,
    handleNextExercise,
    toggleTimer,
    toggleFullscreen,
    startTimer,
    resetTimer,
    currentLang,
  } = sessionState;

  const {
    imageScale,
    setImageScale,
    handleZoomIn,
    handleZoomOut,
    resetImagePosition,
  } = useImageHandling({ containerRef });

  const category = currentExercise.category || "mixed";
  const headerGradientClass =
    headerGradients[category as keyof typeof headerGradients];

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
    <>
      {/* Mobile Modals */}
      {isMobileView && (
        <>
          <ImageModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            imageSrc={currentExercise.image || ""}
            imageAlt={currentExercise.title[currentLang]}
          />

          <SessionModal
            isOpen={isFullSessionModalOpen}
            onClose={() => router.push("/report")}
            onFinish={onFinish || (() => {})}
            onImageClick={() => setIsImageModalOpen(true)}
            isMounted={isMounted}
            currentExercise={currentExercise}
            nextExercise={nextExercise}
            currentLang={currentLang}
            currentExerciseIndex={currentExerciseIndex}
            totalExercises={plan.exercises.length}
            isLastExercise={isLastExercise}
            isPlaying={isPlaying}
            timerProgressValue={timerProgressValue}
            formattedTimeLeft={formattedTimeLeft}
            toggleTimer={toggleTimer}
            handleNextExercise={handleNextExercise}
          />
        </>
      )}

      <div
        className={cn("space-y-6 p-6 font-openSans", isMobileView && "hidden")}>
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
                      className='transition-all duration-200 hover:bg-background/80'
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
                <Button
                  variant='outline'
                  onClick={onFinish}
                  className='border-border/30 shadow-sm transition-all duration-200 hover:border-border/50 hover:shadow-md'>
                  Zakończ sesję
                </Button>
              </div>
            }
            showBreadcrumbs={false}
            className={headerGradientClass}>
            <div className='container-fluid -mx-6 w-full p-0 md:mx-0'>
              {currentExercise.image && (
                <ExerciseImage
                  image={currentExercise.image}
                  title={currentExercise.title[currentLang]}
                  isMobileView={isMobileView}
                  imageScale={imageScale}
                  containerRef={containerRef}
                  setImageModalOpen={setIsImageModalOpen}
                  handleZoomIn={handleZoomIn}
                  handleZoomOut={handleZoomOut}
                  resetImagePosition={resetImagePosition}
                  setImageScale={setImageScale}
                />
              )}

              <div className='grid gap-6 md:grid-cols-[1fr,2fr,1fr]'>
                <div className='space-y-4'>
                  <ExerciseProgress
                    plan={plan}
                    currentExerciseIndex={currentExerciseIndex}
                    timeLeft={timeLeft}
                    formattedTimeLeft={formattedTimeLeft}
                  />

                  <InstructionsCard
                    instructions={currentExercise.instructions}
                    currentLang={currentLang}
                    title={t("exercises:instructions")}
                  />
                </div>

                <div className='space-y-6'>
                  <MainTimerSection
                    exerciseKey={exerciseKey}
                    currentExercise={currentExercise}
                    isLastExercise={isLastExercise}
                    isPlaying={isPlaying}
                    timerProgressValue={timerProgressValue}
                    formattedTimeLeft={formattedTimeLeft}
                    toggleTimer={toggleTimer}
                    handleNextExercise={handleNextExercise}
                  />
                </div>

                <div className='space-y-4'>
                  {currentExercise.metronomeSpeed && (
                    <Metronome
                      initialBpm={currentExercise.metronomeSpeed.recommended}
                      minBpm={currentExercise.metronomeSpeed.min}
                      maxBpm={currentExercise.metronomeSpeed.max}
                      recommendedBpm={
                        currentExercise.metronomeSpeed.recommended
                      }
                    />
                  )}

                  <TipsCard
                    tips={currentExercise.tips}
                    currentLang={currentLang}
                  />

                  {nextExercise && (
                    <NextExerciseCard
                      nextExercise={nextExercise}
                      currentLang={currentLang}
                    />
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
    </>
  );
};
