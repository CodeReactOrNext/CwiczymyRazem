import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { NOTES } from "utils/audio/noteUtils";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { DetectionWave } from "./DetectionWave";
import { HuntSuccessBurst } from "./HuntSuccessBurst";

interface ChordHuntPanelProps {
  chordName: string;
  description?: string;
  isMicEnabled: boolean;
  isListening: boolean;
}

/**
 * "Build the Chord": shows a chord name and lights up each chord tone (R/3/5/…)
 * as the player finds it one note at a time. Mirrors NoteHuntDetector's layout
 * but the unit of progress is a chord tone (see useChordHunt).
 */
export function ChordHuntPanel({ chordName: chordNameProp, description, isMicEnabled, isListening }: ChordHuntPanelProps) {
  const { chordHunt, noteHuntSecondsLeft, huntTarget, volumeRef, advanceHunt, markChordTone } = useNoteMatchingContext();

  // Read the live chord from context (not the prop) so it updates through the
  // memoized desktop content wrapper when the chord rotates.
  const chordName = huntTarget ?? chordNameProp;

  const isMatch = chordHunt?.isMatch ?? false;
  const detectedPc = chordHunt?.detectedPitchClass ?? null;
  const tones = chordHunt?.tones ?? [];
  const labels = chordHunt?.labels ?? [];
  const foundTones = chordHunt?.foundTones ?? [];
  const score = chordHunt?.gameState.score ?? 0;

  const foundCount = foundTones.length;
  const allFound = tones.length > 0 && foundCount === tones.length;
  const isRotating = noteHuntSecondsLeft !== null;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
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
              allFound
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

      {/* Chord name card */}
      <div className="relative group">
        <div
          className={cn(
            "absolute -inset-2 blur-[16px] rounded-lg transition-opacity duration-500",
            allFound ? "bg-emerald-500/50 opacity-100" : "bg-cyan-500/15 opacity-50",
          )}
        />
        <HuntSuccessBurst foundCount={foundCount} complete={allFound} />
        <motion.div
          animate={allFound ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "relative h-32 min-w-[8rem] px-6 rounded-lg flex items-center justify-center shadow-2xl backdrop-blur-xl overflow-hidden transition-colors duration-500",
            allFound ? "bg-emerald-900/80" : "bg-zinc-900/90",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <span className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_18px_rgba(255,255,255,0.5)]">
            {chordName}
          </span>
        </motion.div>
      </div>

      {description && (
        <p className="text-center text-sm font-semibold tracking-wide text-zinc-200">{description}</p>
      )}

      {/* Detection status */}
      {!isMicEnabled ? (
        <p className="text-center text-xs text-zinc-400">
          Enable the <span className="font-bold text-emerald-300">mic</span> in the controls below to light up tones, or tap a{" "}
          <span className="font-bold text-zinc-200">?</span> to reveal it.
        </p>
      ) : !isListening ? (
        <p className="text-sm font-semibold text-zinc-200">Starting microphone…</p>
      ) : (
        <DetectionWave volumeRef={volumeRef} active={isListening} isMatch={isMatch} />
      )}

      {/* Tone chips — the note stays hidden as "?" until found (mic) or revealed
          by hand (no mic). The degree label (R/3/5) is shown as the hint. */}
      {tones.length > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          {!isMicEnabled && (
            <span className="text-xs font-semibold tracking-wide text-zinc-400">Tap a tone to reveal it</span>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {tones.map((pc, i) => {
              const found = foundTones.includes(pc);
              // Don't re-pulse a tone that's already marked.
              const isCurrent = isMatch && detectedPc === pc && !found;
              const revealed = found || isCurrent;
              const chipClass = cn(
                "flex h-12 min-w-[3.25rem] flex-col items-center justify-center rounded px-2 font-extrabold leading-none transition-all",
                isCurrent
                  ? "bg-emerald-500/30 text-emerald-100 scale-110"
                  : found
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-zinc-800/80 text-zinc-300",
              );
              const inner = (
                <>
                  <span className="text-lg">{revealed ? NOTES[pc] : "?"}</span>
                  <span className="text-[10px] opacity-80">{labels[i] ?? ""}</span>
                </>
              );
              return !isMicEnabled ? (
                <button key={pc} type="button" onClick={() => markChordTone(pc)} className={cn(chipClass, "cursor-pointer hover:brightness-125 active:scale-95")}>
                  {inner}
                </button>
              ) : (
                <span key={pc} className={chipClass}>{inner}</span>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress */}
      {tones.length > 0 && (
        <p className={cn("text-sm font-extrabold tracking-widest transition-colors", allFound ? "text-emerald-300" : "text-zinc-300")}>
          {allFound ? "★ CHORD COMPLETE" : `${foundCount} / ${tones.length} TONES FOUND`}
        </p>
      )}

      {/* Manual advance — works with or without the mic */}
      {isRotating && (
        <button
          type="button"
          onClick={advanceHunt}
          className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          Next <FaArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
