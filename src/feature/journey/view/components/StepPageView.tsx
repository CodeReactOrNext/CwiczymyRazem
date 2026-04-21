import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X, CheckCircle2, Play, AlertTriangle, Lightbulb, Target, Lock,
  ArrowDown, ArrowUpDown, GitMerge, Timer, Link2,
  MoveHorizontal, Hand, SkipForward, TrendingUp,
  Zap, AudioWaveform, Layers,
  Music, Hammer, ChevronDown, LayoutGrid, Waves, SlidersHorizontal, Bug, ClipboardCheck,
  Square, SquareCheck, Guitar, GraduationCap, TableProperties,
  Footprints, Volume2, MessageSquare, Move, Eye, Minimize2, Ear, Users, Star, ChevronLeft,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";
import type { Song } from "feature/songs/types/songs.type";
import { getSongsByIds } from "../../services/journey.service";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import type { JourneyStepWithStatus, StepContentBlock } from "../../types/journey.types";

interface StepPageViewProps {
  step: JourneyStepWithStatus;
  moduleId: string;
  onBack: () => void;
  onComplete: (stepId: string) => Promise<void>;
  onStart: (stepId: string) => Promise<void>;
  isSaving: boolean;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  locked:        { label: "Locked",      cls: "text-zinc-500 bg-zinc-800 ring-zinc-700" },
  available:     { label: "Available",   cls: "text-cyan-400 bg-cyan-500/10 ring-cyan-500/30" },
  "in-progress": { label: "In Progress", cls: "text-amber-400 bg-amber-500/10 ring-amber-500/30" },
  completed:     { label: "Completed",   cls: "text-orange-400 bg-orange-500/10 ring-orange-500/30" },
};

const STAGE_HERO: Record<string, { glow: string; iconRing: string; iconText: string; tint: string }> = {
  stage_1: { glow: "rgba(249,115,22,0.4)",  iconRing: "ring-orange-500/40", iconText: "text-orange-400", tint: "rgba(249,115,22,0.18)" },
  stage_2: { glow: "rgba(245,158,11,0.4)",  iconRing: "ring-amber-500/40",   iconText: "text-amber-400",   tint: "rgba(245,158,11,0.18)" },
  stage_3: { glow: "rgba(6,182,212,0.4)",   iconRing: "ring-cyan-500/40",    iconText: "text-cyan-400",    tint: "rgba(6,182,212,0.18)" },
};

type IconSize = number;
const ICON_MAP: Record<string, (size: IconSize) => React.ReactNode> = {
  ArrowDown:        (s) => <ArrowDown size={s} />,
  ArrowUpDown:      (s) => <ArrowUpDown size={s} />,
  GitMerge:         (s) => <GitMerge size={s} />,
  Timer:            (s) => <Timer size={s} />,
  Link2:            (s) => <Link2 size={s} />,
  MoveHorizontal:   (s) => <MoveHorizontal size={s} />,
  Hand:             (s) => <Hand size={s} />,
  SkipForward:      (s) => <SkipForward size={s} />,
  TrendingUp:       (s) => <TrendingUp size={s} />,
  Zap:              (s) => <Zap size={s} />,
  AudioWaveform:    (s) => <AudioWaveform size={s} />,
  Layers:           (s) => <Layers size={s} />,
  Music:            (s) => <Music size={s} />,
  Hammer:           (s) => <Hammer size={s} />,
  ChevronDown:      (s) => <ChevronDown size={s} />,
  LayoutGrid:       (s) => <LayoutGrid size={s} />,
  Waves:            (s) => <Waves size={s} />,
  SlidersHorizontal:(s) => <SlidersHorizontal size={s} />,
  Bug:              (s) => <Bug size={s} />,
  ClipboardCheck:   (s) => <ClipboardCheck size={s} />,
  Guitar:           (s) => <Guitar size={s} />,
  GraduationCap:    (s) => <GraduationCap size={s} />,
  TableProperties:  (s) => <TableProperties size={s} />,
  Lightbulb:        (s) => <Lightbulb size={s} />,
  Footprints:       (s) => <Footprints size={s} />,
  Volume2:          (s) => <Volume2 size={s} />,
  MessageSquare:    (s) => <MessageSquare size={s} />,
  Move:             (s) => <Move size={s} />,
  Eye:              (s) => <Eye size={s} />,
  Minimize2:        (s) => <Minimize2 size={s} />,
  Ear:              (s) => <Ear size={s} />,
  Users:            (s) => <Users size={s} />,
};

