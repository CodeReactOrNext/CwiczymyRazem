import "react-circular-progressbar/dist/styles.css";

import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaCompress, FaExpand } from "react-icons/fa";

import { ExerciseCompleteDialog } from "../../components/ExerciseCompleteDialog";
import { ExerciseDescription } from "../../components/ExerciseDescription";
import { Metronome } from "../../components/Metronome/Metronome";
import type { ExercisePlan } from "../../types/exercise.types";
import ExerciseControls from "./components/ExerciseControls";
import ExerciseProgress from "./components/ExerciseProgress";
// Import refactored components and hooks
import TimerDisplay from "./components/TimerDisplay";
import { useImageHandling } from "./hooks/useImageHandling";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import ImageModal from "./modals/ImageModal";
import SessionModal from "./modals/SessionModal";

interface PracticeSessionProps {
  plan: ExercisePlan;
  onFinish?: () => void;
}

export const PracticeSession = ({ plan, onFinish }: PracticeSessionProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the session state hook to manage application state
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

  // Use image handling hook for image interactions
  const {
    imageScale,
    imagePosition,
    isDragging,
    handleZoomIn,
    handleZoomOut,
    resetImagePosition,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleImageLoad,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useImageHandling({ containerRef });

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
      {/* Full-screen image modal for mobile */}
      {isMobileView && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageSrc={currentExercise.image || ""}
          imageAlt={currentExercise.title[currentLang]}
        />
      )}

      {/* Full-screen session modal for mobile */}
      {isMobileView && (
        <SessionModal
          isOpen={isFullSessionModalOpen}
          onClose={() => setIsFullSessionModalOpen(false)}
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
      )}

      {/* Regular desktop view */}
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
            <div className='container-fluid -mx-6 w-full p-0 md:mx-0'>
              {/* Exercise Image */}
              {currentExercise.image && (
                <>
                  {/* Mobile view - thumbnail that opens modal when clicked */}
                  {isMobileView ? (
                    <div
                      className='relative mb-4 w-full cursor-pointer overflow-hidden rounded-md border border-muted/30 bg-white/10'
                      onClick={() => setIsImageModalOpen(true)}>
                      <div className='relative aspect-[3.5/1] w-full'>
                        <Image
                          src={currentExercise.image}
                          alt={currentExercise.title[currentLang]}
                          className='h-full w-full object-contain'
                          fill
                          priority
                          quality={80}
                        />
                        <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                          <Button
                            variant='secondary'
                            size='sm'
                            className='pointer-events-none opacity-90'>
                            <span className='mr-2'>Powiększ</span>
                            <FaExpand className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Desktop view - standard interactive image */
                    <div className='relative mb-2 w-full overflow-hidden bg-white/10'>
                      <div
                        ref={containerRef}
                        className={cn(
                          "relative w-full select-none overflow-hidden",
                          isDragging ? "cursor-grabbing" : "cursor-grab",
                          "touch-none", // Disable browser's default touch actions
                          "min-h-[200px] py-4 md:mx-auto md:max-w-[900px] md:py-8" // Min height and padding
                        )}
                        onMouseDown={handleDragStart}
                        onMouseMove={handleDragMove}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}>
                        <div
                          className='flex h-full w-full items-center justify-center transition-all duration-100 ease-out'
                          style={{
                            transform: `translate3d(${imagePosition.x}px, ${imagePosition.y}px, 0) scale(${imageScale})`,
                            transformOrigin: "center center",
                            height: "100%",
                            width: "100%",
                          }}>
                          <Image
                            src={currentExercise.image}
                            alt={currentExercise.title[currentLang]}
                            className='h-auto w-full bg-white'
                            style={{ objectFit: "contain" }}
                            width={700}
                            height={200}
                            priority
                            quality={100}
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
                          disabled={imageScale >= 8}
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
                </>
              )}

              <div className='grid gap-6 md:grid-cols-[1fr,2fr,1fr]'>
                <div className='space-y-4'>
                  {/* Exercise Progress */}
                  <ExerciseProgress
                    plan={plan}
                    currentExerciseIndex={currentExerciseIndex}
                    timeLeft={timeLeft}
                    currentLang={currentLang}
                    formattedTimeLeft={formattedTimeLeft}
                  />

                  {/* Instructions */}
                  <Card className='overflow-hidden bg-card/50'>
                    <div className='border-b border-border/50 bg-muted/5 p-3'>
                      <h3 className='font-medium'>
                        {t("exercises:instructions")}
                      </h3>
                    </div>
                    <div className='space-y-2 p-4'>
                      {currentExercise.instructions.map(
                        (instruction, index) => (
                          <div
                            key={index}
                            className='flex items-start gap-2 text-sm text-muted-foreground'>
                            <span className='mt-1 h-1.5 w-1.5 rounded-full bg-primary' />
                            <span>{instruction[currentLang]}</span>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                </div>

                {/* Center panel - Main exercise area */}
                <div className='space-y-6'>
                  {/* Timer and controls */}
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
                          {/* Exercise description */}
                          <ExerciseDescription exercise={currentExercise} />

                          {/* Timer and controls */}
                          <div className='flex flex-col items-center gap-8 p-8 pt-0'>
                            {/* Timer */}
                            <TimerDisplay
                              value={timerProgressValue}
                              text={formattedTimeLeft}
                              isPlaying={isPlaying}
                              size='lg'
                            />

                            {/* Controls */}
                            <ExerciseControls
                              isPlaying={isPlaying}
                              isLastExercise={isLastExercise}
                              toggleTimer={toggleTimer}
                              handleNextExercise={handleNextExercise}
                              size='lg'
                            />
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
                      recommendedBpm={
                        currentExercise.metronomeSpeed.recommended
                      }
                    />
                  )}

                  {/* Tips Card */}
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

                  {/* Next Exercise Card */}
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
    </>
  );
};
