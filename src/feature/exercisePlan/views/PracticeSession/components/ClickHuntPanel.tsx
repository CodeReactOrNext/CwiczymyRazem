import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { FaArrowRight } from "react-icons/fa";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { ClickableFretboard } from "./ClickableFretboard";
import { HuntSuccessBurst } from "./HuntSuccessBurst";

interface ClickHuntPanelProps {
  targetNote: string;
  description?: string;
  startFret: number;
  endFret: number;
  strings?: number[];
  /** Whether the session timer is running — the note-rotation countdown is
   *  frozen until it is, even though clicking itself always works. */
  isPlaying: boolean;
  /** Dev-only (non-production): fast-tracks the WHOLE EXAM finish flow instantly.
   *  Undefined outside exam mode — distinct from the per-note "complete instantly"
   *  button below, which only solves the current rotating target. */
  onDevPassExam?: () => void;
}

/**
 * Click-to-answer counterpart to NoteHuntDetector: shows the target note name
 * and a clickable fretboard diagram instead of mic-driven pitch detection.
 */
export function ClickHuntPanel({ targetNote: targetNoteProp, description, startFret, endFret, strings, isPlaying, onDevPassExam }: ClickHuntPanelProps) {
  const { clickHunt, huntTarget, noteHuntSecondsLeft, advanceHunt, registerFretClick } = useNoteMatchingContext();

  const targetNote = huntTarget ?? targetNoteProp;
  const targetPositions = clickHunt?.targetPositions ?? [];
  const foundKeys = clickHunt?.foundKeys ?? [];
  const lastClick = clickHunt?.lastClick ?? null;
  const score = clickHunt?.gameState.score ?? 0;

  const foundCount = foundKeys.length;
  const totalTargets = targetPositions.length;
  const complete = totalTargets > 0 && foundCount >= totalTargets;
  const isRotating = noteHuntSecondsLeft !== null;

  // Once every position is found, move on to the next note by ourselves after
  // a short beat — instead of waiting on the shared rotation timer's slower
  // fast-forward or making the player press "Next" every time.
  const advanceHuntRef = useRef(advanceHunt);
  useEffect(() => { advanceHuntRef.current = advanceHunt; });
  useEffect(() => {
    if (!complete) return undefined;
    const t = setTimeout(() => advanceHuntRef.current(), 900);
    return () => clearTimeout(t);
  }, [complete]);

  return (
    <div className="relative flex w-full max-w-4xl flex-col items-center gap-2.5 sm:gap-4">
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-950/40 backdrop-blur-[1px]"
          >
            <span className="rounded-lg bg-zinc-900/90 px-5 py-3 text-center text-sm font-bold tracking-wide text-amber-200 shadow-xl ring-1 ring-white/10">
              ▶ Press Play below to start the timer
              <br />
              <span className="text-xs font-semibold text-zinc-400">you can click right away</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-3">
        <span className="rounded bg-amber-500/15 px-3.5 py-1.5 text-base font-extrabold tracking-wide text-amber-300">
          ★ {score} pts
        </span>
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

      <div className="relative group">
        <div
          className={cn(
            "absolute -inset-2 blur-[16px] rounded-lg transition-opacity duration-500",
            complete ? "bg-emerald-500/50 opacity-100" : "bg-cyan-500/15 opacity-50",
          )}
        />
        <HuntSuccessBurst foundCount={foundCount} complete={complete} />
        <motion.div
          animate={complete ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-lg flex items-center justify-center shadow-2xl backdrop-blur-xl overflow-hidden transition-colors duration-500",
            complete ? "bg-emerald-900/80" : "bg-zinc-900/90",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={targetNote}
              initial={{ opacity: 0, y: 10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.85 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_18px_rgba(255,255,255,0.5)]"
            >
              {targetNote}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>

      {description && (
        <p className="text-center text-sm font-semibold tracking-wide text-zinc-200">{description}</p>
      )}

      <ClickableFretboard
        startFret={startFret}
        endFret={endFret}
        strings={strings}
        foundKeys={foundKeys}
        totalTargets={totalTargets}
        lastClick={lastClick}
        onCellClick={registerFretClick}
      />

      <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {totalTargets > 0 && (
          <p className={cn("text-sm font-extrabold tracking-wide transition-colors", complete ? "text-emerald-300" : "text-zinc-300")}>
            {complete ? "★ all positions found" : `${foundCount} / ${totalTargets} found`}
          </p>
        )}
        {isRotating && (
          <button
            type="button"
            onClick={advanceHunt}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-white/20 active:scale-95"
          >
            Next <FaArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
        {process.env.NODE_ENV !== "production" && !complete && totalTargets > 0 && (
          <button
            type="button"
            onClick={() => targetPositions.forEach((p) => registerFretClick(p.string, p.fret))}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-amber-400/40 bg-transparent px-4 py-2 text-xs font-bold tracking-wide text-amber-300/80 transition-colors hover:bg-amber-400/10"
            title="Dev-only: instantly clicks every valid position for this note"
          >
            🧪 Complete instantly (dev)
          </button>
        )}
        {onDevPassExam && (
          <button
            type="button"
            onClick={onDevPassExam}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-emerald-400/50 bg-transparent px-4 py-2 text-xs font-bold tracking-wide text-emerald-300/90 transition-colors hover:bg-emerald-400/10"
            title="Dev-only: ends the WHOLE EXAM right now and runs the normal finish flow"
          >
            🏁 Pass whole exam (dev)
          </button>
        )}
      </div>
    </div>
  );
}
