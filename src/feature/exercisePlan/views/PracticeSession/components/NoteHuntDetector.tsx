import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { DetectionWave } from "./DetectionWave";
import { HuntSuccessBurst } from "./HuntSuccessBurst";
import { NoteHuntFretboard } from "./NoteHuntFretboard";

interface NoteHuntDetectorProps {
  targetNote: string;
  description?: string;
  isMicEnabled: boolean;
  isListening: boolean;
}

const SUPERSCRIPT = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const toSuperscript = (n: number) =>
  String(n).split("").map(d => SUPERSCRIPT[Number(d)] ?? d).join("");

export function NoteHuntDetector({
  targetNote: targetNoteProp,
  description,
  isMicEnabled,
  isListening,
}: NoteHuntDetectorProps) {
  const { noteHunt, noteHuntSecondsLeft, noteHuntRegion, customGoalPrompt, huntTarget, volumeRef, advanceHunt, markNoteHuntOctave } = useNoteMatchingContext();

  // Read the live target from context (not the prop) so it updates through the
  // memoized desktop content wrapper when the target rotates. Falls back to the
  // prop on first paint.
  const targetNote = huntTarget ?? targetNoteProp;

  const detectedOctave = noteHunt?.detectedOctave ?? null;
  const isMatch        = noteHunt?.isMatch ?? false;
  const foundOctaves   = noteHunt?.foundOctaves ?? [];
  const octaves        = noteHunt?.octaves ?? [];
  const score          = noteHunt?.gameState.score ?? 0;

  const foundInRange = octaves.filter(o => foundOctaves.includes(o)).length;
  const allFound = octaves.length > 0 && foundInRange === octaves.length;

  // Prompt mode (Interval Hunt): the card shows a question (root + interval) and
  // the answer note stays hidden until the player plays it.
  const isPrompt = !!customGoalPrompt;
  const solved = foundOctaves.length >= 1;
  const isRotating = noteHuntSecondsLeft !== null;

  // Unit of progress for the success bursts: octaves normally, or "solved once"
  // in interval mode; "complete" is the whole goal.
  const foundUnits = isPrompt ? (solved ? 1 : 0) : foundInRange;
  const complete = isPrompt ? solved : allFound;

  return (
    <div className={cn("flex w-full flex-col items-center gap-2.5 sm:gap-4", noteHuntRegion ? "max-w-xl" : "max-w-sm")}>
      {/* Score (mic only) + countdown */}
      <div className="flex items-center justify-center gap-3">
        {isMicEnabled && (
          <span className="rounded bg-amber-500/15 px-3.5 py-1.5 text-base font-extrabold tracking-wide text-amber-300">
            ★ {score} pts
          </span>
        )}
        {isRotating && (
          <span
            className={cn(
              "rounded px-3.5 py-1.5 text-base font-extrabold tabular-nums transition-colors",
              complete
                ? "bg-emerald-500/20 text-emerald-300"
                : noteHuntSecondsLeft! <= 5
                ? "animate-pulse bg-red-500/25 text-red-300"
                : "bg-white/10 text-zinc-200",
            )}
          >
            {noteHuntSecondsLeft}s
          </span>
        )}
      </div>

      {/* Target card */}
      <div className="relative group">
        <div
          className={cn(
            "absolute -inset-2 blur-[16px] rounded-lg transition-opacity duration-500",
            complete ? "bg-emerald-500/50 opacity-100" : "bg-cyan-500/15 opacity-50",
          )}
        />
        <HuntSuccessBurst foundCount={foundUnits} complete={complete} />
        <motion.div
          animate={complete ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-lg flex items-center justify-center shadow-2xl backdrop-blur-xl overflow-hidden transition-colors duration-500",
            complete ? "bg-emerald-900/80" : "bg-zinc-900/90",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_18px_rgba(255,255,255,0.5)]">
            {isPrompt && !solved ? customGoalPrompt!.title : targetNote}
          </span>
        </motion.div>
      </div>

      {/* Prompt subtitle / description */}
      {isPrompt ? (
        <div className="flex flex-col items-center gap-1.5">
          {customGoalPrompt!.subtitle && (
            <span className="rounded bg-cyan-500/20 px-4 py-1.5 text-base font-bold tracking-wide text-cyan-200">
              {customGoalPrompt!.subtitle}
            </span>
          )}
          {solved && (
            <span className="text-base font-bold tracking-wide text-emerald-300">✓ it was {targetNote}</span>
          )}
        </div>
      ) : (
        description && (
          <p className="text-center text-sm font-semibold tracking-wide text-zinc-200">{description}</p>
        )
      )}

      {/* Detection status */}
      {!isMicEnabled ? (
        <p className="text-center text-xs text-zinc-400">
          Enable the <span className="font-bold text-emerald-300">mic</span> in the controls below to auto-score, or check off octaves by hand.
        </p>
      ) : !isListening ? (
        <p className="text-sm font-semibold text-zinc-200">Starting microphone…</p>
      ) : (
        <DetectionWave volumeRef={volumeRef} active={isListening} isMatch={isMatch} />
      )}

      {/* Region neck — shows WHERE to search, never the answer positions. */}
      {noteHuntRegion && (
        <NoteHuntFretboard
          targetNote={targetNote}
          startFret={noteHuntRegion.startFret}
          endFret={noteHuntRegion.endFret}
          foundOctaves={foundOctaves}
          isMatch={isMatch}
        />
      )}

      {/* Answer panel — chips, progress and Next grouped together so they read as
          one block (and stay compact) on small screens instead of drifting apart. */}
      {(isPrompt || octaves.length > 0 || isRotating) && (
      <div className="flex w-full flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl bg-black/20 p-3 sm:bg-transparent sm:p-0">
      {/* Octave chips — reference + (no-mic) tap-to-mark. Hidden in interval mode
          so they don't reveal the answer. */}
      {!isPrompt && octaves.length > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          {!isMicEnabled && (
            <span className="text-xs font-semibold tracking-wide text-zinc-400">
              Tap each octave you find{noteHuntRegion ? " in the region" : ""}
            </span>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {octaves.map(o => {
              const found = foundOctaves.includes(o);
              const isCurrent = isMatch && detectedOctave === o && !found;
              const chipClass = cn(
                "flex h-9 min-w-[2.75rem] items-center justify-center rounded px-2 text-base font-extrabold transition-all",
                isCurrent
                  ? "bg-emerald-500/30 text-emerald-100 scale-110"
                  : found
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-zinc-800/80 text-zinc-300",
              );
              const label = `${targetNote}${toSuperscript(o)}`;
              return !isMicEnabled ? (
                <button key={o} type="button" onClick={() => markNoteHuntOctave(o)} className={cn(chipClass, "cursor-pointer hover:brightness-125 active:scale-95")}>
                  {label}
                </button>
              ) : (
                <span key={o} className={chipClass}>{label}</span>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress */}
      {isPrompt ? (
        <div className="flex flex-col items-center gap-2">
          <p className={cn("text-sm font-extrabold tracking-widest transition-colors", solved ? "text-emerald-300" : "text-zinc-300")}>
            {solved ? "★ CORRECT" : "FIND THE TARGET NOTE"}
          </p>
          {!isMicEnabled && !solved && octaves.length > 0 && (
            <button
              type="button"
              onClick={() => markNoteHuntOctave(octaves[0])}
              className="rounded bg-emerald-500/20 px-4 py-1.5 text-sm font-bold tracking-wide text-emerald-200 transition-colors hover:bg-emerald-500/30 active:scale-95"
            >
              Reveal answer
            </button>
          )}
        </div>
      ) : (
        octaves.length > 0 && (
          <p className={cn("text-sm font-extrabold tracking-wide transition-colors", allFound ? "text-emerald-300" : "text-zinc-300")}>
            {allFound
              ? (noteHuntRegion ? "★ all positions found" : "★ all octaves found")
              : `${foundInRange} / ${octaves.length} ${noteHuntRegion ? "found in region" : "octaves found"}`}
          </p>
        )
      )}

      {/* Manual advance — works with or without the mic */}
      {isRotating && (
        <button
          type="button"
          onClick={advanceHunt}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          Next <FaArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
      </div>
      )}
    </div>
  );
}
