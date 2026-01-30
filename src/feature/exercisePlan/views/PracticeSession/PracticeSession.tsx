import "react-circular-progressbar/dist/styles.css";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { Button } from "assets/components/ui/button";
import { TooltipProvider } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExerciseLayout } from "feature/exercisePlan/components/ExerciseLayout";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import RatingPopUp from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import { Timer } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { FaCheck, FaExternalLinkAlt, FaFacebook, FaHeart, FaInfoCircle, FaInstagram, FaLightbulb, FaStepForward, FaTwitter, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { GiGuitar } from "react-icons/gi";

import { ExerciseCompleteDialog } from "../../components/ExerciseCompleteDialog";
import { Metronome } from "../../components/Metronome/Metronome";
import { YouTubePlayalong } from "../../components/YouTubePlayalong";
import type {
  ExercisePlan,
} from "../../types/exercise.types";
import { ExerciseImage } from "./components/ExerciseImage";
import { ExerciseProgress } from "./components/ExerciseProgress";
import { ExerciseSuccessView } from "./components/ExerciseSuccessView";
import { MainTimerSection } from "./components/MainTimerSection";
import { useImageHandling } from "./hooks/useImageHandling";
import { usePracticeSessionState } from "./hooks/usePracticeSessionState";
import ImageModal from "./modals/ImageModal";
import SessionModal from "./modals/SessionModal";

import { useDeviceMetronome } from "../../components/Metronome/hooks/useDeviceMetronome";
import { TablatureViewer } from "./components/TablatureViewer";
import { useTablatureAudio } from "../../hooks/useTablatureAudio";

interface PracticeSessionProps {
  plan: ExercisePlan;
  onFinish: () => void;
  isFinishing?: boolean;
  autoReport?: boolean;
}

export const PracticeSession = ({ plan, onFinish, isFinishing, autoReport }: PracticeSessionProps) => {
  const { t } = useTranslation(["exercises", "common"]);
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
    stopTimer,
    resetTimer,
    showSuccessView,
    resetSuccessView,
    setVideoDuration,
    setTimerTime,
    autoSubmitReport,
    isSubmittingReport,
    reportResult,
    currentUserStats,
    previousUserStats,
    planTitleString,
    sessionTimerData,
    exerciseTimeSpent,
    activityDataToUse,
    jumpToExercise,
    canSkipExercise
  } = usePracticeSessionState({ plan, onFinish, autoReport });

  const [isAudioMuted, setIsAudioMuted] = useState(true);

  // Metronome State
  const metronome = useDeviceMetronome({
    initialBpm: currentExercise.metronomeSpeed?.recommended || 60,
    minBpm: currentExercise.metronomeSpeed?.min,
    maxBpm: currentExercise.metronomeSpeed?.max,
    recommendedBpm: currentExercise.metronomeSpeed?.recommended
  });

  // Audio Playback
  useTablatureAudio({
    measures: currentExercise.tablature,
    bpm: metronome.bpm,
    isPlaying: metronome.isPlaying && !!metronome.startTime,
    startTime: metronome.startTime || null,
    isMuted: isAudioMuted
  });

  const {
    imageScale,
    setImageScale,
    handleZoomIn,
    handleZoomOut,
    resetImagePosition,
  } = useImageHandling();

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if focus is in an input or similar (though not many here)
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.code === "Space") {
            e.preventDefault();
            return;
        }

        if (e.key === "ArrowRight") {
            if (!isLastExercise) {
                handleNextExerciseClick();
            } else {
                // optional: finish session
            }
        } 
        if (e.key === "ArrowLeft") {
            if (currentExerciseIndex > 0) {
                if (metronome.isPlaying) {
                  metronome.toggleMetronome();
                }
                jumpToExercise(currentExerciseIndex - 1);
            }
        }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLastExercise, currentExerciseIndex, handleNextExercise, jumpToExercise, resetTimer, metronome]);

  const category = currentExercise.category || "mixed";

  const handleToggleTimer = () => {
    if (currentExercise.tablature && currentExercise.metronomeSpeed) {
      toggleTimer(metronome.toggleMetronome);
    } else {
      toggleTimer();
    }
  };

  const handleBpmChange = (newBpm: number) => {
    if (isPlaying) {
      handleToggleTimer();
    }
    metronome.setBpm(newBpm);
  };

  const handleNextExerciseClick = () => {
    if (metronome.isPlaying) {
      metronome.toggleMetronome();
    }
    handleNextExercise(resetTimer);
  };

  return (
    <>
      <Head>
        <title>{formattedTimeLeft} | {currentExercise.title}</title>
      </Head>
      {isMobileView && reportResult && currentUserStats && previousUserStats && (
        <div className="fixed inset-0 z-[999999999] overflow-y-auto bg-zinc-950">
          <RatingPopUp 
            ratingData={reportResult}
            currentUserStats={currentUserStats}
            previousUserStats={previousUserStats}
            onClick={() => router.push("/dashboard")}
            activityData={activityDataToUse}
          />
        </div>
      )}



      {showSuccessView && !reportResult && (
        <ExerciseSuccessView
          planTitle={planTitleString}
          onFinish={autoSubmitReport}
          onRestart={() => {
            resetSuccessView();
            resetTimer();
            startTimer();
          }}
          isLoading={isFinishing}
        />
      )}

      {isMobileView && (
        <>
          <ImageModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            imageSrc={currentExercise.imageUrl || currentExercise.image || ""}
            imageAlt={currentExercise.title}
          />

          <SessionModal
            isOpen={isFullSessionModalOpen && !showCompleteDialog && !reportResult}
            onClose={() => router.push("/report")}
            onFinish={isLastExercise ? autoSubmitReport : onFinish}
            onImageClick={() => setIsImageModalOpen(true)}
            isMounted={isMounted}
            currentExercise={currentExercise}
            nextExercise={nextExercise}
            currentExerciseIndex={currentExerciseIndex}
            totalExercises={plan.exercises.length}
            isLastExercise={isLastExercise}
            isPlaying={isPlaying}
            formattedTimeLeft={formattedTimeLeft}
            toggleTimer={handleToggleTimer}
            handleNextExercise={handleNextExerciseClick}
            sessionTimerData={sessionTimerData}
            exerciseTimeSpent={exerciseTimeSpent}
            setVideoDuration={setVideoDuration}
            setTimerTime={setTimerTime}
            startTimer={startTimer}
            stopTimer={stopTimer}
            isFinishing={isFinishing}
            isSubmittingReport={isSubmittingReport}
            canSkipExercise={canSkipExercise}
          />
        </>
      )}

      <div
        className={cn("font-openSans min-h-screen bg-zinc-950 relative overflow-hidden", isMobileView && "hidden")}>
        
        {/* Background Ambiance Glows */}
        {!reportResult && (
          <>
            <div className={cn(
              "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-all duration-1000",
              category === "technique" && "bg-blue-500",
              category === "theory" && "bg-emerald-500",
              category === "creativity" && "bg-purple-500",
              category === "hearing" && "bg-orange-500",
              category === "mixed" && "bg-cyan-500",
              currentExercise.isPlayalong && "bg-red-600 opacity-30 blur-[150px]"
            )} />
            <div className={cn(
              "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 transition-all duration-1000",
              category === "technique" && "bg-indigo-500",
              category === "theory" && "bg-green-500",
              category === "creativity" && "bg-pink-500",
              category === "hearing" && "bg-amber-500",
              category === "mixed" && "bg-blue-500"
            )} />
          </>
        )}

        <TooltipProvider>
          <ExerciseLayout
            title={reportResult ? "Practice Summary" : plan.title}
            showBreadcrumbs={false}
            className="border-b border-white/5 bg-zinc-950/20 backdrop-blur-md sticky top-0 z-50">
            
            <div className={cn(
              'mx-auto max-w-6xl px-6 pb-64 pt-4 relative z-10',
              reportResult && "max-w-7xl px-4 pt-8"
            )}>
              
               {reportResult && currentUserStats && previousUserStats ? (
                  <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                      <RatingPopUp 
                          ratingData={reportResult}
                          currentUserStats={currentUserStats}
                          previousUserStats={previousUserStats}
                          onClick={() => router.push("/dashboard")}
                          activityData={activityDataToUse}
                          hideWrapper={true}
                      />
                  </div>
               ) : (
                <>
               {/* 1. Progress Bar (Top) */}
               <div className="mb-8">
                   <ExerciseProgress
                        plan={plan}
                        currentExerciseIndex={currentExerciseIndex}
                        formattedTimeLeft={formattedTimeLeft}
                        onExerciseSelect={jumpToExercise}
                   />
               </div>

               {/* 2. Hero Section (Image & Title) - "Zen Focus" */}
               <div className={cn(
                 "flex flex-col items-center justify-center text-center",
                 currentExercise.isPlayalong ? "mb-6 mt-0" : "mb-12 mt-8"
               )}>
                    <h2 className={cn(
                      "font-bold text-white tracking-tight flex flex-wrap items-center justify-center gap-3 mb-8",
                      currentExercise.isPlayalong ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"
                    )}>
                        {currentExercise.isPlayalong && (
                           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10 backdrop-blur-sm">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                                  Playalong
                              </span>
                           </div>
                        )}
                        {currentExercise.title}
                    </h2>

                    {/* Simple Challenge Banner */}
                    {(plan as any).streakDays && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 w-full max-w-2xl px-6 py-4 rounded-xl bg-main/10 border border-main/20 flex items-center justify-between"
                      >
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-main text-white">
                               <Timer size={20} />
                            </div>
                            <div>
                               <h3 className="text-lg font-bold text-white tracking-tight">
                                 Challenge: {typeof (plan as any).title === 'string' ? (plan as any).title : (plan as any).title}
                               </h3>
                               <p className="text-sm text-zinc-400 leading-relaxed">
                                 {typeof (plan as any).description === 'string' ? (plan as any).description : (plan as any).description}
                               </p>
                               <p className="text-xs text-main font-bold uppercase tracking-widest">
                                 Reward: {(plan as any).rewardDescription}
                               </p>
                            </div>
                         </div>
                         
                         <div className="flex gap-1.5">
                            {Array.from({ length: (plan as any).streakDays }).map((_, i) => (
                               <div key={i} className="h-1.5 w-6 rounded-full bg-main/20 border border-main/10" />
                            ))}
                         </div>
                      </motion.div>
                    )}
                    
                    <div className={cn(
                      "relative w-full overflow-hidden radius-premium bg-zinc-900 shadow-2xl",
                      currentExercise.isPlayalong ? "" : "border border-white/10 glass-card"
                    )}>
                         {currentExercise.tablature && currentExercise.tablature.length > 0 ? (
                           <TablatureViewer
                              measures={currentExercise.tablature}
                              bpm={metronome.bpm}
                              isPlaying={metronome.isPlaying}
                              startTime={metronome.startTime || null}
                              countInRemaining={(metronome as any).countInRemaining}
                              className="w-full"
                           />
                         ) : currentExercise.isPlayalong && currentExercise.youtubeVideoId ? (
                             !isMobileView && (
                                <YouTubePlayalong
                                    videoId={currentExercise.youtubeVideoId}
                                    isPlaying={isPlaying}
                                    onEnd={handleNextExerciseClick}
                                    onReady={(duration) => setVideoDuration(duration)}
                                    onSeek={(time) => setTimerTime(time * 1000)}
                                    onStateChange={(state) => {
                                        if (state === 1) startTimer();
                                        if (state === 2) stopTimer();
                                    }}
                                />
                             )
                         ) : currentExercise.videoUrl ? (
                            <div className="aspect-video w-full">
                                {(() => {
                                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&?]*).*/;
                                    const match = currentExercise.videoUrl?.match(regExp);
                                    const videoId = (match && match[2].length === 11) ? match[2] : null;

                                    if (videoId) {
                                        return (
                                            <iframe
                                                className="h-full w-full"
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        );
                                    }
                                    return <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-500">Video not available</div>;
                                })()}
                            </div>
                         ) : (
                            <ExerciseImage 
                                image={currentExercise.imageUrl || currentExercise.image || ""} 
                                title={currentExercise.title} 
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                     <div className="lg:col-span-8 space-y-8">
                         <Accordion type="single" collapsible defaultValue={currentExercise.instructions?.length > 0 ? "instructions" : (currentExercise.tips?.length > 0 ? "tips" : undefined)} className="w-full space-y-4">
                            {currentExercise.instructions && currentExercise.instructions.length > 0 && (
                                <AccordionItem value="instructions" className="border-none radius-premium overflow-hidden bg-zinc-900/40 border border-white/5">
                                    <AccordionTrigger className="px-6 py-4 hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                                                <FaInfoCircle />
                                            </div>
                                            <span className="font-bold tracking-wide">{t("exercises:instructions")}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 pt-2">
                                         <div className={cn(
                                           "prose prose-invert max-w-none",
                                           currentExercise.isPlayalong ? "text-sm leading-relaxed opacity-70" : ""
                                         )}>
                                            {currentExercise.instructions.map((instruction, idx) => (
                                                <p key={idx} className="mb-4 last:mb-0">
                                                    {instruction}
                                                </p>
                                            ))}
                                         </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}

                            {currentExercise.tips && currentExercise.tips.length > 0 && (
                                <AccordionItem value="tips" className="border-none radius-premium overflow-hidden bg-zinc-900/40 border border-white/5">
                                    <AccordionTrigger className="px-6 py-4 hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                                <FaLightbulb />
                                            </div>
                                            <span className="font-bold tracking-wide">{t("exercises:hints")}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 pt-2">
                                         <ul className={cn(
                                           "list-inside list-disc",
                                           currentExercise.isPlayalong ? "space-y-1 text-sm" : "space-y-2"
                                         )}>
                                            {currentExercise.tips.map((tip, idx) => (
                                                <li key={idx} className="marker:text-amber-500/50">
                                                    {tip}
                                                </li>
                                            ))}
                                         </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                         </Accordion>
                     </div>

                     <div className="lg:col-span-4 space-y-6">
                        {currentExercise.metronomeSpeed && (
                             <div className="radius-premium bg-zinc-900/40 border border-white/5 p-6 backdrop-blur-sm">
                                 <Metronome
                                     initialBpm={currentExercise.metronomeSpeed.recommended}
                                     minBpm={currentExercise.metronomeSpeed.min}
                                     maxBpm={currentExercise.metronomeSpeed.max}
                                     recommendedBpm={currentExercise.metronomeSpeed.recommended}
                                     bpm={metronome.bpm}
                                     isPlaying={metronome.isPlaying}
                                     onBpmChange={handleBpmChange}
                                     onToggle={metronome.toggleMetronome}
                                     startTime={metronome.startTime}
                                 />
                                  <div className="mt-4 flex justify-center">
                                      <Button
                                          variant="ghost"
                                          size="sm"
                                          className={cn(
                                              "gap-2 text-xs font-bold uppercase tracking-widest transition-all",
                                              isAudioMuted ? "text-zinc-500 hover:text-zinc-400" : "text-cyan-400 hover:text-cyan-300 bg-cyan-500/10"
                                          )}
                                          onClick={() => setIsAudioMuted(!isAudioMuted)}
                                      >
                                          <GiGuitar className="text-base" />
                                          {isAudioMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                                          {isAudioMuted ? "Guitar Off" : "Guitar On"}
                                      </Button>
                                 </div>
                             </div>
                        )}
                        
                        {currentExercise.links && currentExercise.links.length > 0 && (
                            <div className="radius-premium bg-gradient-to-br from-red-500/10 to-zinc-900/40 border border-red-500/20 p-6 backdrop-blur-sm space-y-4">
                                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
                                    <FaHeart className="animate-pulse" />
                                    <span>Support Author</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {currentExercise.links.map((link, idx) => {
                                        let Icon = FaExternalLinkAlt;
                                        if (link.url.includes("facebook")) Icon = FaFacebook;
                                        if (link.url.includes("instagram")) Icon = FaInstagram;
                                        if (link.url.includes("twitter") || link.url.includes("x.com")) Icon = FaTwitter;
                                        if (link.url.includes("patreon")) Icon = FaHeart;

                                        return (
                                            <a 
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between group px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className={cn(
                                                        "h-4 w-4",
                                                        link.url.includes("patreon") ? "text-red-500" : "text-zinc-400 group-hover:text-white"
                                                    )} />
                                                    <span className="text-zinc-300 group-hover:text-white font-medium">{link.label}</span>
                                                </div>
                                                <FaExternalLinkAlt className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                     </div>
                </div>

                {!reportResult && (
                <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-50 border-t border-white/5 bg-zinc-950/60 backdrop-blur-3xl">
                     <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-8">
                          <div className="flex-1 hidden xl:flex items-center justify-start gap-4">
                          </div>

                          <div className="flex-none flex justify-center">
                             <MainTimerSection
                                 exerciseKey={exerciseKey}
                                 currentExercise={currentExercise}
                                 isLastExercise={isLastExercise}
                                 isPlaying={isPlaying}
                                 timerProgressValue={timerProgressValue}
                                 formattedTimeLeft={formattedTimeLeft}
                                 toggleTimer={handleToggleTimer}
                                 handleNextExercise={handleNextExerciseClick}
                                 showExerciseInfo={false}
                                 variant="compact"
                                 sessionTimerData={sessionTimerData}
                                 exerciseTimeSpent={exerciseTimeSpent}
                                 canSkipExercise={canSkipExercise}
                             />
                          </div>

                          <div className="flex-1 flex justify-end items-center">
                             <Button
                                 size="lg"
                                 loading={isFinishing || isSubmittingReport}
                                 className={cn(
                                 "h-14 min-w-[200px] px-8 radius-premium font-black text-xs tracking-[0.2em] transition-all click-behavior uppercase",
                                 isLastExercise 
                                     ? "bg-cyan-500 text-black shadow-xl shadow-cyan-500/20 hover:bg-cyan-400" 
                                     : "bg-white text-black shadow-xl shadow-white/10 hover:bg-zinc-200",
                                 !canSkipExercise && "opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500 hover:bg-zinc-800 shadow-none border border-white/5"
                                 )}
                                 onClick={() => {
                                  if (isLastExercise) {
                                    autoSubmitReport();
                                  } else {
                                    handleNextExerciseClick();
                                  }
                                }}
                                disabled={!canSkipExercise}
                             >
                                 {(isFinishing || isSubmittingReport) ? (
                                     <span>Saving...</span>
                                 ) : isLastExercise ? (
                                     <span className="flex items-center gap-2">{t("common:finish_session")} <FaCheck /></span>
                                 ) : (
                                     <span className="flex items-center gap-2">{t("common:next_step")} <FaStepForward /></span>
                                 )}
                             </Button>
                          </div>
                     </div>
                </div>
                )}
                </>
                )}
            </div>
          </ExerciseLayout>
        </TooltipProvider>
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
        exerciseTitle={currentExercise.title}
        duration={currentExercise.timeInMinutes}
      />
    </>
  );
};
