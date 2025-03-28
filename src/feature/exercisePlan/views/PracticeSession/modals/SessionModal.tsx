import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { FaExpand, FaPause, FaPlay, FaStepForward } from "react-icons/fa";

import { categoryGradients } from "../../../constants/categoryStyles";
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

  // Get the category for gradient
  const category = currentExercise.category || "mixed";
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
            className='flex h-full flex-col overflow-hidden'>
            {/* Header with improved styling */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative pb-1 shadow-lg backdrop-blur-sm transition-all duration-300"
              )}>
              {/* Główne tło nagłówka z gradientem */}
              <div
                className={cn("absolute inset-0")}
                style={{
                  background:
                    "linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))",
                  clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 4px), 0 100%)",
                  opacity: 0.85,
                }}
              />

              {/* Highlight accent na dole */}
              <div
                className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent'
                style={{
                  boxShadow: "0 1px 4px rgba(var(--primary-rgb), 0.4)",
                }}
              />

              <div className='relative z-10 flex h-[68px] items-center justify-between'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onClose}
                  className='relative z-10 ml-6 mr-2 transition-all duration-200 hover:bg-background/80 hover:shadow-md'>
                  <X className='h-5 w-5' />
                </Button>

                <h1
                  className='relative z-10 truncate text-lg font-bold tracking-tight text-foreground drop-shadow-md'
                  style={{
                    textShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  }}>
                  {currentExercise.title[currentLang]}
                </h1>

                <div className='relative z-10 mr-6 flex items-center gap-2'>
                  <Badge variant='outline' className='shadow-sm'>
                    {currentExerciseIndex + 1} z {totalExercises}
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Content with its own scrolling context */}
            <div className='flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-background/10 to-background/5 pb-[76px]'>
              <div className='space-y-4 p-4'>
                {/* Exercise Image */}
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

                {/* Timer Display z efektownym tłem */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className='mb-8 flex justify-center'>
                  <div className='relative'>
                    {/* Trójkątne elementy dekoracyjne wokół timera */}
                    <div className='absolute -inset-4 -z-10 opacity-30'>
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className='absolute h-12 w-6 origin-bottom'
                          style={{
                            top: "-20px",
                            left: "calc(50% - 3px)",
                            transform: `rotate(${i * 45}deg)`,
                            background: `linear-gradient(to top, var(--tw-gradient-from), transparent)`,
                            opacity: 0.4,
                            zIndex: -1,
                          }}
                          animate={{
                            opacity: [0.2, 0.5, 0.2],
                            height: ["40px", "50px", "40px"],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>

                    {/* Dekoracyjne tło za timerem */}
                    <div
                      className='absolute -inset-8 -z-20 rounded-full opacity-20 blur-lg'
                      style={{
                        background: `radial-gradient(circle, var(--tw-gradient-from) 0%, transparent 70%)`,
                      }}
                    />

                    <TimerDisplay
                      value={timerProgressValue}
                      text={formattedTimeLeft}
                      isPlaying={isPlaying}
                      size='sm'
                    />
                  </div>
                </motion.div>

                {/* Instructions Card */}
                <Card className='overflow-hidden rounded-xl border-border/30 bg-card/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg'>
                  <div className='border-b border-border/50 bg-muted/10 p-3'>
                    <h3 className='font-medium'>
                      {t("exercises:instructions")}
                    </h3>
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
                <Card className='overflow-hidden rounded-xl border-border/30 bg-card/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg'>
                  <div className='border-b border-border/50 bg-muted/10 p-3'>
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

                {/* Metronome would be here */}
                {currentExercise.metronomeSpeed && (
                  <div className='mb-20'>
                    {/* Metronome component would be imported and used here */}
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Controls at Bottom */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className='fixed bottom-0 left-0 right-0 z-20 border-t bg-background/80 shadow-lg backdrop-blur-sm'>
              <div className='flex items-center justify-between p-4'>
                <Button
                  variant='outline'
                  onClick={onClose}
                  className='w-24 border-border/30 shadow-sm transition-all duration-200 hover:border-border/50 hover:shadow-md'>
                  Wyjdź
                </Button>

                <div className='flex gap-2'>
                  <Button
                    onClick={toggleTimer}
                    className={`h-12 w-12 rounded-full shadow-md transition-all duration-200 hover:shadow-lg ${
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
                      className='h-12 w-12 rounded-full border-border/30 shadow-sm transition-all duration-200 hover:border-border/50 hover:shadow-md'>
                      <FaStepForward className='h-5 w-5' />
                    </Button>
                  )}
                </div>

                <Button
                  variant='outline'
                  onClick={onFinish}
                  className='w-24 border-border/30 shadow-sm transition-all duration-200 hover:border-border/50 hover:shadow-md'>
                  Zakończ
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
};

export default SessionModal;
