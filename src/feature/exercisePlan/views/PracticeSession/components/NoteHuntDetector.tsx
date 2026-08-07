import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { FaArrowRight } from "react-icons/fa";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { huntPositions } from "../hooks/useNoteHunt";
import { ClickableFretboard } from "./ClickableFretboard";
import { DetectionWave } from "./DetectionWave";
import { HuntSuccessBurst } from "./HuntSuccessBurst";

interface NoteHuntDetectorProps {
  targetNote: string;
  description?: string;
  isMicEnabled: boolean;
  isListening: boolean;
  /** Dev-only (non-production): fast-tracks the WHOLE EXAM finish flow instantly.
   *  Undefined outside exam mode. */
  onDevPassExam?: () => void;
}

const SUPERSCRIPT = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const toSuperscript = (n: number) =>
  String(n).split("").map(d => SUPERSCRIPT[Number(d)] ?? d).join("");

// Index = string number (1 = high e … 6 = low E).
const STRING_NAMES = ["", "high e", "B", "G", "D", "A", "low E"];
const STRING_ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th", "6th"];

export function NoteHuntDetector({
  targetNote: targetNoteProp,
  description,
  isMicEnabled,
  isListening,
  onDevPassExam,
}: NoteHuntDetectorProps) {
  const { noteHunt, noteHuntSecondsLeft, noteHuntRegion, noteHuntStrings, customGoalPrompt, huntTarget, chromaticProgress, volumeRef, advanceHunt, markNoteHuntOctave } = useNoteMatchingContext();

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

  // The one string the exercise is asking for, when it asks for one — drives the
  // badge under the card and the neck's own highlighting.
  const soleString = noteHuntStrings?.length === 1 ? noteHuntStrings[0] : null;

  // Every fretboard cell the target lives on inside the region (and on the
  // strings in play). Found octaves map straight back onto cells because the mic
  // reports the octave it heard; unfound ones stay blank — the neck never gives
  // the answer away.
  const regionPositions = useMemo(
    () =>
      noteHuntRegion
        ? huntPositions(targetNote, [noteHuntRegion.startFret, noteHuntRegion.endFret], noteHuntStrings ?? undefined)
        : [],
    [targetNote, noteHuntRegion, noteHuntStrings],
  );
  const foundKeys = regionPositions.filter(p => foundOctaves.includes(p.octave)).map(p => `${p.string}-${p.fret}`);
  const liveCell = isMatch && detectedOctave !== null
    ? regionPositions.find(p => p.octave === detectedOctave)
    : undefined;
  // Only meaningful where the goal narrows the octaves down — in whole-neck mode
  // every octave the guitar can produce already counts.
  const wrongOctave = !isPrompt && !!noteHuntRegion && isMatch && detectedOctave !== null
    && octaves.length > 0 && !octaves.includes(detectedOctave);

  return (
    <div className={cn("flex w-full flex-col items-center gap-2.5 sm:gap-4", noteHuntRegion ? "max-w-6xl" : "max-w-sm")}>
      {/* Score (mic only) + countdown */}
      <div className="flex items-center justify-center gap-3">
        {chromaticProgress && (
          <span
            className={cn(
              "rounded px-3.5 py-1.5 text-base font-extrabold tracking-wide",
              chromaticProgress.found >= chromaticProgress.total ? "bg-emerald-500/20 text-emerald-300" : "bg-cyan-500/15 text-cyan-300",
            )}
          >
            {chromaticProgress.found}/{chromaticProgress.total} notes
          </span>
        )}
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
      ) : soleString ? (
        // Says the quiet part loudly: the note alone isn't the task — the string
        // is half of it. Replaces the prose description, which said the same.
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-lg bg-cyan-500/15 px-4 py-2 text-base font-extrabold tracking-wide text-cyan-200">
            Play it on the {STRING_NAMES[soleString]} string
            <span className="ml-1.5 font-bold text-cyan-400/70">({STRING_ORDINALS[soleString]})</span>
          </span>
          {noteHuntRegion && (
            <span className="rounded-lg bg-zinc-800/80 px-4 py-2 text-base font-bold tracking-wide text-zinc-300">
              frets {noteHuntRegion.startFret}–{noteHuntRegion.endFret}
            </span>
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

      {/* The right note in an octave the goal doesn't cover — i.e. found on the
          wrong string. The waveform goes green either way (it hears the note),
          so without this the score just silently refuses to move. */}
      {isMicEnabled && wrongOctave && (
        <p className="text-center text-sm font-bold tracking-wide text-amber-300">
          Right note, wrong octave — that was {targetNote}{toSuperscript(detectedOctave!)}.{" "}
          {soleString
            ? `The ${STRING_NAMES[soleString]} string gives you ${targetNote}${toSuperscript(octaves[0])}.`
            : `Stay inside frets ${noteHuntRegion?.startFret}–${noteHuntRegion?.endFret}.`}
        </p>
      )}

      {/* Region neck — the click drills' fretboard, read-only: it shows WHERE to
          search and which string is in play, and only fills in a position once
          the mic has actually heard it there. */}
      {noteHuntRegion && (
        <ClickableFretboard
          startFret={noteHuntRegion.startFret}
          endFret={noteHuntRegion.endFret}
          strings={noteHuntStrings ?? undefined}
          foundKeys={foundKeys}
          totalTargets={regionPositions.length}
          lastClick={null}
          liveKey={liveCell ? `${liveCell.string}-${liveCell.fret}` : null}
          title={
            isPrompt ? (
              <>FIND THE TARGET NOTE IN FRETS {noteHuntRegion.startFret}–{noteHuntRegion.endFret}</>
            ) : soleString ? (
              <>
                PLAY <span className="text-cyan-300">{targetNote}</span> ON THE{" "}
                <span className="text-cyan-300">{STRING_NAMES[soleString]}</span> STRING
              </>
            ) : (
              <>
                PLAY <span className="text-cyan-300">{targetNote}</span> IN FRETS {noteHuntRegion.startFret}–{noteHuntRegion.endFret}
              </>
            )
          }
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
      )}
    </div>
  );
}
