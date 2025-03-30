import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Metronome } from "feature/exercisePlan/components/Metronome/Metronome";
import { ModalWrapper } from "feature/exercisePlan/views/PracticeSession/components/ModalWrapper";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { i18n } from "next-i18next";
import { FaExpand } from "react-icons/fa";

import { categoryGradients } from "../../../constants/categoryStyles";
import type { LocalizedContent } from "../../../types/exercise.types";
import { InstructionsCard } from "../components/InstructionsCard";
import { MobileTimerDisplay } from "../components/MobileTimerDisplay";
import { NextExerciseCard } from "../components/NextExerciseCard";
import { SessionModalControls } from "../components/SessionModalControls";
import { SessionModalHeader } from "../components/SessionModalHeader";
import { TipsCard } from "../components/TipsCard";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  onImageClick: () => void;
  isMounted: boolean;
  currentExercise: any;
  nextExercise: any | null;
  currentExerciseIndex: number;
  totalExercises: number;
  isLastExercise: boolean;
  isPlaying: boolean;
  timerProgressValue: number;
  formattedTimeLeft: string;
  toggleTimer: () => void;
  handleNextExercise: () => void;
}

const SessionModal = ({
  isOpen,
  onClose,
  onFinish,
  onImageClick,
  isMounted,
  currentExercise,
  nextExercise,
  currentExerciseIndex,
  totalExercises,
  isLastExercise,
  isPlaying,
  timerProgressValue,
  formattedTimeLeft,
  toggleTimer,
  handleNextExercise,
}: SessionModalProps) => {
  if (!isOpen || !isMounted) return null;

  const category = currentExercise.category || "mixed";
  const currentLang = i18n?.language as keyof LocalizedContent;

  const gradientClasses =
    categoryGradients[category as keyof typeof categoryGradients];

  return (
    <ModalWrapper zIndex='z-[9999999]'>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "flex h-full flex-col overflow-hidden",
              gradientClasses
            )}>
            <SessionModalHeader
              exerciseTitle={currentExercise.title[currentLang]}
              currentExerciseIndex={currentExerciseIndex}
              totalExercises={totalExercises}
              onClose={onClose}
            />

            <div className='flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-background/10 to-background/5 pb-[76px]'>
              <div className='space-y-4 p-4'>
                {currentExercise.image && (
                  <div
                    className='relative mb-4 w-full cursor-pointer overflow-hidden rounded-xl border border-muted/30 bg-white/5 shadow-md backdrop-blur-[1px] transition-all duration-200 hover:shadow-lg'
                    onClick={onImageClick}>
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
                )}

                <MobileTimerDisplay
                  timerProgressValue={timerProgressValue}
                  formattedTimeLeft={formattedTimeLeft}
                  isPlaying={isPlaying}
                />

                <InstructionsCard
                  instructions={currentExercise.instructions}
                  title='Instrukcje'
                />

                <TipsCard tips={currentExercise.tips} />

                {nextExercise && (
                  <NextExerciseCard
                    nextExercise={nextExercise}
                    isMobile={true}
                  />
                )}

                {currentExercise.metronomeSpeed && (
                  <div className='mb-20'>
                    <Metronome
                      initialBpm={currentExercise.metronomeSpeed.recommended}
                      minBpm={currentExercise.metronomeSpeed.min}
                      maxBpm={currentExercise.metronomeSpeed.max}
                      recommendedBpm={
                        currentExercise.metronomeSpeed.recommended
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <SessionModalControls
              isPlaying={isPlaying}
              isLastExercise={isLastExercise}
              onClose={onClose}
              onFinish={onFinish}
              toggleTimer={toggleTimer}
              handleNextExercise={handleNextExercise}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
};

export default SessionModal;
