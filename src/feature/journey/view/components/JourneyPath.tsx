import React, { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Check, Lock, Play, Target, ChevronLeft,
  ArrowDown, ArrowUpDown, GitMerge, Timer, Link2,
  MoveHorizontal, Hand, SkipForward, TrendingUp,
  Zap, AudioWaveform, Layers,
  Music, Hammer, ChevronDown, LayoutGrid, Waves, SlidersHorizontal, Bug, ClipboardCheck, Guitar,
} from "lucide-react";
import { FaStar } from "react-icons/fa";
import Image from "next/image";
import { useRouter } from "next/router";
import type { Song } from "feature/songs/types/songs.type";
import { getSongsByIds } from "../../services/journey.service";
import type { JourneyModuleWithStatus, JourneyStepWithStatus } from "../../types/journey.types";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, React.ReactNode> = {
  ArrowDown:        <ArrowDown size={18} />,
  ArrowUpDown:      <ArrowUpDown size={18} />,
  GitMerge:         <GitMerge size={18} />,
  Timer:            <Timer size={18} />,
  Link2:            <Link2 size={18} />,
  MoveHorizontal:   <MoveHorizontal size={18} />,
  Hand:             <Hand size={18} />,
  SkipForward:      <SkipForward size={18} />,
  TrendingUp:       <TrendingUp size={18} />,
  Zap:              <Zap size={18} />,
  AudioWaveform:    <AudioWaveform size={18} />,
  Layers:           <Layers size={18} />,
  Music:            <Music size={18} />,
  Hammer:           <Hammer size={18} />,
  ChevronDown:      <ChevronDown size={18} />,
  LayoutGrid:       <LayoutGrid size={18} />,
  Waves:            <Waves size={18} />,
  SlidersHorizontal:<SlidersHorizontal size={18} />,
  Bug:              <Bug size={18} />,
  ClipboardCheck:   <ClipboardCheck size={18} />,
  Guitar:           <Guitar size={18} />,
};

// Stage theme configs
const STAGE_THEME: Record<string, {
  iconBg: string;
  iconText: string;
  badgeBg: string;
  badgeText: string;
  glow: string;
  imgTint: string;
  cardFade: string;
  availableBorder: string;
}> = {
  stage_1: {
    iconBg: "bg-orange-500/15",
    iconText: "text-orange-400",
    badgeBg: "bg-orange-500/10 ring-orange-500/30",
    badgeText: "text-orange-400",
    glow: "0 0 28px rgba(249,115,22,0.25), 0 0 60px rgba(249,115,22,0.1)",
    imgTint: "bg-orange-900/30",
    cardFade: "from-zinc-900 via-zinc-900/90 to-zinc-900/20",
    availableBorder: "border-orange-500/40",
  },
  stage_2: {
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-400",
    badgeBg: "bg-amber-500/10 ring-amber-500/30",
    badgeText: "text-amber-400",
    glow: "0 0 28px rgba(245,158,11,0.25), 0 0 60px rgba(245,158,11,0.1)",
    imgTint: "bg-amber-900/30",
    cardFade: "from-zinc-900 via-zinc-900/90 to-zinc-900/20",
    availableBorder: "border-amber-500/40",
  },
  stage_3: {
    iconBg: "bg-cyan-500/15",
    iconText: "text-cyan-400",
    badgeBg: "bg-cyan-500/10 ring-cyan-500/30",
    badgeText: "text-cyan-400",
    glow: "0 0 28px rgba(6,182,212,0.25), 0 0 60px rgba(6,182,212,0.1)",
    imgTint: "bg-cyan-900/30",
    cardFade: "from-zinc-900 via-zinc-900/90 to-zinc-900/20",
    availableBorder: "border-cyan-500/40",
  },
};

// ─── Motion variants ───────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const stepVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};



// ─── StepNode ─────────────────────────────────────────────────────────────────

