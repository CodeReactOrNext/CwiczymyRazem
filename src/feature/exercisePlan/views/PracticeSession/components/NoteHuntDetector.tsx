import { cn } from "assets/lib/utils";
import { useMemo } from "react";
import { FaArrowRight, FaMicrophone } from "react-icons/fa";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { huntPositions } from "../hooks/useNoteHunt";
import { ClickableFretboard, FullNeckToggle, LeftyToggle, useShowFullNeck } from "./ClickableFretboard";
import { DetectionWave } from "./DetectionWave";
import { HuntPromptCard, HuntStage, HuntStats, HuntSteps, HuntTargetCard } from "./HuntStage";

interface NoteHuntDetectorProps {
  targetNote: string;
  description?: string;
  isMicEnabled: boolean;
  isListening: boolean;
  /** Session timer running. The standing instruction under the card is written
   *  to be read before starting, so it drops away once the round is live and
   *  leaves the target sitting on its own. */
  isPlaying?: boolean;
  /** Dev-only (non-production): fast-tracks the WHOLE EXAM finish flow instantly.
   *  Undefined outside exam mode. */
  onDevPassExam?: () => void;
}

// Index = string number (1 = high e … 6 = low E).
const STRING_NAMES = ["", "high e", "B", "G", "D", "A", "low E"];
const STRING_ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th", "6th"];

const SUPERSCRIPT = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const toSuperscript = (n: number) =>
  String(n).split("").map(d => SUPERSCRIPT[Number(d)] ?? d).join("");