function ContentBlocks({ blocks }: { blocks: StepContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        if (block.type === "image") {
          return (
            <div key={i} className="my-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: '21/9' }}>
                {block.url && (
                  <Image src={block.url} alt={block.caption || ""} fill className="object-cover" />
                )}
              </div>
              {block.caption && (
                <p className="px-6 py-4 text-center text-sm text-zinc-500 border-t border-zinc-800/60 bg-zinc-900/50">
                  {block.caption}
                </p>
              )}
            </div>
          );
        }
        if (block.type === "callout") {
          return (
            <div
              key={i}
              className="rounded-2xl border border-zinc-700/40 bg-zinc-900/30 p-6 space-y-3 shadow-sm"
            >
              {block.label && (
                <div className="flex items-center gap-3">
                  {block.icon && ICON_MAP[block.icon] && (
                    <span className="text-cyan-400">
                      {ICON_MAP[block.icon](20)}
                    </span>
                  )}
                  <p className="text-lg font-bold text-zinc-100">{block.label}</p>
                </div>
              )}
              <p className="text-base leading-relaxed text-zinc-400">{block.body}</p>
            </div>
          );
        }
        return (
          <p key={i} className="text-lg leading-relaxed text-zinc-300 font-medium">{block.body}</p>
        );
      })}
    </div>
  );
}

function ChecklistSection({
  items,
  checked,
  onToggle,
}: {
  items: Array<{ text: string; icon?: string }>;
  checked: boolean[];
  onToggle: (i: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h3 className="text-xl font-black text-white">Check your knowledge</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Be honest with yourself. Tick each skill only if you're sure you've mastered it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className={`group flex w-full items-center gap-4 rounded-2xl border px-6 py-5 text-left transition-all duration-200 ${
                checked[i] 
                  ? "border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.05)]" 
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
            }`}
          >
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                checked[i] ? "bg-cyan-500 text-zinc-950 scale-110" : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700"
            }`}>
              {checked[i] ? <SquareCheck size={24} /> : <Square size={24} />}
            </div>
            
            <div className="flex-1">
                <span className={`text-base font-bold transition-colors ${checked[i] ? "text-white" : "text-zinc-400 group-hover:text-zinc-300"}`}>
                  {item.text}
                </span>
            </div>

            {item.icon && ICON_MAP[item.icon] && (
              <span className={`flex-shrink-0 transition-all ${checked[i] ? "text-cyan-400 scale-110" : "text-zinc-600 opacity-50"}`}>
                {ICON_MAP[item.icon](22)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function SongPickerSection({
  songs,
  loading,
  selectedId,
  onSelect,
}: {
  songs: Song[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-6 mt-12 bg-zinc-900/30 rounded-3xl p-8 border border-zinc-800/60">
      <div>
        <h3 className="text-xl font-black text-white uppercase tracking-tight">Choose your target song</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          This song will be added to your library as your first learning goal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {loading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl animate-pulse bg-zinc-800/50" />
            ))
          : songs.map((song) => {
              const isSelected = selectedId === song.id;
              return (
                <button
                  key={song.id}
                  onClick={() => onSelect(song.id)}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                    isSelected
                      ? "border-white bg-zinc-800 shadow-2xl scale-[1.02]"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-500 hover:bg-zinc-900"
                  }`}
                >
                  <div className="relative aspect-square w-full bg-zinc-800">
                    {song.coverUrl ? (
                      <Image src={song.coverUrl} alt={song.title} fill className={`object-cover transition-transform duration-700 ${isSelected ? "scale-105" : "group-hover:scale-110"}`} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Music size={32} className="text-zinc-700" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-[2px]">
                        <CheckCircle2 size={40} className="text-white drop-shadow-2xl" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className={`truncate text-sm font-black transition-colors ${isSelected ? "text-white" : "text-zinc-200"}`}>
                      {song.title}
                    </p>
                    <p className="truncate text-xs text-zinc-500 mt-0.5">{song.artist}</p>
                  </div>
                </button>
              );
            })}
      </div>
    </div>
  );
}

