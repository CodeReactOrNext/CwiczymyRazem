import "react-circular-progressbar/dist/styles.css";

import { Button } from "assets/components/ui/button";
import { TooltipProvider } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { useRouter } from "next/router";
import { i18n } from "next-i18next";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { ExerciseCompleteDialog } from "../../components/ExerciseCompleteDialog";
import { Metronome } from "../../components/Metronome/Metronome";
import type {
  ExercisePlan,
  LocalizedContent,
} from "../../types/exercise.types";
import { ExerciseImage } from "./components/ExerciseImage";
import { ExerciseProgress } from "./components/ExerciseProgress";
import { ExerciseSuccessView } from "./components/ExerciseSuccessView";
import { InstructionsCard } from "./components/InstructionsCard";
import { MainTimerSection } from "./components/MainTimerSection";
import { NextExerciseCard } from "./components/NextExerciseCard";
import { TipsCard } from "./components/TipsCard";
import { useImageHandling } from "./hooks/useImageHandling";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import ImageModal from "./modals/ImageModal";
import SessionModal from "./modals/SessionModal";

interface PracticeSessionProps {
  plan: ExercisePlan;
  onFinish: () => void;
}

const headerGradients = {
  technique: "from-blue-500/30 to-indigo-500/20 hover:from-blue-500/40 ",
  theory: "from-emerald-500/30 to-green-500/20 hover:from-emerald-500/40 ",
  creativity: "from-purple-500/30 to-pink-500/20 hover:from-purple-500/40",
  hearing: "from-orange-500/30 to-amber-500/20 hover:from-orange-500/40",
  mixed: "from-red-500/30 to-yellow-500/20 hover:from-red-500/40",
};

export const PracticeSession = ({ plan, onFinish }: PracticeSessionProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const currentLang = i18n?.language as keyof LocalizedContent;
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    currentExerciseIndex,
    exerciseKey,
    showCompleteDialog,
    isMobileView,
    isFullSessionModalOpen,
    isImageModalOpen,
    isMounted,
    currentExercise,
    nextExercise,
    isLastExercise,
    isPlaying,
    formattedTimeLeft,
    timerProgressValue,
    setShowCompleteDialog,
    setIsImageModalOpen,
    handleNextExercise,
    timeLeft,
    toggleTimer,
    startTimer,
    resetTimer,
    showSuccessView,
    setShowSuccessView,
    resetSuccessView,
  } = usePracticeSessionState({ plan });

  const {
    imageScale,
    setImageScale,
    handleZoomIn,
    handleZoomOut,
    resetImagePosition,
  } = useImageHandling();

  const category = currentExercise.category || "mixed";
  const headerGradientClass =
    headerGradients[category as keyof typeof headerGradients];

  return (
    <>
      {showSuccessView && (
        <ExerciseSuccessView
          planTitle={plan.title as string}
          onFinish={onFinish}
          onRestart={() => {
            resetSuccessView();
            resetTimer();
            startTimer();
          }}
        />
      )}

      {isMobileView && (
        <>
          <ImageModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            imageSrc={currentExercise.image || ""}
            imageAlt={currentExercise.title[currentLang] as string}
          />

          <SessionModal
            isOpen={isFullSessionModalOpen}
            onClose={() => router.push("/report")}
            onFinish={onFinish}
            onImageClick={() => setIsImageModalOpen(true)}
            isMounted={isMounted}
            currentExercise={currentExercise}
            nextExercise={nextExercise}
            currentExerciseIndex={currentExerciseIndex}
            totalExercises={plan.exercises.length}
            isLastExercise={isLastExercise}
            isPlaying={isPlaying}
            timerProgressValue={timerProgressValue}
            formattedTimeLeft={formattedTimeLeft}
            toggleTimer={toggleTimer}
            handleNextExercise={() => handleNextExercise(resetTimer)}
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
                    formattedTimeLeft={formattedTimeLeft}
                  />

                  <InstructionsCard
                    instructions={currentExercise.instructions}
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
                    timeLeft={timeLeft}
                    handleNextExercise={() => handleNextExercise(resetTimer)}
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

                  <TipsCard tips={currentExercise.tips} />

                  {nextExercise && (
                    <NextExerciseCard nextExercise={nextExercise} />
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
