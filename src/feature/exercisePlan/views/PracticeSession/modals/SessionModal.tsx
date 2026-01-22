import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { Metronome } from "feature/exercisePlan/components/Metronome/Metronome";
import { YouTubePlayalong } from "feature/exercisePlan/components/YouTubePlayalong";
import { ModalWrapper } from "feature/exercisePlan/views/PracticeSession/components/ModalWrapper";
import { SpotifyPlayer } from "feature/songs/components/SpotifyPlayer";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import Image from "next/image";
import { FaExpand } from "react-icons/fa";
import { FaExternalLinkAlt,FaFacebook, FaHeart, FaInfoCircle, FaInstagram, FaLightbulb, FaTwitter } from "react-icons/fa";

import { categoryGradients } from "../../../constants/categoryStyles";
import { MobileTimerDisplay } from "../components/MobileTimerDisplay";
import { NextExerciseCard } from "../components/NextExerciseCard";
import { SessionModalControls } from "../components/SessionModalControls";
import { SessionModalHeader } from "../components/SessionModalHeader";

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
  formattedTimeLeft: string;
  toggleTimer: () => void;
  handleNextExercise: () => void;
  sessionTimerData: any;
  exerciseTimeSpent: number;
  setVideoDuration: (duration: number) => void;
  setTimerTime: (time: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  isFinishing?: boolean;
  isSubmittingReport?: boolean;
  canSkipExercise?: boolean;
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
  formattedTimeLeft,
  toggleTimer,
  handleNextExercise,
  sessionTimerData,
  exerciseTimeSpent,
  setVideoDuration,
  setTimerTime,
  startTimer,
  stopTimer,
  isFinishing,
  isSubmittingReport,
  canSkipExercise
}: SessionModalProps) => {
  if (!isOpen || !isMounted) return null;

  const { t } = useTranslation(["exercises", "common"]);

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
            className={cn(
              "flex h-full flex-col overflow-hidden",
              gradientClasses
            )}>
            <SessionModalHeader
              exerciseTitle={currentExercise.title}
              currentExerciseIndex={currentExerciseIndex}
              totalExercises={totalExercises}
              onClose={onClose}
            />

            <div className='flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-background/10 to-background/5 pb-[76px]'>
              <div className='space-y-6 p-4'>
                {currentExercise.youtubeVideoId ? (
                   <div className="w-full radius-premium overflow-hidden shadow-2xl bg-zinc-900 border border-white/10">
                      <YouTubePlayalong
                          videoId={currentExercise.youtubeVideoId}
                          isPlaying={isPlaying}
                          onEnd={handleNextExercise}
                          onReady={(duration: number) => setVideoDuration(duration)}
                          onSeek={(time: number) => setTimerTime(time * 1000)}
                          onStateChange={(state: number) => {
                            if (state === 1) startTimer();
                            if (state === 2) stopTimer();
                          }}
                      />
                   </div>
                ) : currentExercise.videoUrl ? (
                  <div className='relative w-full overflow-hidden rounded-xl border border-muted/30 bg-zinc-900 shadow-md transition-all duration-200'>
                    <div className='aspect-video w-full'>
                      {(() => {
                        const regExp =
                          /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                        const match = currentExercise.videoUrl?.match(regExp);
                        const videoId =
                          match && match[2].length === 11 ? match[2] : null;

                        if (videoId) {
                          return (
                            <iframe
                              width='100%'
                              height='100%'
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title='YouTube video player'
                              frameBorder='0'
                              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                              allowFullScreen
                            />
                          );
                        }
                        return (
                          <div className='flex h-full items-center justify-center text-xs text-zinc-500'>
                            Invalid YouTube URL
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (currentExercise.imageUrl || currentExercise.image) && (
                  <div
                    className='relative mb-4 w-full cursor-pointer overflow-hidden rounded-xl border border-muted/30 bg-white/5 shadow-md backdrop-blur-[1px] transition-all duration-200 hover:shadow-lg'
                    onClick={onImageClick}>
                    <div className='relative aspect-[3.5/1] w-full'>
                      <Image
                        src={currentExercise.imageUrl || currentExercise.image}
                        alt={currentExercise.title}
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

                {currentExercise.spotifyId && (
                  <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <SpotifyPlayer trackId={currentExercise.spotifyId} height={80} />
                    <div className="mt-2 flex items-center gap-2 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] text-zinc-400 font-semibold italic">
                            For full tracks, log in to <a href="https://www.spotify.com" target="_blank" className="text-emerald-500 underline decoration-emerald-500/20">Spotify.com</a>
                        </p>
                    </div>
                  </div>
                )}

                  <MobileTimerDisplay
                    formattedTimeLeft={formattedTimeLeft}
                    isPlaying={isPlaying}
                    sessionTimerData={sessionTimerData}
                    exerciseTimeSpent={exerciseTimeSpent}
                  />

                <Accordion type="single" collapsible defaultValue="instructions" className="w-full space-y-3">
                    <AccordionItem value="instructions" className="border-none radius-premium overflow-hidden bg-zinc-900/40 border border-white/5">
                        <AccordionTrigger className="px-4 py-3 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                                    <FaInfoCircle className="h-4 w-4" />
                                </div>
                                <span className="font-bold tracking-wide text-sm text-zinc-200 group-hover:text-white">{t("exercises:instructions")}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-1">
                                <div className={cn(
                                "prose prose-invert max-w-none prose-p:text-sm prose-p:text-zinc-400 prose-p:leading-relaxed",
                                )}>
                                {currentExercise.instructions.map((instruction: string, idx: number) => (
                                    <p key={idx} className="mb-2 last:mb-0">
                                        {instruction}
                                    </p>
                                ))}
                                </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="tips" className="border-none radius-premium overflow-hidden bg-zinc-900/40 border border-white/5">
                        <AccordionTrigger className="px-4 py-3 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                    <FaLightbulb className="h-4 w-4" />
                                </div>
                                <span className="font-bold tracking-wide text-sm text-zinc-200 group-hover:text-white">{t("exercises:hints")}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-1">
                                <ul className="list-inside list-disc space-y-1.5 text-sm text-zinc-400 marker:text-amber-500/50">
                                {currentExercise.tips?.length > 0 && (
                                    currentExercise.tips.map((tip: string, idx: number) => (
                                        <li key={idx}>
                                            {tip}
                                        </li>
                                    ))
                                )}
                                </ul>
                        </AccordionContent>
                    </AccordionItem>
                 </Accordion>

                {nextExercise && (
                  <NextExerciseCard
                    nextExercise={nextExercise}
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

                {currentExercise.links && currentExercise.links.length > 0 && (
                     <div className="radius-premium bg-gradient-to-br from-red-500/10 to-zinc-900/40 border border-red-500/20 p-5 backdrop-blur-sm space-y-4 mb-20">
                         <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest">
                             <FaHeart className="animate-pulse" />
                             <span>Support Author</span>
                         </div>
                         <div className="flex flex-col gap-2">
                             {currentExercise.links.map((link: any, idx: number) => {
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

            <SessionModalControls
              isPlaying={isPlaying}
              isLastExercise={isLastExercise}
              onClose={onClose}
              onFinish={onFinish}
              toggleTimer={toggleTimer}
              handleNextExercise={handleNextExercise}
              isFinishing={isFinishing}
              isSubmittingReport={isSubmittingReport}
              canSkipExercise={canSkipExercise}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
};

export default SessionModal;