function StepNode({ step, onClick, isLast, moduleId }: {
  step: JourneyStepWithStatus;
  onClick: () => void;
  isLast: boolean;
  moduleId: string;
}) {
  const router = useRouter();
  const isLocked     = step.status === "locked";
  const isCompleted  = step.status === "completed";
  const isAvailable  = step.status === "available";
  const isInProgress = step.status === "in-progress";

  const theme  = STAGE_THEME[step.stageId] ?? STAGE_THEME.stage_1;
  const padNum = String(step.order).padStart(2, "0");

  const goToExercise = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/practice/exercise/${step.suggestedExerciseId}`);
  };

  const goToExam = (e: React.MouseEvent) => {
    e.stopPropagation();
    const bpm = step.examBpm ?? 60;
    router.push(`/practice/exercise/${step.suggestedExerciseId}?mode=exam&bpm=${bpm}&stepId=${step.id}&moduleId=${moduleId}`);
  };

  // 3D Tilt Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    mouseX.set(e.clientX - rect.left - centerX);
    mouseY.set(e.clientY - rect.top - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const rotateXSpring = useSpring(useTransform(mouseY, [-200, 200], [7, -7]), { damping: 20, stiffness: 150 });
  const rotateYSpring = useSpring(useTransform(mouseX, [-200, 200], [-7, 7]), { damping: 20, stiffness: 150 });

  return (
    <motion.div variants={stepVariants} className="flex w-full max-w-3xl flex-col items-center">
      {/* ── Card ── */}
      <motion.div
        whileHover={!isLocked ? { scale: 1.012 } : {}}
        className={`
          relative w-full overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-md
          ${isCompleted  ? "border-emerald-500/20 bg-zinc-900/40" : ""}
          ${isInProgress ? "border-white/10 bg-zinc-900/80" : ""}
          ${isAvailable  ? "border-white/10 bg-zinc-900/80" : ""}
          ${isLocked     ? "border-white/5 bg-zinc-900/20" : ""}
        `}
        style={(!isLocked && (isAvailable || isInProgress)) ? { boxShadow: `0 0 40px -10px rgba(${theme.glow.split(",")[0].split("(")[1]},0.2)` } : {}}
      >
        {/* Background image bleeding from right */}
        {step.title !== "Before You Begin" && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-3/5">
            <Image
              src={step.image} alt="" fill className="object-cover"
              style={{
                filter: isLocked
                  ? "brightness(0.12) saturate(0) blur(1px)"
                  : isCompleted
                  ? "brightness(0.2) saturate(0.5) contrast(0.9)"
                  : "brightness(0.35) saturate(1.8) contrast(1.1)",
              }}
            />
            {!isLocked && <div className={`absolute inset-0 ${isCompleted ? "bg-emerald-900/20" : theme.imgTint}`} />}
            <div className={`absolute inset-0 bg-gradient-to-r ${isCompleted ? "from-zinc-950 via-zinc-950/70 to-transparent" : theme.cardFade}`} />
          </div>
        )}

        {/* Watermark number */}
        <div
          className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none font-black leading-none tracking-tighter text-transparent"
          style={{ fontSize: "7rem", WebkitTextStroke: "1px rgba(255,255,255,0.08)" }}
        >
          {padNum}
        </div>

        {/* ── Top: clickable info area → opens modal ── */}
        <button
          onClick={onClick}
          disabled={isLocked}
          className="relative flex w-full min-h-[140px] items-center gap-7 px-10 pb-6 pt-8 text-left disabled:cursor-not-allowed"
        >
          {/* Icon badge */}
          <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${
            isLocked 
              ? "bg-zinc-800 text-zinc-600" 
              : isCompleted 
              ? "bg-emerald-500/20 text-emerald-400" 
              : `${theme.iconBg} ${theme.iconText}`
          }`}>
            {isCompleted
              ? <Check size={22} strokeWidth={2.5} className="text-emerald-400" />
              : isLocked
              ? <Lock size={20} />
              : (STEP_ICONS[step.stepIcon] ?? <Zap size={22} />)
            }
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1 pr-4">
            <div className="mb-1 flex items-baseline gap-2.5">
              <span className={`text-[12px] font-bold tabular-nums ${isLocked ? "text-zinc-700" : "text-zinc-500"}`}>
                #{step.order}
              </span>
              {isInProgress && (
                <span className={`rounded-[8px] px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 ${theme.badgeBg} ${theme.badgeText}`}>
                  In Progress
                </span>
              )}
              {isCompleted && (
                <span className="rounded-[8px] bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-emerald-500/30 text-emerald-400">
                  Done
                </span>
              )}
            </div>
            <p className={`text-xl font-black leading-tight tracking-tight ${isCompleted ? "text-zinc-500 line-through decoration-zinc-600" : isLocked ? "text-zinc-600" : "text-white"}`}>
              {step.title}
            </p>
            <p className={`mt-2 line-clamp-2 text-[15px] leading-relaxed ${isLocked ? "text-zinc-700" : "text-zinc-500"}`}>
              {step.shortDescription}
            </p>
          </div>
        </button>

        {/* ── Bottom: Practice / Exam buttons ── */}
        {!isLocked && !step.modalOnly && (
          <div className="relative flex flex-col gap-2 border-t border-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-4">
            {/* Exam result badge */}
            {isCompleted && step.stars ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5 ring-1 ring-amber-500/25 self-start">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <FaStar
                      key={i}
                      size={12}
                      className={i <= step.stars! ? "text-amber-400" : "text-zinc-600"}
                      style={i <= step.stars! ? { filter: "drop-shadow(0 0 4px rgba(251,191,36,0.7))" } : undefined}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                  {step.stars}/3
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((i) => (
                  <FaStar key={i} size={11} className="text-zinc-700" />
                ))}
                <span className="ml-1 text-[10px] text-zinc-600 font-medium">No exam yet</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Practice */}
              <button
                onClick={goToExercise}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-md transition-all hover:bg-white/10"
              >
                <Play size={14} fill="currentColor" />
                Practice
              </button>

              {/* Exam */}
              <button
                onClick={goToExam}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-[8px] bg-white px-4 py-2 text-[13px] font-bold text-zinc-950 transition-all hover:bg-zinc-200"
              >
                <Target size={14} />
                {isCompleted ? "Retake Exam" : "Start Exam"}
              </button>
            </div>
          </div>
        )}

        {/* Pulse border for available */}
        {isAvailable && (
          <motion.div
            className={`pointer-events-none absolute inset-0 rounded-2xl border-2 ${theme.availableBorder}`}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>

      {/* ── Spacing ── */}
      {!isLast && <div className="h-8 w-full" />}
    </motion.div>
  );
}

