import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Clock, X } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { FaExpand, FaPause, FaPlay, FaStepForward } from "react-icons/fa";

import type { LocalizedContent } from "../../../types/exercise.types";
import ModalWrapper from "../components/ModalWrapper";
import TimerDisplay from "../components/TimerDisplay";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  onImageClick: () => void;
  isMounted: boolean;
  currentExercise: any;
  nextExercise: any | null;
  currentLang: keyof LocalizedContent;
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
  currentLang,
  currentExerciseIndex,
  totalExercises,
  isLastExercise,
  isPlaying,
  timerProgressValue,
  formattedTimeLeft,
  toggleTimer,
  handleNextExercise,
}: SessionModalProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  if (!isOpen || !isMounted) return null;

  return (
    <ModalWrapper zIndex='z-[9999999]'>
      <div className='flex h-full flex-col overflow-hidden'>
        {/* Header with black button */}
        <div className='flex h-16 items-center justify-between border-b bg-background px-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='mr-2'>
            <X className='h-5 w-5' />
          </Button>
          <h1 className='truncate text-lg font-medium'>
            {currentExercise.title[currentLang]}
          </h1>
          <div className='flex items-center gap-2'>
            <Badge variant='outline'>
              {currentExerciseIndex + 1} z {totalExercises}
            </Badge>
          </div>
        </div>

        {/* Content with its own scrolling context */}
        <div className='flex-1 overflow-y-auto overscroll-contain pb-[76px]'>
          <div className='p-4'>
            {/* Exercise Image */}
            {currentExercise.image && (
              <div
                className='relative mb-4 w-full cursor-pointer overflow-hidden rounded-md border border-muted/30 bg-white/10'
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
            )}

            {/* Timer Display */}
            <div className='mb-6 flex justify-center'>
              <TimerDisplay
                value={timerProgressValue}
                text={formattedTimeLeft}
                isPlaying={isPlaying}
                size='sm'
              />
            </div>

            {/* Instructions Card */}
            <Card className='mb-4 overflow-hidden bg-card/50'>
              <div className='border-b border-border/50 bg-muted/5 p-3'>
                <h3 className='font-medium'>{t("exercises:instructions")}</h3>
              </div>
              <div className='space-y-2 p-4'>
                {currentExercise.instructions.map(
                  (instruction: any, index: number) => (
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

            {/* Tips Card */}
            <Card className='mb-4 overflow-hidden bg-card/50'>
              <div className='border-b border-border/50 bg-muted/5 p-3'>
                <h3 className='text-sm font-medium'>Wskazówki</h3>
              </div>
              <div className='p-4'>
                <ul className='space-y-2 text-sm'>
                  {currentExercise.tips.map((tip: any, index: number) => (
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
              <Card className='mb-4 overflow-hidden bg-card/50'>
                <div className='border-b border-border/50 bg-muted/5 p-3'>
                  <h3 className='text-sm font-medium'>Następne ćwiczenie</h3>
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

            {/* Metronome would be here */}
            {currentExercise.metronomeSpeed && (
              <div className='mb-20'>
                {/* Metronome component would be imported and used here */}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Controls at Bottom */}
        <div className='fixed bottom-0 left-0 right-0 z-20 border-t bg-background shadow-lg'>
          <div className='flex items-center justify-between p-4'>
            <Button variant='outline' onClick={onClose} className='w-24'>
              Wyjdź
            </Button>

            <div className='flex gap-2'>
              <Button
                onClick={toggleTimer}
                className={`h-12 w-12 rounded-full ${
                  isPlaying ? "bg-primary/90 hover:bg-primary/80" : ""
                }`}>
                {isPlaying ? (
                  <FaPause className='h-5 w-5' />
                ) : (
                  <FaPlay className='h-5 w-5' />
                )}
              </Button>
              {!isLastExercise && (
                <Button
                  variant='outline'
                  onClick={handleNextExercise}
                  className='h-12 w-12 rounded-full'>
                  <FaStepForward className='h-5 w-5' />
                </Button>
              )}
            </div>

            <Button variant='outline' onClick={onFinish} className='w-24'>
              Zakończ
            </Button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default SessionModal;
