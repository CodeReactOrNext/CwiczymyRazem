import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle2, Play, AlertTriangle, Lightbulb, Target, Lock,
  ArrowDown, ArrowUpDown, GitMerge, Timer, Link2,
  MoveHorizontal, Hand, SkipForward, TrendingUp,
  Zap, AudioWaveform, Layers,
  Music, Hammer, ChevronDown, LayoutGrid, Waves, SlidersHorizontal, Bug, ClipboardCheck,
  Square, SquareCheck, Guitar, GraduationCap, TableProperties,
  Footprints, Volume2, MessageSquare, Move, Eye, Minimize2, Ear, Users, Star,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";
import type { Song } from "feature/songs/types/songs.type";
import { getSongsByIds } from "../../services/journey.service";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import type { JourneyStepWithStatus, StepContentBlock } from "../../types/journey.types";

interface StepModalProps {
  step: JourneyStepWithStatus;
  moduleId: string;
  onClose: () => void;
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

const STEP_ICONS: Record<string, React.ReactNode> = Object.fromEntries(
  Object.entries(ICON_MAP).map(([k, fn]) => [k, fn(30)])
);

function ContentBlocks({ blocks }: { blocks: StepContentBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        if (block.type === "image") {
          return (
            <div key={i} className="my-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {block.url && (
                  <Image src={block.url} alt={block.caption || ""} fill className="object-cover" />
                )}
              </div>
              {block.caption && (
                <p className="px-4 py-3 text-center text-[13px] text-zinc-500 border-t border-zinc-800/60 bg-zinc-900/50">
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
              className="rounded-xl border border-zinc-700/60 bg-zinc-900/50 p-5 space-y-3 shadow-sm"
            >
              {block.label && (
                <div className="flex items-center gap-2.5">
                  {block.icon && ICON_MAP[block.icon] && (
                    <span className="text-cyan-400">
                      {ICON_MAP[block.icon](18)}
                    </span>
                  )}
                  <p className="text-[15px] font-bold text-zinc-200">{block.label}</p>
                </div>
              )}
              <p className="text-[15px] leading-relaxed text-zinc-300">{block.body}</p>
            </div>
          );
        }
        return (
          <p key={i} className="text-base leading-relaxed text-zinc-300">{block.body}</p>
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
    <div className="space-y-4 mt-8">
      <div className="pt-2">
        <p className="text-base font-bold text-zinc-200">Check your knowledge</p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-500">
          Tick each skill you already have. If you don't know something —
          do the research first and come back when you're ready.
        </p>
      </div>

      <div className="space-y-2.5">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className="flex w-full items-center gap-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 text-left transition hover:border-zinc-700 hover:bg-zinc-900/80"
          >
            {checked[i] ? (
              <SquareCheck size={20} className="flex-shrink-0 text-cyan-400" />
            ) : (
              <Square size={20} className="flex-shrink-0 text-zinc-600" />
            )}
            {item.icon && ICON_MAP[item.icon] && (
              <span className={`flex-shrink-0 transition-colors ${checked[i] ? "text-cyan-400" : "text-zinc-500"}`}>
                {ICON_MAP[item.icon](18)}
              </span>
            )}
            <span
              className={`text-[15px] font-medium transition-colors ${
                checked[i] ? "text-white" : "text-zinc-400"
              }`}
            >
              {item.text}
            </span>
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
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-zinc-300">Choose your first song</p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          Pick the one that excites you most — it will be added to your library.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-zinc-700" />
        <div className="absolute left-[16.67%] right-[16.67%] top-5 h-px bg-zinc-700" />
        <div className="absolute left-[16.67%] top-5 h-4 w-px bg-zinc-700" />
        <div className="absolute left-1/2 top-5 h-4 w-px -translate-x-1/2 bg-zinc-700" />
        <div className="absolute right-[16.67%] top-5 h-4 w-px bg-zinc-700" />

        <div className="grid grid-cols-3 gap-3 pt-9">
          {loading
            ? [0, 1, 2].map((i) => (
                <div key={i} className="h-44 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
              ))
            : songs.map((song) => {
                const isSelected = selectedId === song.id;
                return (
                  <button
                    key={song.id}
                    onClick={() => onSelect(song.id)}
                    className={`flex flex-col overflow-hidden rounded-xl border text-left transition ${
                      isSelected
                        ? "border-zinc-400 bg-zinc-800 shadow-lg shadow-black/40"
                        : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="relative h-24 w-full bg-zinc-800">
                      {song.coverUrl ? (
                        <Image src={song.coverUrl} alt={song.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music size={24} className="text-zinc-600" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <CheckCircle2 size={28} className="text-white drop-shadow" />
                        </div>
                      )}
                    </div>

                    <div className="px-3 py-2.5">
                      <p className={`truncate text-xs font-bold leading-tight transition-colors ${isSelected ? "text-white" : "text-zinc-300"}`}>
                        {song.title}
                      </p>
                      <p className="truncate text-[11px] text-zinc-500">{song.artist}</p>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}

export const StepModal: React.FC<StepModalProps> = ({
  step,
  moduleId,
  onClose,
  onComplete,
  onStart,
  isSaving,
}) => {
  const [mounted, setMounted] = useState(false);
const [checklistState, setChecklistState] = useState<boolean[]>(
    () => (step.checklist ?? []).map(() => false)
  );
  const [pickerSongs, setPickerSongs] = useState<Song[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const userId = useAppSelector(selectUserAuth);
  const router = useRouter();

  const allChecked = step.checklist
    ? checklistState.every(Boolean)
    : true;

  const canComplete = allChecked && (step.songPicker ? selectedSongId !== null : true);

  useEffect(() => {
    if (!step.songPicker?.length) return;
    setPickerLoading(true);
    getSongsByIds(step.songPicker)
      .then(setPickerSongs)
      .finally(() => setPickerLoading(false));
  }, [step.songPicker]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleStartExercise = async () => {
    if (step.status === "available") await onStart(step.id);
    router.push({ pathname: `/practice/exercise/${step.suggestedExerciseId}`, query: { stepId: step.id, moduleId } });
  };

  const status = STATUS_CFG[step.status];
  const hero   = STAGE_HERO[step.stageId] ?? STAGE_HERO.stage_1;
  const isLocked    = step.status === "locked";
  const isCompleted = step.status === "completed";

  const modal = (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-60 flex-shrink-0 overflow-hidden">
            <Image
              src={step.image}
              alt={step.title}
              fill
              className="object-cover"
              style={{ filter: "brightness(0.25) saturate(2) contrast(1.2)" }}
              priority
            />
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse at 25% 70%, ${hero.tint} 0%, transparent 65%)` }}
            />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-zinc-950 to-transparent" />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-xl bg-black/50 p-2 text-zinc-400 backdrop-blur-sm transition hover:bg-black/70 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 px-7 pb-6">
              <div
                className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-black/60 backdrop-blur-md ring-1 ${hero.iconRing} ${hero.iconText}`}
                style={{ boxShadow: `0 0 24px ${hero.glow}` }}
              >
                {STEP_ICONS[step.stepIcon] ?? <Zap size={30} />}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-[8px] px-2.5 py-0.5 text-[10px] font-bold tracking-wider ring-1 ${status.cls}`}>
                    {status.label}
                  </span>
                  <span className="text-[10px] text-zinc-600">Step {step.order}</span>
                </div>
                <h2 className="text-2xl font-black leading-tight text-white drop-shadow-lg">
                  {step.title}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-7 pt-5 pb-4">
              {isLocked ? (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                    <Lock size={15} className="text-zinc-500" />
                  </div>
                  <p className="text-sm text-zinc-500">
                    Complete the previous step to unlock this exercise.
                  </p>
                </div>
              ) : (
                <p className="text-[15px] leading-relaxed text-zinc-400">{step.shortDescription}</p>
              )}
            </div>




            <div className="px-7 py-5">
                  <div className="space-y-6">
                    {step.contentBlocks && step.contentBlocks.length > 0 ? (
                      <ContentBlocks 
                        blocks={step.title === "Before You Begin" 
                          ? step.contentBlocks.filter(b => b.type !== "image") 
                          : step.contentBlocks
                        } 
                      />
                    ) : (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                        <p className="text-sm leading-7 text-zinc-300">{step.fullDescription}</p>
                      </div>
                    )}

                    {step.checklist && step.checklist.length > 0 && (
                      <ChecklistSection
                        items={step.checklist}
                        checked={checklistState}
                        onToggle={(i) =>
                          setChecklistState((prev) =>
                            prev.map((v, idx) => (idx === i ? !v : v))
                          )
                        }
                      />
                    )}

                    {step.songPicker && step.songPicker.length > 0 && (
                      <SongPickerSection
                        songs={pickerSongs}
                        loading={pickerLoading}
                        selectedId={selectedSongId}
                        onSelect={setSelectedSongId}
                      />
                    )}
                  </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-950 px-7 py-4 space-y-3">
            {step.modalOnly ? (
              isCompleted ? (
                <div className="flex items-center justify-center gap-2 rounded-[8px] bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/20">
                  <CheckCircle2 size={15} />
                  Step completed
                </div>
              ) : (
                <>
                  {!canComplete && (
                    <p className="text-center text-xs text-zinc-600">
                      {!allChecked
                        ? "Tick all the boxes above to continue."
                        : "Pick a song above to continue."}
                    </p>
                  )}
                  <button
                    onClick={async () => {
                      if (isSaving || !canComplete) return;
                      if (step.songPicker && selectedSongId && userId) {
                        const song = pickerSongs.find((s) => s.id === selectedSongId);
                        if (song) {
                          await updateSongStatus(
                            userId as string,
                            selectedSongId,
                            song.title,
                            song.artist,
                            "wantToLearn",
                            undefined
                          );
                        }
                      }
                      onComplete(step.id);
                    }}
                    disabled={isLocked || isSaving || !canComplete}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition hover:border-orange-500/60 hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSaving ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-700 border-t-orange-300" />
                        Saving...
                      </>
                    ) : step.songPicker ? (
                      <>
                        <CheckCircle2 size={15} />
                        Add to my library &amp; complete
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        Yes, I have all of these — continue
                      </>
                    )}
                  </button>
                </>
              )
            ) : (
              <>
                <div className="flex justify-end gap-3">
                  {/* Practice */}
                  <button
                    onClick={handleStartExercise}
                    disabled={isLocked}
                    className="flex items-center justify-center gap-2.5 rounded-[8px] bg-white px-5 py-3 text-sm font-normal text-zinc-950 transition-all hover:bg-zinc-200 disabled:opacity-40"
                  >
                    <Play size={16} fill="currentColor" />
                    Practice
                  </button>

                  {/* Exam */}
                  <button
                    onClick={async () => {
                      if (step.status === "available") await onStart(step.id);
                      const bpm = step.examBpm ?? 60;
                      router.push(`/practice/exercise/${step.suggestedExerciseId}?mode=exam&bpm=${bpm}&stepId=${step.id}&moduleId=${moduleId}`);
                    }}
                    disabled={isLocked}
                    className="flex items-center justify-center gap-2.5 rounded-[8px] bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-amber-300 disabled:opacity-40"
                  >
                    <Target size={16} />
                    {isCompleted ? "Retake Exam" : "Start Exam"}
                  </button>
                </div>

{isCompleted && (
                  <div className="flex items-center justify-center gap-3 rounded-[8px] bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/20">
                    <CheckCircle2 size={15} />
                    Step completed
                    {step.stars && (
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3].map((n) => (
                          <Star
                            key={n}
                            size={14}
                            className={n <= step.stars! ? "text-amber-400 fill-amber-400" : "text-zinc-600"}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
};
