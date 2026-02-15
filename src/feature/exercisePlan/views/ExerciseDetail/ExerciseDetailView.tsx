import { useMemo, useEffect, useState } from "react";
import Head from "next/head";
import { Exercise } from "../../types/exercise.types";
import { TablatureViewer } from "../PracticeSession/components/TablatureViewer";
import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import {
  FaClock,
  FaArrowLeft,
  FaGuitar,
  FaLightbulb,
  FaPlay,
  FaCheckCircle,
  FaYoutube
} from "react-icons/fa";
import { Ear, Trophy } from "lucide-react";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import Link from "next/link";
import { BpmProgressOverview } from "../../components/BpmProgressOverview";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { getExerciseBpmProgress } from "../../services/bpmProgressService";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

interface ExerciseDetailViewProps {
  exercise: Exercise;
}

export const ExerciseDetailView = ({ exercise }: ExerciseDetailViewProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const userAuth = useAppSelector(selectUserAuth);
  const [earTrainingHighScore, setEarTrainingHighScore] = useState<number | null>(null);

  const skills = useMemo(() => {
    return exercise.relatedSkills
      .map((skillId) => guitarSkills.find((s) => s.id === skillId))
      .filter(Boolean);
  }, [exercise.relatedSkills]);

  useEffect(() => {
    if (!userAuth || exercise.riddleConfig?.mode !== 'sequenceRepeat') return;
    getExerciseBpmProgress(userAuth, exercise.id).then((data) => {
      setEarTrainingHighScore(data?.earTrainingHighScore ?? null);
    });
  }, [userAuth, exercise.id]);

  return (
    <div className="min-h-screen bg-[#020202] pb-20">
      <Head>
        <title>{`${exercise.title} | Interactive Guitar Exercise | Riff Quest`}</title>
        <meta name="description" content={`${exercise.description} Master this ${exercise.difficulty} guitar exercise with interactive tabs and tips.`} />
        <meta property="og:title" content={`${exercise.title} - Free Interactive Guitar Exercise`} />
        <meta property="og:description" content={exercise.description} />
        {exercise.imageUrl && <meta property="og:image" content={exercise.imageUrl} />}
        <link rel="canonical" href={`https://riff.quest/exercises/${exercise.id.replace(/_/g, "-")}`} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": exercise.title,
              "description": exercise.description,
              "step": exercise.instructions.map((inst, index) => ({
                "@type": "HowToStep",
                "position": index + 1,
                "text": inst
              })),
              "totalTime": `PT${exercise.timeInMinutes}M`,
              "tool": [{ "@type": "HowToTool", "name": "Guitar" }],
            })
          }}
        />
      </Head>

      {/* Hero Section */}
      <div className="relative border-b border-white/5 bg-zinc-950/50 pt-16 pb-12">
        <div className="container mx-auto px-4">
          <Link 
            href="/exercises" 
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition-colors hover:text-white"
          >
            <FaArrowLeft className="h-3 w-3" /> Back to Hub
          </Link>
          
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold capitalize">
                  {exercise.category}
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-zinc-900 text-zinc-400 text-[10px] font-bold capitalize">
                  {exercise.difficulty}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold italic tracking-tighter text-white sm:text-5xl">
                {exercise.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base text-zinc-400">
                {exercise.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
               <div className="flex items-center gap-6 rounded-lg border border-white/5 bg-zinc-900/50 p-6 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-zinc-500 mb-1">Duration</div>
                    <div className="flex items-center gap-2 text-xl font-bold text-white">
                        <FaClock className="h-4 w-4 text-cyan-500" />
                        {exercise.timeInMinutes} min
                    </div>
                  </div>
                  <div className="h-10 w-px bg-white/5" />
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-zinc-500 mb-1">Recommended BPM</div>
                    <div className="text-xl font-bold text-white">
                        {exercise.metronomeSpeed?.recommended || 80}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content: Tablature & Instructions */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Tablature Section */}
            <section>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-3 text-2xl font-bold italic text-white tracking-tight">
                  <FaGuitar className="text-cyan-500" /> Tablature preview
                </h2>
                <div className="flex items-center gap-2">
                   <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-500">
                     Viewing in Preview Mode
                   </div>
                </div>
              </div>
              
              <div className="mb-6 rounded-lg border border-white/5 bg-zinc-900/30 p-4 text-sm text-zinc-400">
                <p className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-400 font-bold italic">i</span>
                  This is a static preview. Interactive metronome, rhythm playback, and speed controls are available in the 
                  <button 
                    onClick={() => document.getElementById('practice-cta')?.scrollIntoView({ behavior: 'smooth' })}
                    className="mx-1 font-bold text-white italic underline hover:text-cyan-400 transition-colors"
                  >
                    Full Practice Mode
                  </button>.
                </p>
              </div>
              
              {exercise.tablature ? (
                <div className="rounded-lg border border-white/10 bg-zinc-950 p-2 shadow-2xl">
                  <TablatureViewer 
                    measures={exercise.tablature} 
                    bpm={exercise.metronomeSpeed?.recommended || 80}
                    isPlaying={false} 
                    startTime={null}
                    className="h-80 border-none bg-transparent opacity-80"
                  />
                </div>
              ) : exercise.imageUrl ? (
                <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950 p-8 shadow-2xl">
                  <img src={exercise.imageUrl} alt={exercise.title} className="w-full h-auto filter invert brightness-200 contrast-125" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-zinc-900/10 p-8 text-center text-zinc-500">
                  <div className="mb-3 rounded-full bg-zinc-900/50 p-4">
                    <FaGuitar className="h-8 w-8 text-zinc-800" />
                  </div>
                  <h4 className="text-base font-bold text-zinc-400">Interactive session only</h4>
                  <p className="mt-1 text-xs max-w-xs text-zinc-600">
                    This exercise is best learned through guided session.
                  </p>
                </div>
              )}
            </section>

            {/* Instructions Section */}
            <section className="grid gap-8 sm:grid-cols-2">
              <div className="rounded-lg border border-white/5 bg-zinc-900/20 p-8">
                <h3 className="mb-6 flex items-center gap-3 text-xl font-bold italic text-white">
                  <FaPlay className="h-4 w-4 text-emerald-500" /> How to practice
                </h3>
                <ul className="space-y-4">
                  {exercise.instructions.map((inst, idx) => (
                    <li key={idx} className="flex gap-4 text-zinc-400 text-sm leading-relaxed">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                        {idx + 1}
                      </span>
                      {inst}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-white/5 bg-zinc-900/20 p-8">
                <h3 className="mb-6 flex items-center gap-3 text-xl font-bold italic text-white">
                  <FaLightbulb className="h-4 w-4 text-amber-500" /> Pro Tips
                </h3>
                <ul className="space-y-4">
                  {exercise.tips.map((tip, idx) => (
                    <li key={idx} className="flex gap-4 text-zinc-400 text-sm leading-relaxed">
                      <FaCheckCircle className="mt-1 h-4 w-4 shrink-0 text-amber-500/50" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* Sidebar: Skills, Video, CTA */}
          <div className="space-y-8">
             {/* BPM Progress */}
             {exercise.metronomeSpeed && (
               <div className="rounded-lg border border-white/5 bg-zinc-900/50 p-8">
                 <BpmProgressOverview />
               </div>
             )}
             {/* Ear Training Record */}
             {exercise.riddleConfig?.mode === 'sequenceRepeat' && userAuth && (
               <div className="rounded-lg border border-purple-500/20 bg-purple-950/10 p-8">
                 <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-purple-400">
                   <Ear className="h-4 w-4" /> Ear Training Record
                 </h3>
                 {earTrainingHighScore != null && earTrainingHighScore > 0 ? (
                   <div className="flex items-center gap-3">
                     <Trophy className="h-5 w-5 text-purple-400" />
                     <span className="text-2xl font-black text-white">{earTrainingHighScore}</span>
                     <span className="text-xs text-zinc-500 font-bold">correct guesses</span>
                   </div>
                 ) : (
                   <p className="text-xs text-zinc-500">
                     No record yet. Start a practice session and guess the melodies!
                   </p>
                 )}
               </div>
             )}

             {/* Related Skills */}
             <div className="rounded-lg border border-white/5 bg-zinc-900/50 p-8">
                <h3 className="mb-6 text-sm font-bold text-zinc-500">Target Skills</h3>
                <div className="flex flex-col gap-2">
                   {skills.map(skill => skill && (
                     <div key={skill.id} className="flex items-center gap-3 rounded-lg bg-black/40 p-3 border border-white/5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-cyan-400">
                           {skill.icon && <skill.icon className="h-4 w-4" />}
                        </div>
                        <span className="font-bold text-zinc-300 text-sm">
                           {t(`common:skills.${skill.id}` as any)}
                        </span>
                     </div>
                   ))}
                </div>
             </div>

             {/* Video Embed if any */}
             {exercise.videoUrl && (
               <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
                  <div className="flex items-center gap-2 bg-red-600/10 px-6 py-3 text-red-500 border-b border-red-500/10">
                    <FaYoutube className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Video Lesson</span>
                  </div>
                  <div className="aspect-video bg-zinc-900">
                    {(() => {
                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                        const match = exercise.videoUrl.match(regExp);
                        const videoId = match && match[2].length === 11 ? match[2] : null;
                        return videoId ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${videoId}`}
                                frameBorder="0"
                                allowFullScreen
                            />
                        ) : null;
                    })()}
                  </div>
               </div>
             )}

             {/* Main CTA */}
             <div id="practice-cta" className="rounded-lg border border-white/10 bg-zinc-900/50 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500 blur-3xl rounded-full" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold italic text-white mb-4 leading-tight">Ready to practice?</h3>
                    <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                        Sign in to track your progress, save your best BPM, and compete on the leaderboard.
                    </p>
                    <Link 
                        href="/login" 
                        className="flex h-14 w-full items-center justify-center rounded-lg bg-white text-black font-bold transition-all hover:bg-zinc-100"
                    >
                        Practice this now
                    </Link>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