export function NoteHuntDetector({
  targetNote: targetNoteProp,
  description,
  isMicEnabled,
  isListening,
  isPlaying,
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

  const [showFullNeck, setShowFullNeck] = useShowFullNeck();

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

  const stats = (
    <HuntStats score={isMicEnabled ? score : undefined} secondsLeft={isRotating ? noteHuntSecondsLeft : null} complete={complete}>
      {chromaticProgress && (
        <span
          className={cn(
            "rounded px-3 py-1 text-sm font-extrabold tabular-nums",
            chromaticProgress.found >= chromaticProgress.total
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-cyan-500/10 text-cyan-400",
          )}>
          {chromaticProgress.found}/{chromaticProgress.total} notes
        </span>
      )}
    </HuntStats>
  );

  const prompt = (
    <div className="flex flex-col items-center gap-3">
      {isPrompt ? (
        <>
          {/* Chord (or root) and the degree asked for, side by side at the same
              size: working the degree out is the drill, so it is not a footnote
              to the chord. The answer takes the degree's tile once it's played. */}
          <HuntPromptCard
            title={customGoalPrompt!.title}
            label={customGoalPrompt!.subtitle}
            answer={solved ? targetNote : null}
            complete={complete}
            foundCount={foundUnits}
          />

          <div className="flex flex-col items-center gap-2">
            {customGoalPrompt!.steps && <HuntSteps {...customGoalPrompt!.steps} />}
            {/* The chord drills ask for a degree of the chord on the card, not an
                interval above a note, so they set their own line here. Gone once
                the round is live: by then it has been read, and the pair of tiles
                already says what to do. */}
            {!isPlaying && (
              <p className="text-center text-sm font-semibold text-zinc-400">
                {description ?? "Play the note the interval lands on"}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <HuntTargetCard
            value={targetNote}
            complete={complete}
            foundCount={foundUnits}
            animationKey={targetNote}
          />

          <div className="flex flex-col items-center gap-2">
            {/* Says the quiet part loudly: the note alone isn't the task — the
                string is half of it. Replaces the prose description, which said
                the same thing. */}
            {soleString ? (
              <p className="text-center text-sm font-bold text-zinc-200">
                Play it on the <span className="text-cyan-400">{STRING_NAMES[soleString]}</span> string
                <span className="ml-1 font-semibold text-zinc-500">({STRING_ORDINALS[soleString]})</span>
              </p>
            ) : (
              !isPlaying && description && (
                <p className="text-center text-sm font-semibold text-zinc-200">{description}</p>
              )
            )}
          </div>
        </>
      )}

      {/* Detection status */}
      {!isMicEnabled ? (
        isPrompt ? (
          // The prompt drills have nothing to tick off by hand: without the mic
          // the only way out of a round is Reveal answer, which is the giving-up
          // path. So the requirement is stated outright rather than offered as a
          // hint the way the octave hunts can afford to.
          <div className="flex max-w-xs flex-col items-center gap-1 rounded-lg bg-amber-500/10 px-4 py-3 text-center">
            <span className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <FaMicrophone className="h-3.5 w-3.5" aria-hidden /> Needs Pitch Detect
            </span>
            <span className="text-xs font-semibold text-amber-200/70">
              Turn it on in the controls below so the app can hear your answer — without it you can only reveal it.
            </span>
          </div>
        ) : (
          <p className="text-center text-xs text-zinc-400">
            Enable the <span className="font-bold text-emerald-400">mic</span> in the controls below to auto-score, or
            check off octaves by hand.
          </p>
        )
      ) : !isListening ? (
        <p className="text-sm font-semibold text-zinc-200">Starting microphone…</p>
      ) : (
        <DetectionWave volumeRef={volumeRef} active={isListening} isMatch={isMatch} />
      )}

      {/* The right note in an octave the goal doesn't cover — i.e. found on the
          wrong string. The waveform goes green either way (it hears the note),
          so without this the score just silently refuses to move. */}
      {isMicEnabled && wrongOctave && (
        <p className="text-center text-xs font-bold text-amber-400">
          Right note, wrong octave — that was {targetNote}{toSuperscript(detectedOctave!)}.{" "}
          {soleString
            ? `The ${STRING_NAMES[soleString]} string gives you ${targetNote}${toSuperscript(octaves[0])}.`
            : `Stay inside frets ${noteHuntRegion?.startFret}–${noteHuntRegion?.endFret}.`}
        </p>
      )}
    </div>
  );

  // Octave chips — reference + (no-mic) tap-to-mark. Hidden in interval mode so
  // they don't reveal the answer.
  const octaveChips = !isPrompt && octaves.length > 0 && (
    <div className="flex flex-col items-center gap-1.5">
      {!isMicEnabled && (
        <span className="text-xs font-semibold text-zinc-400">
          Tap each octave you find{noteHuntRegion ? " in the region" : ""}
        </span>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {octaves.map(o => {
          const found = foundOctaves.includes(o);
          const isCurrent = isMatch && detectedOctave === o && !found;
          const chipClass = cn(
            "flex h-9 min-w-[2.75rem] items-center justify-center rounded px-2 text-base font-extrabold transition-colors",
            isCurrent
              ? "bg-emerald-500/30 text-emerald-100"
              : found
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-zinc-800/60 text-zinc-300",
          );
          const label = `${targetNote}${toSuperscript(o)}`;
          return !isMicEnabled ? (
            <button
              key={o}
              type="button"
              onClick={() => markNoteHuntOctave(o)}
              className={cn(chipClass, "cursor-pointer hover:brightness-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring")}>
              {label}
            </button>
          ) : (
            <span key={o} className={chipClass}>{label}</span>
          );
        })}
      </div>
    </div>
  );

  const footer = (isPrompt || octaves.length > 0 || isRotating) && (
    <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {octaveChips}

      {/* Progress */}
      {isPrompt ? (
        <div className="flex flex-col items-center gap-2">
          <p className={cn("text-sm font-extrabold transition-colors", solved ? "text-emerald-400" : "text-zinc-300")}>
            {solved ? "★ correct" : "Find the target note"}
          </p>
          {!isMicEnabled && !solved && octaves.length > 0 && (
            <button
              type="button"
              onClick={() => markNoteHuntOctave(octaves[0])}
              className="rounded bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Reveal answer
            </button>
          )}
        </div>
      ) : (
        octaves.length > 0 && (
          <p className={cn("text-sm font-extrabold transition-colors", allFound ? "text-emerald-400" : "text-zinc-300")}>
            {allFound
              ? (noteHuntRegion ? "★ all positions found" : "★ all octaves found")
              : `${foundInRange} / ${octaves.length} ${noteHuntRegion ? "found in region" : "octaves found"}`}
          </p>
        )
      )}

      {noteHuntRegion && (
        <>
          <FullNeckToggle value={showFullNeck} onChange={setShowFullNeck} />
          <LeftyToggle />
        </>
      )}

      {/* Manual advance — works with or without the mic */}
      {isRotating && (
        <button
          type="button"
          onClick={advanceHunt}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-5 py-2.5 text-sm font-bold text-zinc-100 transition-colors hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          Next <FaArrowRight className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      )}
      {onDevPassExam && (
        <button
          type="button"
          onClick={onDevPassExam}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20"
          title="Dev-only: ends the WHOLE EXAM right now and runs the normal finish flow">
          🏁 Pass whole exam (dev)
        </button>
      )}
    </div>
  );

  // No region → no neck diagram, and the side-rail layout has nothing to sit
  // beside: keep the original narrow single column.
  if (!noteHuntRegion) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        {stats}
        {prompt}
        {footer}
      </div>
    );
  }

  return (
    <HuntStage
      // Two tiles side by side need more than the default note-tile rail.
      railClassName={isPrompt ? "xl:w-64" : undefined}
      stats={stats}
      prompt={prompt}
      board={
        // Read-only: the neck shows WHERE to search and which string is in play,
        // and only fills in a position once the mic has actually heard it there.
        <ClickableFretboard
          startFret={noteHuntRegion.startFret}
          endFret={noteHuntRegion.endFret}
          strings={noteHuntStrings ?? undefined}
          foundKeys={foundKeys}
          totalTargets={regionPositions.length}
          lastClick={null}
          liveKey={liveCell ? `${liveCell.string}-${liveCell.fret}` : null}
          showFullNeck={showFullNeck}
        />
      }
      footer={footer}
    />
  );
}