// ─── BranchNode — song picker step ───────────────────────────────────────────

function BranchNode({ step, onClick }: { step: JourneyStepWithStatus; onClick: () => void }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const isLocked = step.status === "locked";
  const isCompleted = step.status === "completed";

  useEffect(() => {
    if (!step.songPicker?.length) return;
    getSongsByIds(step.songPicker).then(setSongs);
  }, [step.songPicker]);

  return (
    <motion.div variants={stepVariants} className="flex w-full max-w-3xl flex-col items-center">
      {/* stem down */}
      <div className="h-8 w-px bg-zinc-800" />

      {/* label */}
      <div className="mb-4 flex items-center gap-2">
        <div className={`h-px w-16 bg-zinc-800`} />
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">
          Pick your first song
        </span>
        <div className="h-px w-16 bg-zinc-800" />
      </div>

      {/* horizontal bar */}
      <div className="relative w-full">
        {/* top horizontal bar connecting 3 legs */}
        <div className="absolute left-[16.67%] right-[16.67%] top-0 h-px bg-zinc-700" />
        {/* 3 legs down */}
        <div className="absolute left-[16.67%] top-0 h-5 w-px bg-zinc-700" />
        <div className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-zinc-700" />
        <div className="absolute right-[16.67%] top-0 h-5 w-px bg-zinc-700" />

        {/* 3 cards */}
        <div className="grid grid-cols-3 gap-3 pt-5">
          {songs.length === 0
            ? [0, 1, 2].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
              ))
            : songs.map((song) => (
                <button
                  key={song.id}
                  onClick={isLocked ? undefined : onClick}
                  disabled={isLocked}
                  className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 disabled:cursor-not-allowed
                    ${isCompleted
                      ? "border-zinc-700/40 bg-zinc-900/60"
                      : isLocked
                      ? "border-zinc-800/40 bg-zinc-900/20 opacity-40"
                      : "border-zinc-700 bg-zinc-900 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                    }`}
                >
                  {/* Cover */}
                  <div className="relative h-28 w-full overflow-hidden bg-zinc-800">
                    {song.coverUrl ? (
                      <Image
                        src={song.coverUrl}
                        alt={song.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ filter: isLocked ? "brightness(0.3) saturate(0)" : "brightness(0.7)" }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Music size={24} className="text-zinc-700" />
                      </div>
                    )}
                    {isCompleted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Check size={24} className="text-orange-400" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-3 py-2.5">
                    <p className={`truncate text-xs font-bold leading-snug ${isLocked ? "text-zinc-600" : "text-zinc-200"}`}>
                      {song.title}
                    </p>
                    <p className="truncate text-[11px] text-zinc-600">{song.artist}</p>
                  </div>
                </button>
              ))}
        </div>
      </div>

      {/* hint */}
      {!isLocked && !isCompleted && (
        <p className="mt-3 text-[11px] text-zinc-600">Click any card to open &amp; choose</p>
      )}
    </motion.div>
  );
}

