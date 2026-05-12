import { cn } from "assets/lib/utils";
import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";
import { memo } from "react";

import type { SlotResult } from "../../hooks/useStrummingMatcher";
import { ACCENT_DOT, ARROW_AREA_H, DOTS_H, DOWN_COLOR, HEADER_H, LABEL_H, MUTED_COLOR, PAD, UP_COLOR } from "./strumming.constants";
import { useStrummingAnimation } from "./hooks/useStrummingAnimation";

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
}

function StrummingPatternViewerInner({
  patterns, bpm, isPlaying, startTime, countInRemaining = 0,
  className, slotFeedback, isMicEnabled, maxReps = 10,
  audioContext: externalAudioContext,
}: StrummingPatternViewerProps) {
  const pattern = patterns[0];
  const canvasH = PAD + HEADER_H + ARROW_AREA_H + LABEL_H + DOTS_H + PAD;

  const { canvasRef, containerRef } = useStrummingAnimation({
    pattern, bpm, isPlaying, startTime, countInRemaining,
    slotFeedback, isMicEnabled, maxReps, canvasH, externalAudioContext,
  });

  if (!pattern) return null;

  const hasChords = pattern.chords && pattern.chords.length > 1;

  return (
    <div className={cn("relative w-full bg-[#0a0a0a] rounded-xl overflow-hidden", className)}>
      <div ref={containerRef} style={{ width: "100%", height: canvasH }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      {countInRemaining > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center">
            <span className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              {countInRemaining}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/50 mt-4">
              Get Ready
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-t border-white/5 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <svg width={9} height={14} viewBox="0 0 9 14">
            <line x1={4.5} y1={1} x2={4.5} y2={9} stroke={DOWN_COLOR} strokeWidth={2} strokeLinecap="round"/>
            <polyline points="1,6 4.5,12 8,6" fill="none" stroke={DOWN_COLOR} strokeWidth={2} strokeLinejoin="round"/>
          </svg>
          Down
        </span>
        <span className="flex items-center gap-1">
          <svg width={9} height={14} viewBox="0 0 9 14">
            <line x1={4.5} y1={13} x2={4.5} y2={5} stroke={UP_COLOR} strokeWidth={2} strokeLinecap="round"/>
            <polyline points="1,8 4.5,2 8,8" fill="none" stroke={UP_COLOR} strokeWidth={2} strokeLinejoin="round"/>
          </svg>
          Up
        </span>
        <span className="flex items-center gap-1">
          <span style={{ color: MUTED_COLOR, fontWeight: 700, fontSize: 11 }}>✕</span>
          Muted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: ACCENT_DOT }}/>
          Accent
        </span>
        <span className="flex-1" />
        {hasChords && (
          <span className="text-zinc-500">
            {pattern.chords!.length} chords / loop
          </span>
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
  Object.is(prev.slotFeedback, next.slotFeedback)
);
