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
        className={cn("font-openSans min-h-screen bg-zinc-950 relative overflow-hidden", isMobileView && "hidden")}>
        
        {/* Background Ambiance Glows */}
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-all duration-1000",
          category === "technique" && "bg-blue-500",
          category === "theory" && "bg-emerald-500",
          category === "creativity" && "bg-purple-500",
          category === "hearing" && "bg-orange-500",
          category === "mixed" && "bg-cyan-500"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 transition-all duration-1000",
          category === "technique" && "bg-indigo-500",
          category === "theory" && "bg-green-500",
          category === "creativity" && "bg-pink-500",
          category === "hearing" && "bg-amber-500",
          category === "mixed" && "bg-blue-500"
        )} />

        <TooltipProvider>
          <ExerciseLayout
            title={plan.title}
            actions={
              <Button
                variant='ghost'
                size='sm'
                onClick={onFinish}
                className='radius-premium border border-white/5 bg-zinc-900/50 px-4 text-xs font-medium text-zinc-400 backdrop-blur-md transition-background click-behavior hover:border-white/20 hover:bg-white/10 hover:text-white'>
                {t("common:finish")}
              </Button>
            }
            showBreadcrumbs={false}
            className="border-b border-white/5 bg-zinc-950/20 backdrop-blur-md sticky top-0 z-50">
            
            <div className='mx-auto max-w-6xl px-6 pb-64 pt-4 relative z-10'>
              
               {/* 1. Progress Bar (Top) */}
               <div className="mb-12">
                   <ExerciseProgress
                        plan={plan}
                        currentExerciseIndex={currentExerciseIndex}
                        formattedTimeLeft={formattedTimeLeft}
                   />
               </div>

               {/* 2. Hero Section (Image & Title) - "Zen Focus" */}
               <div className="mb-12 mt-8 flex flex-col items-center justify-center text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 mb-4 backdrop-blur-sm">
                        <div className={cn("h-1.5 w-1.5 rounded-full", 
                           category === "technique" && "bg-blue-400",
                           category === "theory" && "bg-emerald-400",
                           category === "creativity" && "bg-purple-400",
                           category === "hearing" && "bg-orange-400",
                           category === "mixed" && "bg-cyan-400"
                        )} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                            {category}
                        </span>
                    </div>
                    <h2 className="mb-8 text-4xl font-bold text-white tracking-tight sm:text-5xl">
                        {currentExercise.title[currentLang]}
                    </h2>
                    
                    {/* Score/Tab Image - Centered and Large */}
                    <div className="relative w-full overflow-hidden radius-premium border border-white/10 bg-zinc-900 shadow-2xl glass-card">
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
                             <div className="radius-premium border border-white/5 bg-zinc-900/30 px-4 glass-card">
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
                                            <p className="text-zinc-500 italic">{t("exercises:no_instructions")}</p>
                                        )}
                                     </ul>
                                </AccordionContent>
                             </div>
                        </AccordionItem>

                         <AccordionItem value="tips" className="border-b-0">
                            <div className="radius-premium border border-amber-500/20 bg-amber-500/5 px-4 glass-card">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-3 text-amber-500/80">
                                        <FaLightbulb />
                                        <span>{t("exercises:hints")}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 pt-2 text-zinc-300 leading-relaxed">
                                    <ul className="list-inside list-disc space-y-2">
                                        {currentExercise.tips?.length > 0 && (
                                            currentExercise.tips.map((tip, idx) => (
                                                <li key={idx} className="marker:text-amber-500/50">
                                                    {tip[currentLang] || tip.pl}
                                                </li>
                                            ))
                                        )}
                                     </ul>
                                </AccordionContent>
                            </div>
                        </AccordionItem>
                    </Accordion>
               </div>

                {/* 4. Unified Control Deck (Full Width Sticky Footer) */}
               <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-50 border-t border-white/5 bg-zinc-950/60 backdrop-blur-3xl">
                    <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-8">
                         
                         {/* Left: Tools (Metronome) */}
                         <div className="flex-1 hidden xl:flex items-center justify-start">
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

                         {/* Center: Timer & Playback Controls Group */}
                         <div className="flex-none flex justify-center">
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
                                showExerciseInfo={false}
                                variant="compact"
                            />
                         </div>

                         {/* Right: Main Action Button */}
                         <div className="flex-1 flex justify-end items-center">
                            <Button
                                size="lg"
                                className={cn(
                                "h-14 min-w-[200px] px-8 radius-premium font-black text-xs tracking-[0.2em] transition-all click-behavior uppercase",
                                isLastExercise 
                                    ? "bg-cyan-500 text-black shadow-xl shadow-cyan-500/20 hover:bg-cyan-400" 
                                    : "bg-white text-black shadow-xl shadow-white/10 hover:bg-zinc-200"
                                )}
                                onClick={() => handleNextExercise(resetTimer)}
                            >
                                {isLastExercise ? (
                                    <span className="flex items-center gap-2">{t("common:finish_session")} <FaCheck /></span>
                                ) : (
                                    <span className="flex items-center gap-2">{t("common:next_step")} <FaStepForward /></span>
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
