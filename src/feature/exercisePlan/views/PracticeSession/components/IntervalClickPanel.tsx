import { Checkbox } from "assets/components/ui/checkbox";
import { Label } from "assets/components/ui/label";
import { cn } from "assets/lib/utils";
import { playGuitarNotePreview, preloadGuitarNotePreview } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";
import { intervalBySemitones, semitonesBetween } from "feature/exercisePlan/intervals/intervalDefinitions";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaArrowRight, FaVolumeUp } from "react-icons/fa";

import { CLICK_EXAM_MISTAKE_LIMIT, useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import {
  loadClickHuntNoteSoundPreference,
  midiForPosition,
  pickReferenceMidi,
  saveClickHuntNoteSoundPreference,
} from "../helpers/clickHuntNoteSound";
import { isWithinReach, reachZoneKeys } from "../helpers/clickTargets";
import { INTERVAL_PHRASE_HOLD_MS, playIntervalPhrase } from "../helpers/intervalPreview";
import { ClickableFretboard, FullNeckToggle, useShowFullNeck } from "./ClickableFretboard";
import { HuntStage, HuntStats } from "./HuntStage";
import { HuntSuccessBurst } from "./HuntSuccessBurst";

interface IntervalClickPanelProps {
  /** Fallbacks for before the rotation hook has published its first prompt. */
  rootNote: string;
  intervalLabel?: string;
  targetNote: string;
  startFret: number;
  endFret: number;
  strings?: number[];
  /** Whether the session timer is running — the prompt countdown is frozen until
   *  it is, even though clicking always works. */
  isPlaying: boolean;
  /** Shows the mistake counter and puts it under the exam's 3-strike limit. */
  isExamMode?: boolean;
  /** Dev-only (non-production): fast-tracks the WHOLE EXAM finish flow instantly. */
  onDevPassExam?: () => void;
}

type StepState = "waiting" | "active" | "done";

/** How long a solved round stays up when the notes are muted — just the reveal to
 *  read. With sound on it is the interval phrase that sets the pace instead. */
const SILENT_ADVANCE_MS = 1400;
/** A beat of silence between the previous round's phrase and the new prompt's root,
 *  so the two never blur into one another. */
const PROMPT_ROOT_DELAY_MS = 280;

const STEP_TILE_STYLES: Record<StepState, string> = {
  waiting: "bg-zinc-800/40 text-zinc-500",
  active: "bg-cyan-500/15 text-cyan-200",
  done: "bg-emerald-500/15 text-emerald-200",
};

interface StepTileProps {
  step: number;
  caption: string;
  value: string;
  state: StepState;
  progress?: string;
  /** Fires the found/complete flourish on the tile the player is working on. */
  burst?: { foundCount: number; complete: boolean };
}

function StepTile({ step, caption, value, state, progress, burst }: StepTileProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {burst && <HuntSuccessBurst foundCount={burst.foundCount} complete={burst.complete} />}
        <motion.div
          animate={state === "done" ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-lg transition-colors duration-500 sm:h-20 sm:w-20",
            STEP_TILE_STYLES[state],
          )}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.85 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              {value}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className={cn("text-sm font-bold", state === "waiting" ? "text-zinc-500" : "text-zinc-200")}>
          {step}. {caption}
        </span>
        {progress && (
          <span className={cn("text-xs font-semibold tabular-nums", state === "done" ? "text-emerald-400" : "text-zinc-400")}>
            {progress}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The interval drill's screen: a root + an interval as the prompt, and the shared
 * neck diagram as the answer sheet. Step 1 maps every position of the root; step 2
 * opens by itself and asks for the note the interval lands on — whose name only
 * appears once it has been found, because working it out is the exercise.
 *
 * The located roots stay on the board in amber through step 2, so the answer is
 * read off real shapes rather than off a note-name label.
 */
export function IntervalClickPanel({
  rootNote: rootNoteProp,
  intervalLabel: intervalLabelProp,
  targetNote: targetNoteProp,
  startFret,
  endFret,
  strings,
  isPlaying,
  isExamMode,
  onDevPassExam,
}: IntervalClickPanelProps) {
  const { intervalClickHunt, huntTarget, customGoalPrompt, noteHuntSecondsLeft, advanceHunt, registerIntervalClick } =
    useNoteMatchingContext();

  const rootNote = customGoalPrompt?.title ?? rootNoteProp;
  const targetNote = huntTarget ?? targetNoteProp;
  const intervalLabel = customGoalPrompt?.subtitle ?? intervalLabelProp ?? "";
  const semitones = semitonesBetween(rootNote, targetNote);
  const interval = intervalBySemitones(semitones);

  // Memoized so the audio effects below don't see fresh arrays every render.
  const rootPositions = useMemo(() => intervalClickHunt?.rootPositions ?? [], [intervalClickHunt?.rootPositions]);
  const intervalPositions = useMemo(
    () => intervalClickHunt?.intervalPositions ?? [],
    [intervalClickHunt?.intervalPositions],
  );
  const foundRootKeys = intervalClickHunt?.foundRootKeys ?? [];
  const foundIntervalKeys = intervalClickHunt?.foundIntervalKeys ?? [];
  const anchor = intervalClickHunt?.anchor ?? null;
  const lastClick = intervalClickHunt?.lastClick ?? null;
  const score = intervalClickHunt?.gameState.score ?? 0;
  const mistakeCount = intervalClickHunt?.mistakeCount ?? 0;
  const phase = intervalClickHunt?.phase ?? "root";
  const complete = intervalClickHunt?.complete ?? false;

  const onInterval = phase === "interval";
  const rootFound = foundRootKeys.length;
  const intervalFound = foundIntervalKeys.length;
  const isRotating = noteHuntSecondsLeft !== null;

  // Step 2 only accepts the interval within a hand's reach of the root the player
  // placed, so the board shades that span — the whole rectangle, answers and all,
  // which shows where to look without pointing at the note. Skipped when the span
  // was too tight to hold an answer and the hunt fell back to the whole window.
  const zoneKeys = useMemo(() => {
    if (!anchor || !onInterval || complete) return undefined;
    if (!intervalPositions.every((p) => isWithinReach(p, anchor))) return undefined;
    return reachZoneKeys(anchor, startFret, endFret, strings);
  }, [anchor, onInterval, complete, intervalPositions, startFret, endFret, strings]);

  // Once both steps are solved, move on by ourselves — but not until the interval
  // phrase has said its piece (see the audio section below). Rotating in the middle
  // of it is what left one round's notes running into the next.
  const advanceHuntRef = useRef(advanceHunt);
  useEffect(() => {
    advanceHuntRef.current = advanceHunt;
  });

  // ── Audio ──────────────────────────────────────────────────────────────────
  // Shares the click drills' single "play notes for me" preference, so the choice
  // is made once and carries across both exercise families.
  const [noteSound, setNoteSound] = useState(loadClickHuntNoteSoundPreference);
  const toggleNoteSound = (enabled: boolean) => {
    setNoteSound(enabled);
    saveClickHuntNoteSoundPreference(enabled);
  };

  useEffect(() => {
    preloadGuitarNotePreview();
  }, []);

  const rootMidi = useMemo(() => pickReferenceMidi(rootPositions, rootNote), [rootPositions, rootNote]);
  const playRoot = useCallback(() => {
    if (rootMidi !== null) playGuitarNotePreview(rootMidi);
  }, [rootMidi]);

  // Sound the root as a new prompt appears — the interval is measured FROM it, so
  // hearing it first is the ear-training half of the drill. Gated on the session
  // actually running: the panel is live well before Play is pressed. Keyed on the
  // prompt as well, so a round whose root repeats the last one's still opens with
  // it, and delayed a beat so it lands in silence rather than on the tail of the
  // phrase that closed the previous round.
  const promptKey = `${rootNote}>${targetNote}`;
  useEffect(() => {
    if (!noteSound || !isPlaying) return undefined;
    const t = setTimeout(playRoot, PROMPT_ROOT_DELAY_MS);
    return () => clearTimeout(t);
  }, [noteSound, isPlaying, playRoot, promptKey]);

  // The lowest root the player actually located — the pitch the closing phrase is
  // measured from, so what they hear matches the shape sitting on the board.
  // Keyed by the found cells' contents, not the array's identity: a later click
  // hands down a fresh array with the same roots in it, and that must not count
  // as a change or the phrase replays.
  const foundRootsKey = foundRootKeys.join(",");
  const anchorMidi = useMemo(() => {
    const found = foundRootsKey
      .split(",")
      .filter(Boolean)
      .map((key) => {
        const [string, fret] = key.split("-").map(Number);
        return midiForPosition(string, fret);
      })
      .filter((midi) => midi >= 0);
    return found.length > 0 ? Math.min(...found) : null;
  }, [foundRootsKey]);

  // The "hear the root" button follows the board: before a root is placed there is
  // only the window's reference pitch, afterwards the very note the interval is
  // being measured from — the one the closing phrase starts on, so the button and
  // the drill never disagree about which octave the root sits in.
  const heardRootMidi = anchorMidi ?? rootMidi;
  const hearRoot = useCallback(() => {
    if (heardRootMidi !== null) playGuitarNotePreview(heardRootMidi);
  }, [heardRootMidi]);

  // Round solved → play the interval itself: root, target, then both together,
  // measured from the root sitting on the board. The cleanup silences it, so
  // rotating early (Next, or leaving the exercise) cuts the phrase off instead of
  // letting it ring over whatever comes next.
  useEffect(() => {
    if (!complete || !noteSound) return undefined;
    const base = anchorMidi ?? rootMidi;
    if (base === null || semitones < 0) return undefined;
    return playIntervalPhrase(base, base + semitones);
  }, [complete, noteSound, anchorMidi, rootMidi, semitones]);

  // Hold the solved round open until that phrase has finished; muted, there is only
  // the reveal to read.
  useEffect(() => {
    if (!complete) return undefined;
    const t = setTimeout(() => advanceHuntRef.current(), noteSound ? INTERVAL_PHRASE_HOLD_MS : SILENT_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [complete, noteSound]);

  // A correct click in step 1 sounds the pitch of the cell that was hit; wrong
  // clicks stay silent — the red flash already says enough. Step 2's click is silent
  // too: it is the click that solves the round, and the phrase above follows it
  // immediately. A loose note in front of that turned the ending into four notes in
  // a row with no shape to them.
  const handleCellClick = useCallback(
    (string: number, fret: number) => {
      if (noteSound && !onInterval && rootPositions.some((p) => p.string === string && p.fret === fret)) {
        const midi = midiForPosition(string, fret);
        if (midi >= 0) playGuitarNotePreview(midi);
      }
      registerIntervalClick(string, fret);
    },
    [noteSound, onInterval, rootPositions, registerIntervalClick],
  );

  const [showSemitones, setShowSemitones] = useState(false);
  const [showFullNeck, setShowFullNeck] = useShowFullNeck();

  const intervalName = interval?.name ?? intervalLabel.replace(" ↑", "");
  // Which strings are live is already obvious on the board (the rest sit behind a
  // scrim), so the prompt only points at it rather than listing string names.
  const scope = strings && strings.length < 6 ? " on the highlighted strings" : "";
  const stepPrompt = complete
    ? `${intervalName} above ${rootNote} = ${targetNote}`
    : onInterval
      ? `Now the ${intervalName} above that root — within reach of it`
      : `Click any ${rootNote}${scope}`;

  return (
    <HuntStage
      awaitingStart={!isPlaying}
      railClassName="xl:w-64"
      stats={
        <HuntStats
          score={score}
          mistakes={isExamMode ? { count: mistakeCount, limit: CLICK_EXAM_MISTAKE_LIMIT } : undefined}
          secondsLeft={isRotating ? noteHuntSecondsLeft : null}
          complete={complete}
        />
      }
      prompt={
        <div className="flex flex-col items-center gap-3">
          {/* The prompt: root, the interval between them, and the answer slot. */}
          <div className="flex items-start justify-center gap-3 sm:gap-5">
            <StepTile
              step={1}
              caption="Root"
              value={rootNote}
              state={onInterval ? "done" : "active"}
              progress={onInterval ? "placed" : "pick one spot"}
              burst={onInterval ? undefined : { foundCount: rootFound, complete: false }}
            />

            <div className="flex flex-col items-center gap-1 pt-5 sm:pt-6">
              {interval && (
                <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-extrabold text-cyan-400">
                  {interval.degree}
                </span>
              )}
              <FaArrowRight className="h-4 w-4 text-zinc-500" aria-hidden />
              <span className="max-w-[6rem] text-center text-xs font-bold leading-tight text-zinc-200">
                {intervalLabel}
              </span>
              {showSemitones && semitones >= 0 && (
                <span className="text-xs font-semibold tabular-nums text-zinc-400">+{semitones} frets</span>
              )}
            </div>

            <StepTile
              step={2}
              caption="Target"
              value={complete ? targetNote : "?"}
              state={complete ? "done" : onInterval ? "active" : "waiting"}
              progress={complete ? "found" : onInterval ? "from that root" : undefined}
              burst={onInterval ? { foundCount: intervalFound, complete } : undefined}
            />
          </div>

          <p className={cn("text-center text-sm font-bold", complete ? "text-emerald-400" : "text-zinc-200")}>
            {stepPrompt}
          </p>
        </div>
      }
      board={
        <ClickableFretboard
          startFret={startFret}
          endFret={endFret}
          strings={strings}
          foundKeys={onInterval ? foundIntervalKeys : foundRootKeys}
          // One click settles either step, so the board's "solved" state is a single find.
          totalTargets={1}
          markedKeys={onInterval ? foundRootKeys : undefined}
          markedLabel="R"
          zoneKeys={zoneKeys}
          lastClick={lastClick}
          onCellClick={handleCellClick}
          showFullNeck={showFullNeck}
        />
      }
      footer={
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {isRotating && (
            <button
              type="button"
              onClick={advanceHunt}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-5 py-2.5 text-sm font-bold text-zinc-100 transition-colors hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Next <FaArrowRight className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          )}

          {/* Settings — quieter than Next and parked next to it, so they stay
              reachable without sitting in the reading path above the neck. */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:ml-2">
            <button
              type="button"
              onClick={hearRoot}
              disabled={heardRootMidi === null}
              className="inline-flex items-center gap-2 rounded bg-zinc-800/60 px-3 py-1.5 text-xs font-bold text-zinc-100 transition-colors hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              title="Play the root note the interval is measured from">
              <FaVolumeUp className="h-3 w-3 text-zinc-400" /> Hear the root
            </button>
            <button
              type="button"
              onClick={() => setShowSemitones((v) => !v)}
              className="rounded bg-zinc-800/60 px-3 py-1.5 text-xs font-bold text-zinc-100 transition-colors hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              {showSemitones ? "Hide the distance" : "How far is it?"}
            </button>
            <FullNeckToggle value={showFullNeck} onChange={setShowFullNeck} />
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="interval-click-note-sound"
                checked={noteSound}
                onCheckedChange={(checked) => toggleNoteSound(checked === true)}
              />
              <Label htmlFor="interval-click-note-sound" className="cursor-pointer text-xs font-semibold text-zinc-400">
                Autoplay
              </Label>
            </div>
          </div>

          {process.env.NODE_ENV !== "production" && !complete && (
            <button
              type="button"
              onClick={() => {
                // One cell settles the step — clicking the rest would only rack up
                // mistakes on cells the step no longer accepts.
                const [first] = onInterval ? intervalPositions : rootPositions;
                if (first) registerIntervalClick(first.string, first.fret);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/20"
              title="Dev-only: instantly solves the current step">
              🧪 Solve this step (dev)
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
      }
    />
  );
}
