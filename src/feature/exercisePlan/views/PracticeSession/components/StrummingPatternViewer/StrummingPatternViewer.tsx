import { cn } from "assets/lib/utils";
import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { memo } from "react";

import type { SlotResult } from "../../hooks/useStrummingMatcher";
import { CountInOverlay } from "../CountInOverlay";
import { useStrummingAnimation } from "./hooks/useStrummingAnimation";
import { DOTS_H, HEADER_H, HIT_COLOR, INK_COLOR, MISS_COLOR, PAD, TILE_H, WRONG_COLOR } from "./strumming.constants";

interface StrummingPatternViewerProps {
  patterns:             StrumPattern[];
  bpm:                  number;
  isPlaying:            boolean;
  startTime:            number | null;
  countInRemaining?:    number;
  className?:           string;
  /** Slot feedback map from useStrummingMatcher — renders hit/miss/wrong colors */
  slotFeedback?:        Map<number, SlotResult>;
  /** Whether mic is enabled (controls whether overlays are painted) */
  isMicEnabled?:        boolean;
  /** Number of reps per set before cycling (default 10) */
  maxReps?:             number;
  /** Shared AudioContext from the session — reused instead of creating a new one */
  audioContext?:        AudioContext | null;
  /** Session guitar level (playback toggle + track slider), 0 = muted. Defaults to
   *  full so a standalone viewer still sounds. */
  volume?:              number;
}

/** The legend's arrow: the same glyph the canvas draws, at text size. */
function LegendArrow({ color, weight = 2, dotted = false, up = false }: {
  color: string; weight?: number; dotted?: boolean; up?: boolean;
}) {
  return (
    <svg width={10} height={16} viewBox='0 0 10 16' fill='none' aria-hidden='true' className={cn(up && "rotate-180")}>
      <path d='M5 1.5V14' stroke={color} strokeWidth={weight} strokeLinecap='round' strokeDasharray={dotted ? "0.1 3.6" : undefined} />
      <path d='M1.5 10.5L5 14.5L8.5 10.5' stroke={color} strokeWidth={weight} strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

function LegendDot({ color }: { color: string }) {
  return <span className='inline-block h-2 w-2 rounded-full' style={{ background: color }} />;
}

function StrummingPatternViewerInner({
  patterns, bpm, isPlaying, startTime, countInRemaining = 0,
  className, slotFeedback, isMicEnabled, maxReps = 10,
  audioContext: externalAudioContext, volume = 1,
}: StrummingPatternViewerProps) {
  const { t } = useTranslation("session");
  const pattern = patterns[0];
  const canvasH = PAD + HEADER_H + TILE_H + DOTS_H + PAD;

  const { canvasRef, containerRef } = useStrummingAnimation({
    pattern, bpm, isPlaying, startTime, countInRemaining,
    slotFeedback, isMicEnabled, maxReps, canvasH, externalAudioContext, volume,
  });

  if (!pattern) return null;

  const hasChords = pattern.chords && pattern.chords.length > 1;
  // The legend only explains marks this pattern actually uses.
  const hasSwing  = pattern.strums.some((b) => b.direction === "miss");
  const hasMuted  = pattern.strums.some((b) => b.direction !== "miss" && b.muted);
  const hasAccent = pattern.strums.some((b) => b.direction !== "miss" && b.accented);

  return (
    // The canvas paints its own dark surface, so the whole viewer stays dark in the light theme.
    <div className={cn("force-dark relative w-full overflow-hidden rounded-lg bg-[#0a0a0a]", className)}>
      {/* The canvas sizes itself: it fits the bar to this box when it can, and
          only scrolls when the slots would get unreadably narrow. */}
      <div
        ref={containerRef}
        className='w-full overflow-x-auto overflow-y-hidden'
        style={{ height: canvasH }}>
        <canvas ref={canvasRef} style={{ height: "100%", display: "block" }} />
      </div>

      <CountInOverlay count={countInRemaining} bpm={bpm} />

      <div className='flex flex-wrap items-center gap-x-5 gap-y-2 px-4 pb-3 pt-1 text-xs text-zinc-400'>
        <span className='flex items-center gap-1.5'>
          <LegendArrow color={INK_COLOR} />
          {t("strum.strum")}
        </span>
        {hasSwing && (
          <span className='flex items-center gap-1.5'>
            <LegendArrow color='#71717a' dotted up />
            {t("strum.swing")}
          </span>
        )}
        {hasMuted && (
          <span className='flex items-center gap-1.5'>
            <svg width={10} height={10} viewBox='0 0 10 10' fill='none' aria-hidden='true'>
              <path d='M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5' stroke={INK_COLOR} strokeWidth={2} strokeLinecap='round' />
            </svg>
            {t("strum.muted")}
          </span>
        )}
        {hasAccent && (
          <span className='flex items-center gap-1.5'>
            <LegendArrow color={INK_COLOR} weight={3.2} />
            {t("strum.accent")}
          </span>
        )}
        <span className='flex-1' />
        {isMicEnabled && (
          <>
            <span className='flex items-center gap-1.5'><LegendDot color={HIT_COLOR} />{t("strum.fb_hit")}</span>
            <span className='flex items-center gap-1.5'><LegendDot color={MISS_COLOR} />{t("strum.fb_miss")}</span>
            {hasSwing && (
              <span className='flex items-center gap-1.5'><LegendDot color={WRONG_COLOR} />{t("strum.fb_wrong")}</span>
            )}
          </>
        )}
        {hasChords && (
          <span>{t("strum.chords_per_loop", { count: pattern.chords!.length })}</span>
        )}
      </div>
    </div>
  );
}

export const StrummingPatternViewer = memo(StrummingPatternViewerInner, (prev, next) =>
  Object.is(prev.patterns,       next.patterns)     &&
  prev.bpm              === next.bpm                &&
  prev.isPlaying        === next.isPlaying           &&
  prev.startTime        === next.startTime           &&
  prev.countInRemaining === next.countInRemaining    &&
  prev.className        === next.className           &&
  prev.isMicEnabled     === next.isMicEnabled        &&
  prev.maxReps          === next.maxReps             &&
  // Volume reaches the RAF tick through a ref written during render, so a memoized
  // re-render is the only thing that can deliver a mute mid-loop.
  prev.volume           === next.volume              &&
  Object.is(prev.slotFeedback, next.slotFeedback)
);
