import { cn } from "assets/lib/utils";
import type { Song } from "feature/songs/types/songs.type";
import {
  ArrowDown, ArrowUpDown, AudioWaveform, Bug,   Check, ChevronDown, ChevronLeft,
ClipboardCheck, GitMerge, Guitar,
Hammer, Hand, Info, Layers,
LayoutGrid, Link2,
  MoveHorizontal,   Music, Play, SkipForward, SlidersHorizontal, Target, Timer, TrendingUp,
Waves,   Zap, } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";

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

// Stage theme configs — semantic accents only (orange/amber/cyan)
const STAGE_THEME: Record<string, {
  iconBg: string;
  iconText: string;
  badge: string;
  imgTint: string;
  cardFade: string;
  ring: string;
}> = {
  stage_1: {
    iconBg: "bg-orange-500/10",
    iconText: "text-orange-400",
    badge: "bg-orange-500/10 text-orange-400",
    imgTint: "bg-orange-900/30",
    cardFade: "from-zinc-900 via-zinc-900/90 to-zinc-900/20",
    ring: "ring-orange-500/40",
  },
  stage_2: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400",
    imgTint: "bg-amber-900/30",
    cardFade: "from-zinc-900 via-zinc-900/90 to-zinc-900/20",
    ring: "ring-amber-500/40",
  },
  stage_3: {
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-400",
    imgTint: "bg-cyan-900/30",
    cardFade: "from-zinc-900 via-zinc-900/90 to-zinc-900/20",
    ring: "ring-cyan-500/40",
  },
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

  return (
    <div className="flex w-full max-w-3xl flex-col items-center">
      {/* ── Card ── */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg backdrop-blur-md transition-background",
          isCompleted  && "bg-zinc-900/40",
          isInProgress && "bg-zinc-900/60",
          isAvailable  && cn("bg-zinc-900/60 ring-1", theme.ring),
          isLocked     && "bg-zinc-900/30"
        )}
      >
        {/* Background image bleeding from right */}
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
          aria-label={`Open details: ${step.title}`}
          className="group relative flex min-h-[140px] w-full items-center gap-7 px-10 pb-6 pt-8 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed enabled:hover:bg-white/[0.02]"
        >
          {/* Details hint */}
          {!isLocked && (
            <span
              className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-zinc-900/70 py-1 pl-2 pr-2 text-[11px] font-medium text-zinc-400 backdrop-blur-sm transition-background group-hover:bg-cyan-500/15 group-hover:text-cyan-300"
              aria-hidden
            >
              <Info size={14} />
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-[5rem] group-hover:opacity-100">
                Details
              </span>
            </span>
          )}

          {/* Icon badge */}
          <div className={cn(
            "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg",
            isLocked
              ? "bg-zinc-800 text-zinc-600"
              : isCompleted
              ? "bg-emerald-500/10 text-emerald-400"
              : cn(theme.iconBg, theme.iconText)
          )}>
            {isCompleted
              ? <Check size={22} strokeWidth={2.5} className="text-emerald-400" />
              : (STEP_ICONS[step.stepIcon] ?? <Zap size={22} />)
            }
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1 pr-4">
            <div className="mb-1 flex items-baseline gap-2.5">
              <span className={cn("text-[12px] font-bold tabular-nums", isLocked ? "text-zinc-700" : "text-zinc-500")}>
                #{step.order}
              </span>
              {isInProgress && (
                <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold tracking-wide", theme.badge)}>
                  In Progress
                </span>
              )}
              {isCompleted && (
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-400">
                  Done
                </span>
              )}
            </div>
            <p className={cn(
              "text-xl font-black leading-tight tracking-tight",
              isCompleted ? "text-zinc-500 line-through decoration-zinc-600" : isLocked ? "text-zinc-600" : "text-zinc-100"
            )}>
              {step.title}
            </p>
            <p className={cn("mt-2 line-clamp-2 text-[15px] leading-relaxed", isLocked ? "text-zinc-700" : "text-zinc-400")}>
              {step.shortDescription}
            </p>
          </div>
        </button>

        {/* ── Bottom: Practice / Exam buttons ── */}
        {!isLocked && !step.modalOnly && (
          <div className="relative flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:pb-5">
            {/* Exam result badge */}
            {isCompleted && step.stars ? (
              <div className="flex items-center gap-2 self-start rounded-lg bg-amber-500/10 px-3 py-1.5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <FaStar
                      key={i}
                      size={12}
                      className={i <= step.stars! ? "text-amber-400" : "text-zinc-600"}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold tabular-nums text-amber-400">
                  {step.stars}/3
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((i) => (
                  <FaStar key={i} size={11} className="text-zinc-700" />
                ))}
                <span className="ml-1 text-[10px] font-medium text-zinc-600">No exam yet</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Practice */}
              <button
                onClick={goToExercise}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-800/60 px-4 py-2 text-[13px] font-medium text-zinc-200 transition-background hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none"
              >
                <Play size={14} fill="currentColor" />
                Practice
              </button>

              {/* Exam */}
              <button
                onClick={goToExam}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-bold text-zinc-950 transition-background hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none"
              >
                <Target size={14} />
                {isCompleted ? "Retake Exam" : "Start Exam"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Spacing ── */}
      {!isLast && <div className="h-8 w-full" />}
    </div>
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
    <div className="flex w-full max-w-3xl flex-col items-center pt-8">
      {/* label */}
      <span className="mb-5 text-[11px] font-bold tracking-widest text-zinc-500">
        Pick your first song
      </span>

      {/* 3 cards */}
      <div className="grid w-full grid-cols-3 gap-3">
        {songs.length === 0
          ? [0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-zinc-900/40" />
            ))
          : songs.map((song) => (
              <button
                key={song.id}
                onClick={isLocked ? undefined : onClick}
                disabled={isLocked}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-lg text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed",
                  isCompleted
                    ? "bg-zinc-900/60"
                    : isLocked
                    ? "bg-zinc-900/20 opacity-40"
                    : "bg-zinc-900/60 hover:bg-zinc-800/60"
                )}
              >
                {/* Cover */}
                <div className="relative h-28 w-full overflow-hidden bg-zinc-800">
                  {song.coverUrl ? (
                    <Image
                      src={song.coverUrl}
                      alt={song.title}
                      fill
                      className="object-cover"
                      style={{ filter: isLocked ? "brightness(0.3) saturate(0)" : "brightness(0.7)" }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music size={24} className="text-zinc-600" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Check size={24} className="text-emerald-400" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-3 py-2.5">
                  <p className={cn("truncate text-xs font-bold leading-snug", isLocked ? "text-zinc-600" : "text-zinc-200")}>
                    {song.title}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500">{song.artist}</p>
                </div>
              </button>
            ))}
      </div>

      {/* hint */}
      {!isLocked && !isCompleted && (
        <p className="mt-3 text-[11px] text-zinc-500">Click any card to open &amp; choose</p>
      )}
    </div>
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
      <div className="relative overflow-hidden bg-zinc-950" style={{ minHeight: 200 }}>
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
          <div className="mb-6 flex w-fit items-center gap-2 rounded-lg bg-zinc-900/50 p-1 px-1.5 backdrop-blur-md">
            <button
              onClick={onBack}
              className="group flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-semibold text-zinc-400 transition-background hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <ChevronLeft size={12} strokeWidth={3} className="transition-transform group-hover:-translate-x-0.5" />
              Modules
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              {module.title.split(" ")[0]} 01
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
            {module.title}
          </h1>
          <p className="mt-2 max-w-xs text-sm text-zinc-400">{module.subtitle}</p>

          {/* Progress */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-cyan-500"
                style={{
                  width: module.totalCount > 0 ? `${(module.completedCount / module.totalCount) * 100}%` : 0,
                }}
              />
            </div>
            <span className="text-xs text-zinc-500">{module.completedCount}/{module.totalCount} steps</span>
          </div>
        </div>
      </div>

      {/* ── Path ── */}
      <div className="px-4 py-10 md:px-10">
        <div className="flex flex-col items-center">
          {module.stages.map((stage, stageIdx) => (
            <div key={stage.id} className="flex w-full max-w-3xl flex-col items-center">
              {stageIdx > 0 && <div className="h-10 w-full" />}

              {/* Stage label */}
              {stage.label && (
                <div className="mb-5 w-full">
                  <span className={cn("inline-block whitespace-nowrap rounded px-4 py-1.5 text-[11px] font-bold tracking-widest", stage.colorClass)}>
                    {stage.label}
                  </span>
                </div>
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
            <div className="mt-8 flex w-full max-w-3xl flex-col items-center gap-3 rounded-lg bg-orange-500/10 px-8 py-7 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15">
                <Check size={26} className="text-orange-400" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-lg font-bold text-orange-400">Module Complete!</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Congratulations — you&apos;ve mastered all guitar fundamentals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