// ─── JourneyPath ──────────────────────────────────────────────────────────────

interface JourneyPathProps {
  module: JourneyModuleWithStatus;
  onStepClick: (step: JourneyStepWithStatus) => void;
  onBack: () => void;
}

export const JourneyPath: React.FC<JourneyPathProps> = ({ module, onStepClick, onBack }) => {
  const allSteps = module.stages.flatMap((s) => s.steps);

  return (
    <div className="relative flex-1 overflow-y-auto">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden border-b border-zinc-800/60 bg-zinc-950" style={{ minHeight: 200 }}>
        {/* Background photo — visible on right, fades left */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=1400&q=80"
            alt=""
            fill
            className="object-cover object-[72%_18%]"
            priority
            style={{ filter: "brightness(0.5) saturate(1.6) contrast(1.05)" }}
          />
        </div>
        {/* Dark left zone — text readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 from-[30%] via-zinc-950/75 to-transparent" />
        {/* Subtle cyan glow bottom-left */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-64 opacity-30"
             style={{ background: "radial-gradient(ellipse at 0% 100%, rgba(6,182,212,0.5) 0%, transparent 70%)" }} />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative px-6 py-10 md:px-10">
          {/* Nav row */}
          <div className="mb-6 flex items-center gap-1.5 p-1 px-1.5 w-fit rounded-[10px] bg-zinc-900/50 border border-white/5 backdrop-blur-md">
            <button
              onClick={onBack}
              className="group flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[10px] font-semibold text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
            >
              <ChevronLeft size={12} strokeWidth={3} className="transition-transform group-hover:-translate-x-0.5" />
              Modules
            </button>
            <div className="h-4 w-px bg-white/5 mx-0.5" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              {module.title.split(" ")[0]} 01
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg md:text-4xl">
            {module.title}
          </h1>
          <p className="mt-2 max-w-xs text-sm text-zinc-400">{module.subtitle}</p>

          {/* Progress */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                className="h-full rounded-full bg-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: module.totalCount > 0 ? `${(module.completedCount / module.totalCount) * 100}%` : 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ boxShadow: "0 0 8px rgba(6,182,212,0.6)" }}
              />
            </div>
            <span className="text-xs text-zinc-500">{module.completedCount}/{module.totalCount} steps</span>
          </div>
        </div>
      </div>

      {/* ── Path ── */}
      <div className="px-4 py-10 md:px-10">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col items-center">
          {module.stages.map((stage, stageIdx) => (
            <div key={stage.id} className="flex w-full max-w-3xl flex-col items-center">
              {stageIdx > 0 && <div className="my-2 h-8 w-px bg-zinc-800" />}

              {/* Stage label */}
              {stage.label && (
                <motion.div variants={stepVariants} className="mb-5 flex w-full items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className={`whitespace-nowrap rounded-[8px] px-4 py-1.5 text-[11px] font-bold tracking-widest ring-1 ${stage.colorClass}`}>
                    {stage.label}
                  </span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </motion.div>
              )}

              {/* Steps */}
              {stage.steps.map((step, stepIdx) => {
                const globalIdx = allSteps.findIndex((s) => s.id === step.id);
                const isLastGlobal = globalIdx === allSteps.length - 1;
                const isLastInStage = stepIdx === stage.steps.length - 1;
                const isLast = isLastGlobal || (isLastInStage && stageIdx < module.stages.length - 1);

                if (step.songPicker?.length) {
                  return (
                    <BranchNode
                      key={step.id}
                      step={step}
                      onClick={() => onStepClick(step)}
                    />
                  );
                }

                return (
                  <StepNode
                    key={step.id}
                    step={step}
                    onClick={() => onStepClick(step)}
                    isLast={isLast}
                    moduleId={module.id}
                  />
                );
              })}
            </div>
          ))}

          {/* Completion */}
          {module.completedCount === module.totalCount && module.totalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="mt-8 flex w-full max-w-3xl flex-col items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-8 py-7 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 ring-1 ring-orange-500/30">
                <Check size={26} className="text-orange-400" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-lg font-bold text-orange-400">Module Complete!</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Congratulations — you&apos;ve mastered all guitar fundamentals.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