export const StepPageView: React.FC<StepPageViewProps> = ({
  step,
  moduleId,
  onBack,
  onComplete,
  onStart,
  isSaving,
}) => {
  const [checklistState, setChecklistState] = useState<boolean[]>(
    () => (step.checklist ?? []).map(() => false)
  );
  const [pickerSongs, setPickerSongs] = useState<Song[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const userId = useAppSelector(selectUserAuth);
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step.id]);

  const allChecked = step.checklist
    ? checklistState.every(Boolean)
    : true;

  const canComplete = allChecked && (step.songPicker ? selectedSongId !== null : true);

  useEffect(() => {
    if (!step.songPicker?.length) return;
    setPickerLoading(true);
    getSongsByIds(step.songPicker)
      .then(setPickerSongs)
      .catch(() => {})
      .finally(() => setPickerLoading(false));
  }, [step.songPicker]);

  const handleStartExercise = async () => {
    if (step.status === "available") await onStart(step.id);
    router.push({ pathname: `/practice/exercise/${step.suggestedExerciseId}`, query: { stepId: step.id, moduleId } });
  };

  const status = STATUS_CFG[step.status];
  const hero   = STAGE_HERO[step.stageId] ?? STAGE_HERO.stage_1;
  const isLocked    = step.status === "locked";
  const isCompleted = step.status === "completed";

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white selection:bg-cyan-500/30">
      {/* ── Header Area ── */}
      <div className="relative h-[40vh] min-h-[400px] w-full overflow-hidden">
        <Image
          src={step.image}
          alt={step.title}
          fill
          className="object-cover"
          style={{ filter: "brightness(0.3) saturate(1.2)" }}
          priority
        />
        <div 
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, transparent 0%, rgba(9,9,11,0.8) 70%, rgb(9,9,11) 100%)` }}
        />
        
        {/* Top Nav */}
        <div className="absolute top-0 inset-x-0 p-6 md:p-8 flex items-center justify-between z-10">
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-sm font-bold text-zinc-300 backdrop-blur-md transition hover:bg-black/60 hover:text-white ring-1 ring-white/10"
            >
              <ChevronLeft size={18} />
              Return to Module
            </button>
            
            <div className={`rounded-full px-4 py-1.5 text-xs font-black tracking-widest uppercase ring-1 ${status.cls}`}>
              {status.label}
            </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 inset-x-0 p-6 md:p-12 md:pb-16 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
                <div
                    className={`flex h-20 w-20 md:h-28 md:w-28 flex-shrink-0 items-center justify-center rounded-3xl bg-black/60 backdrop-blur-xl ring-2 ${hero.iconRing} ${hero.iconText}`}
                    style={{ boxShadow: `0 0 40px ${hero.glow}` }}
                >
                    {step.stepIcon && ICON_MAP[step.stepIcon] ? (
                        ICON_MAP[step.stepIcon](56)
                    ) : (
                        <Zap size={48} />
                    )}
                </div>
                <div className="flex-1 space-y-2">
                    <span className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs">Step {step.order}</span>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{step.title}</h1>
                    <p className="text-lg md:text-xl text-zinc-400 max-w-2xl font-medium leading-relaxed">{step.shortDescription}</p>
                </div>
            </div>
        </div>
      </div>

      {/* ── Content Grid ── */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
            
            {/* Left Column: Learning Content */}
            <div className="lg:col-span-7 space-y-12">
                {isLocked && (
                    <div className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                        <AlertTriangle className="text-amber-500" size={24} />
                        <p className="text-amber-200/80 font-medium">
                            This step is currently locked. Complete previous stages to unlock access.
                        </p>
                    </div>
                )}

                <div className="prose prose-invert max-w-none">
                    {step.contentBlocks && step.contentBlocks.length > 0 ? (
                        <ContentBlocks 
                          blocks={step.title === "Before You Begin" 
                            ? step.contentBlocks.filter(b => b.type !== "image") 
                            : step.contentBlocks
                          } 
                        />
                    ) : (
                        <p className="text-xl leading-relaxed text-zinc-300 font-medium">{step.fullDescription}</p>
                    )}
                </div>

                {step.songPicker && step.songPicker.length > 0 && (
                  <SongPickerSection
                    songs={pickerSongs}
                    loading={pickerLoading}
                    selectedId={selectedSongId}
                    onSelect={setSelectedSongId}
                  />
                )}
            </div>

            {/* Right Column: Actions & Checklist */}
            <div className="lg:col-span-5 space-y-10">
                
                {/* Secondary Sidebar Content */}
                <div className="sticky top-12 space-y-10">
                    
                    {/* Progress / CTA Card */}
                    <div className="rounded-3xl bg-zinc-900 p-8 border border-white/5 shadow-2xl space-y-8">
                        <div>
                            <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Your Progress</h3>
                            {isCompleted ? (
                                <div className="flex items-center gap-4 text-emerald-400">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-lg">Goal Reached</span>
                                        <div className="flex items-center gap-0.5 mt-1">
                                            {[1, 2, 3].map((n) => (
                                              <Star
                                                key={n}
                                                size={16}
                                                className={n <= (step.stars ?? 0) ? "text-amber-400 fill-amber-400" : "text-zinc-800"}
                                              />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-2xl font-black text-white">Keep going</span>
                                        <span className="text-sm font-bold text-zinc-500">{checklistState.filter(Boolean).length} / {checklistState.length} checked</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-cyan-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(checklistState.filter(Boolean).length / checklistState.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {step.modalOnly ? (
                              !isCompleted && (
                                <button
                                  onClick={async () => {
                                    if (isSaving || !canComplete) return;
                                    if (step.songPicker && selectedSongId && userId) {
                                      const song = pickerSongs.find((s) => s.id === selectedSongId);
                                      if (song) {
                                        await updateSongStatus(userId as string, selectedSongId, song.title, song.artist, "wantToLearn", undefined);
                                      }
                                    }
                                    onComplete(step.id);
                                  }}
                                  disabled={isLocked || isSaving || !canComplete}
                                  className="w-full h-16 flex items-center justify-center gap-3 rounded-2xl bg-white text-zinc-950 font-black text-lg transition hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  {isSaving ? "Saving..." : "Complete Step"}
                                  <ArrowUpDown size={20} />
                                </button>
                              )
                            ) : (
                              <div className="flex flex-col gap-3">
                                <button
                                  onClick={handleStartExercise}
                                  disabled={isLocked}
                                  className="w-full h-16 flex items-center justify-center gap-3 rounded-2xl bg-white text-zinc-950 font-black text-lg transition hover:bg-zinc-200 disabled:opacity-30"
                                >
                                  <Play size={20} fill="currentColor" />
                                  Start Practice
                                </button>
                                <button
                                  onClick={async () => {
                                    if (step.status === "available") await onStart(step.id);
                                    const bpm = step.examBpm ?? 60;
                                    router.push(`/practice/exercise/${step.suggestedExerciseId}?mode=exam&bpm=${bpm}&stepId=${step.id}&moduleId=${moduleId}`);
                                  }}
                                  disabled={isLocked}
                                  className="w-full h-16 flex items-center justify-center gap-3 rounded-2xl bg-amber-400 text-zinc-950 font-black text-lg transition hover:bg-amber-300 disabled:opacity-30"
                                >
                                  <Target size={20} />
                                  {isCompleted ? "Retake Exam" : "Start Exam"}
                                </button>
                              </div>
                            )}
                        </div>
                    </div>

                    {/* Checklist Card */}
                    {step.checklist && step.checklist.length > 0 && (
                        <div className="space-y-6">
                           <ChecklistSection
                                items={step.checklist}
                                checked={checklistState}
                                onToggle={(i) =>
                                  setChecklistState((prev) =>
                                    prev.map((v, idx) => (idx === i ? !v : v))
                                  )
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
      </main>
      
      {/* Footer push */}
      <div className="h-20" />
    </div>
  );
};
