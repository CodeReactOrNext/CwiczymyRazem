import "react-circular-progressbar/dist/styles.css";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { TooltipProvider } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { useRouter } from "next/router";
import { i18n } from "next-i18next";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaInfoCircle, FaLightbulb, FaCheck, FaStepForward } from "react-icons/fa";

import { ExerciseCompleteDialog } from "../../components/ExerciseCompleteDialog";
import { Metronome } from "../../components/Metronome/Metronome";
import type {
  ExercisePlan,
  LocalizedContent,
} from "../../types/exercise.types";
import { ExerciseImage } from "./components/ExerciseImage";
import { ExerciseProgress } from "./components/ExerciseProgress";
import { ExerciseSuccessView } from "./components/ExerciseSuccessView";
import { MainTimerSection } from "./components/MainTimerSection";
import { useImageHandling } from "./hooks/useImageHandling";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import ImageModal from "./modals/ImageModal";
import SessionModal from "./modals/SessionModal";

interface PracticeSessionProps {
  plan: ExercisePlan;
  onFinish: () => void;
}

const headerGradients = {
  technique: "from-blue-500/10 to-indigo-500/5",
  theory: "from-emerald-500/10 to-green-500/5",
  creativity: "from-purple-500/10 to-pink-500/5",
  hearing: "from-orange-500/10 to-amber-500/5",
  mixed: "from-red-500/10 to-yellow-500/5",
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
    resetSuccessView,
  } = usePracticeSessionState({ plan, onFinish });

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
        className={cn("font-openSans min-h-screen bg-zinc-950", isMobileView && "hidden")}>
        <TooltipProvider>
          <ExerciseLayout
            title={plan.title}
            actions={
              <Button
                variant='ghost'
                size='sm'
                onClick={onFinish}
                className='rounded-full border border-white/5 bg-zinc-900/50 px-4 text-xs font-medium text-zinc-400 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:text-white'>
                {t("common:finish")}
              </Button>
            }
            showBreadcrumbs={false}
            className={cn("border-b border-white/5 bg-zinc-900/50 backdrop-blur-sm", headerGradientClass)}>
            
            <div className='mx-auto max-w-5xl px-6 pb-48 pt-8'>
              
               {/* 1. Progress Bar (Top) */}
               <div className="mb-12">
                   <ExerciseProgress
                        plan={plan}
                        currentExerciseIndex={currentExerciseIndex}
                        formattedTimeLeft={formattedTimeLeft}
                   />
               </div>

               {/* 2. Hero Section (Image & Title) - "Zen Focus" */}
               <div className="mb-8 flex flex-col items-center justify-center text-center">
                    <h2 className="mb-6 text-3xl font-bold text-white tracking-tight">
                        {currentExercise.title[currentLang]}
                    </h2>
                    
                    {/* Score/Tab Image - Centered and Large */}
                    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
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
                    </div>
               </div>

               {/* 3. Collapsible Details (Tips & Instructions) - Hidden by default for Zen */}
               <div className="mb-12">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        <AccordionItem value="instructions" className="border-b-0">
                             <div className="rounded-xl border border-white/5 bg-zinc-900/30 px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <FaInfoCircle />
                                        <span>{t("exercises:instructions")}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 pt-2 text-zinc-300 leading-relaxed">
                                     <ul className="list-inside list-disc space-y-2">
                                        {currentExercise.instructions?.length > 0 ? (
                                            currentExercise.instructions.map((instruction, idx) => (
                                                <li key={idx} className="marker:text-zinc-600">
                                                    {instruction[currentLang] || instruction.pl}
                                                </li>
                                            ))
                                        ) : (
                                            <p className="text-zinc-500 italic">Brak instrukcji.</p>
                                        )}
                                     </ul>
                                </AccordionContent>
                             </div>
                        </AccordionItem>

                         <AccordionItem value="tips" className="border-b-0">
                            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-4">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3 text-amber-500/80">
                                        <FaLightbulb />
                                        <span>Wskazówki</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 pt-2 text-zinc-300 leading-relaxed">
                                    <ul className="list-inside list-disc space-y-2">
                                        {currentExercise.tips?.length > 0 ? (
                                            currentExercise.tips.map((tip, idx) => (
                                                <li key={idx} className="marker:text-amber-500/50">
                                                    {tip[currentLang] || tip.pl}
                                                </li>
                                            ))
                                        ) : (
                                            <p className="text-zinc-500 italic">Brak wskazówek.</p>
                                        )}
                                     </ul>
                                </AccordionContent>
                            </div>
                        </AccordionItem>
                    </Accordion>
               </div>

                {/* 4. Unified Control Deck (Sticky Bottom or Fixed) */}
               <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl p-4 lg:p-6 z-50">
                    <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 lg:gap-8">
                        
                         {/* Metronome Toggle */}
                         <div className="hidden lg:block">
                            {currentExercise.metronomeSpeed && (
                                <div className="scale-90 origin-left">
                                    <Metronome
                                        initialBpm={currentExercise.metronomeSpeed.recommended}
                                        minBpm={currentExercise.metronomeSpeed.min}
                                        maxBpm={currentExercise.metronomeSpeed.max}
                                        recommendedBpm={currentExercise.metronomeSpeed.recommended}
                                    />
                                </div>
                             )}
                         </div>

                         {/* Main Timer Control */}
                         <div className="flex-1 flex justify-center">
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
                                showExerciseInfo={false} // Hiding info in timer, focused on time
                                variant="compact"
                            />
                         </div>

                         {/* Next Action */}
                         <div className="hidden lg:block">
                            <Button
                                size="lg"
                                className="h-14 min-w-[140px] px-8 rounded-2xl bg-cyan-500 text-black font-bold text-base shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400 hover:shadow-cyan-500/40"
                                onClick={() => handleNextExercise(resetTimer)}
                            >
                                {isLastExercise ? (
                                    <span className="flex items-center gap-2"><FaCheck /> {t("common:finish")}</span>
                                ) : (
                                    <span className="flex items-center gap-2">{t("common:next")} <FaStepForward /></span>
                                )}
                            </Button>
                         </div>
                    </div>
               </div>

               {/* Complete Dialog */}
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
            </div>
          </ExerciseLayout>
        </TooltipProvider>
      </div>
    </>
  );
};
