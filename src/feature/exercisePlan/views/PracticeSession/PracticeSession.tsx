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

// Simple mapping of category to header background gradient style
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

  // Get the category for gradient
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
              {/* Exercise Image */}
              {currentExercise.image && (
                <>
                  {/* Mobile view - thumbnail that opens modal when clicked */}
                  {isMobileView ? (
                    <div
                      className='relative mb-4 w-full cursor-pointer overflow-hidden rounded-xl border border-muted/30 bg-white/10 shadow-md transition-all duration-200 hover:shadow-lg'
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
                        <div className='absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]'>
                          <Button
                            variant='secondary'
                            size='sm'
                            className='pointer-events-none opacity-90 shadow-lg'>
                            <span className='mr-2'>Powiększ</span>
                            <FaExpand className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Desktop view - standard interactive image */
                    <div className='relative mb-2 w-full overflow-hidden rounded-xl bg-white/5 p-2 shadow-md backdrop-blur-[1px] transition-all duration-200 hover:shadow-lg'>
                      <div
                        ref={containerRef}
                        className={cn(
                          "relative w-full select-none overflow-hidden rounded-lg",
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
                            className='h-auto w-full rounded-md bg-white'
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
                      <div className='absolute right-6 top-6 flex gap-2'>
                        <Button
                          variant='secondary'
                          size='icon'
                          onClick={handleZoomOut}
                          disabled={imageScale <= 0.5}
                          className='bg-background/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background/90 hover:shadow-lg'>
                          <Minus className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='secondary'
                          size='icon'
                          onClick={handleZoomIn}
                          disabled={imageScale >= 8}
                          className='bg-background/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background/90 hover:shadow-lg'>
                          <Plus className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='secondary'
                          size='icon'
                          onClick={resetImagePosition}
                          className='bg-background/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-background/90 hover:shadow-lg'>
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
                  <Card className='overflow-hidden rounded-xl border-border/30 bg-card/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg'>
                    <div className='border-b border-border/50 bg-muted/10 p-3'>
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
                      <Card className='relative overflow-hidden rounded-xl border-2 border-primary/20 bg-card/80 shadow-lg backdrop-blur-sm transition-all duration-200'>
                        <div className='absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent' />
                        <div className='relative'>
                          {/* Exercise description */}
                          <ExerciseDescription exercise={currentExercise} />

                          {/* Timer and controls */}
                          <div className='flex flex-col items-center gap-8 p-8 pt-0'>
                            {/* Timer z efektownymi dodatkami */}
                            <div className='relative'>
                              {/* Pierścienie dekoracyjne wokół timera */}
                              <div className='absolute -inset-4 -z-10 opacity-40'>
                                {[...Array(2)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className='absolute inset-0 rounded-full'
                                    style={{
                                      border: "1px solid",
                                      borderColor: "var(--tw-gradient-from)",
                                      scale: 1 + i * 0.12,
                                      opacity: 0.2 + i * 0.1,
                                    }}
                                    animate={{
                                      scale: [
                                        1 + i * 0.12,
                                        1.1 + i * 0.12,
                                        1 + i * 0.12,
                                      ],
                                      opacity: [
                                        0.2 + i * 0.1,
                                        0.3 + i * 0.1,
                                        0.2 + i * 0.1,
                                      ],
                                    }}
                                    transition={{
                                      duration: 4,
                                      repeat: Infinity,
                                      delay: i * 1.5,
                                      ease: "easeInOut",
                                    }}
                                  />
                                ))}
                              </div>

                              {/* Trójkątne elementy dekoracyjne wokół timera w wersji desktop */}
                              <div className='absolute -inset-4 -z-10 opacity-30'>
                                {[...Array(10)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className='absolute h-16 w-6 origin-bottom'
                                    style={{
                                      top: "-30px",
                                      left: "calc(50% - 3px)",
                                      transform: `rotate(${i * 36}deg)`,
                                      background: `linear-gradient(to top, var(--tw-gradient-from), transparent)`,
                                      opacity: 0.2,
                                      zIndex: -1,
                                    }}
                                    animate={{
                                      opacity: [0.1, 0.35, 0.1],
                                      height: ["50px", "60px", "50px"],
                                    }}
                                    transition={{
                                      duration: 6,
                                      repeat: Infinity,
                                      delay: i * 0.6,
                                      ease: "easeInOut",
                                    }}
                                  />
                                ))}
                              </div>

                              {/* Dekoracyjne tło za timerem */}
                              <div
                                className='absolute -inset-10 -z-20 rounded-full opacity-10 blur-xl'
                                style={{
                                  background: `radial-gradient(circle, var(--tw-gradient-from) 0%, transparent 70%)`,
                                }}
                              />

                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 20,
                                }}>
                                <TimerDisplay
                                  value={timerProgressValue}
                                  text={formattedTimeLeft}
                                  isPlaying={isPlaying}
                                  size='lg'
                                />
                              </motion.div>
                            </div>

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
                  <Card className='overflow-hidden rounded-xl border-border/30 bg-card/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg'>
                    <div className='border-b border-border/50 bg-muted/10 p-3'>
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
                    <Card className='overflow-hidden rounded-xl border-border/30 bg-card/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg'>
                      <div className='border-b border-border/50 bg-muted/10 p-3'>
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
