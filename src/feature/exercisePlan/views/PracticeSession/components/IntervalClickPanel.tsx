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
import { playIntervalPhrase } from "../helpers/intervalPreview";
import { ClickableFretboard } from "./ClickableFretboard";
import { HuntSuccessBurst } from "./HuntSuccessBurst";

interface IntervalClickPanelProps {
  /** Fallbacks for before the rotation hook has published its first prompt. */
  rootNote: string;
  intervalLabel?: string;
  targetNote: string;
  description?: string;
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
            "flex h-20 w-20 items-center justify-center rounded-lg transition-colors duration-500 sm:h-24 sm:w-24",
            STEP_TILE_STYLES[state],
          )}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.85 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="font-display text-4xl font-black tracking-tight sm:text-5xl">
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
  description,
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
  const lastClick = intervalClickHunt?.lastClick ?? null;
  const score = intervalClickHunt?.gameState.score ?? 0;
  const mistakeCount = intervalClickHunt?.mistakeCount ?? 0;
  const phase = intervalClickHunt?.phase ?? "root";
  const complete = intervalClickHunt?.complete ?? false;

  const onInterval = phase === "interval";
  const rootFound = foundRootKeys.length;
  const intervalFound = foundIntervalKeys.length;
  const isRotating = noteHuntSecondsLeft !== null;

  // Once both steps are solved, move on by ourselves after a beat — long enough
  // for the reveal and the interval phrase to land.
  const advanceHuntRef = useRef(advanceHunt);
  useEffect(() => {
    advanceHuntRef.current = advanceHunt;
  });
  useEffect(() => {
    if (!complete) return undefined;
    const t = setTimeout(() => advanceHuntRef.current(), 1800);
    return () => clearTimeout(t);
  }, [complete]);

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
  // actually running: the panel is live well before Play is pressed.
  useEffect(() => {
    if (!noteSound || !isPlaying) return;
    playRoot();
  }, [noteSound, isPlaying, playRoot]);

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

  // Round solved → play the interval itself: root, target, then both together.
  useEffect(() => {
    if (!complete || !noteSound) return undefined;
    const base = anchorMidi ?? rootMidi;
    if (base === null || semitones < 0) return undefined;
    return playIntervalPhrase(base, base + semitones);
  }, [complete, noteSound, anchorMidi, rootMidi, semitones]);

  // A correct click sounds the pitch of the cell that was hit; wrong clicks stay
  // silent — the red flash already says enough.
  const handleCellClick = useCallback(
    (string: number, fret: number) => {
      const active = onInterval ? intervalPositions : rootPositions;
      if (noteSound && active.some((p) => p.string === string && p.fret === fret)) {
        const midi = midiForPosition(string, fret);
        if (midi >= 0) playGuitarNotePreview(midi);
      }
      registerIntervalClick(string, fret);
    },
    [noteSound, onInterval, intervalPositions, rootPositions, registerIntervalClick],
  );

  const [showSemitones, setShowSemitones] = useState(false);

  const intervalName = interval?.name ?? intervalLabel.replace(" ↑", "");
  // Which strings are live is already obvious on the board (the rest sit behind a
  // scrim), so the prompt only points at it rather than listing string names.
  const scope = strings && strings.length < 6 ? " on the highlighted strings" : "";
  const stepPrompt = complete
    ? `A ${intervalName} above ${rootNote} is ${targetNote}`
    : onInterval
      ? `Now click every note a ${intervalName} above ${rootNote}${scope}`
      : `Click every ${rootNote} between frets ${startFret} and ${endFret}${scope}`;

  return (
    <div className="relative flex w-full max-w-6xl flex-col items-center gap-4 sm:gap-6">
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-zinc-950/40 backdrop-blur-[1px]">
            <span className="rounded-lg bg-zinc-900/90 px-5 py-3 text-center text-sm font-bold tracking-wide text-amber-200">
              ▶ Press Play below to start the timer
              <br />
              <span className="text-xs font-semibold text-zinc-400">you can click right away</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-3">
        <span className="rounded bg-amber-500/10 px-3.5 py-1.5 text-base font-extrabold tracking-wide text-amber-400">
          ★ {score} pts
        </span>
        {isExamMode && (
          <span className="rounded bg-zinc-800/40 px-3.5 py-1.5 text-base font-extrabold tabular-nums text-zinc-400">
            ✕ {mistakeCount}/{CLICK_EXAM_MISTAKE_LIMIT}
          </span>
        )}
        {isRotating && (
          <span
            className={cn(
              "rounded px-3.5 py-1.5 text-base font-extrabold tabular-nums transition-colors",
              complete
                ? "bg-emerald-500/15 text-emerald-400"
                : noteHuntSecondsLeft! <= 5
                  ? "animate-pulse bg-red-500/15 text-red-300"
                  : "bg-zinc-800/40 text-zinc-200",
            )}>
            {noteHuntSecondsLeft}s
          </span>
        )}
      </div>

      {/* The prompt: root, the interval between them, and the answer slot. */}
      <div className="flex items-start justify-center gap-4 sm:gap-8">
        <StepTile
          step={1}
          caption="Root"
          value={rootNote}
          state={onInterval ? "done" : "active"}
          progress={rootPositions.length > 0 ? `${rootFound} / ${rootPositions.length}` : undefined}
          burst={onInterval ? undefined : { foundCount: rootFound, complete: false }}
        />

        <div className="flex flex-col items-center gap-1.5 pt-6 sm:pt-7">
          {interval && (
            <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-extrabold text-cyan-400">
              {interval.degree}
            </span>
          )}
          <FaArrowRight className="h-4 w-4 text-zinc-500" aria-hidden />
          <span className="max-w-[7rem] text-center text-sm font-bold leading-tight text-zinc-200">
            {intervalLabel}
          </span>
          {showSemitones && semitones >= 0 && (
            <span className="text-xs font-semibold tabular-nums text-zinc-400">
              +{semitones} frets up one string
            </span>
          )}
        </div>

        <StepTile
          step={2}
          caption="Target"
          value={complete ? targetNote : "?"}
          state={complete ? "done" : onInterval ? "active" : "waiting"}
          progress={onInterval && intervalPositions.length > 0 ? `${intervalFound} / ${intervalPositions.length}` : undefined}
          burst={onInterval ? { foundCount: intervalFound, complete } : undefined}
        />
      </div>

      <div className="flex flex-col items-center gap-1">
        <p
          className={cn(
            "text-center text-sm font-bold tracking-wide sm:text-base",
            complete ? "text-emerald-400" : "text-zinc-200",
          )}>
          {stepPrompt}
        </p>
        {description && <p className="text-center text-xs font-semibold text-zinc-400">{description}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={playRoot}
          disabled={rootMidi === null}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-4 py-2 text-sm font-bold tracking-wide text-zinc-100 transition-colors hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          title="Play the root note the interval is measured from">
          <FaVolumeUp className="h-3.5 w-3.5 text-zinc-400" /> Hear the root
        </button>
        <button
          type="button"
          onClick={() => setShowSemitones((v) => !v)}
          className="rounded-lg bg-zinc-800/60 px-4 py-2 text-sm font-bold tracking-wide text-zinc-100 transition-colors hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          {showSemitones ? "Hide the distance" : "How far is it?"}
        </button>
        <div className="flex items-center gap-2">
          <Checkbox
            id="interval-click-note-sound"
            checked={noteSound}
            onCheckedChange={(checked) => toggleNoteSound(checked === true)}
          />
          <Label
            htmlFor="interval-click-note-sound"
            className="cursor-pointer text-xs font-semibold tracking-wide text-zinc-400">
            Play notes for me
          </Label>
        </div>
      </div>

      <ClickableFretboard
        startFret={startFret}
        endFret={endFret}
        strings={strings}
        foundKeys={onInterval ? foundIntervalKeys : foundRootKeys}
        totalTargets={onInterval ? intervalPositions.length : rootPositions.length}
        markedKeys={onInterval ? foundRootKeys : undefined}
        markedLabel="R"
        lastClick={lastClick}
        onCellClick={handleCellClick}
      />

      <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {isRotating && (
          <button
            type="button"
            onClick={advanceHunt}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-5 py-2.5 text-sm font-bold tracking-wide text-zinc-100 transition-colors hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            Next <FaArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        )}
        {process.env.NODE_ENV !== "production" && !complete && (
          <button
            type="button"
            onClick={() =>
              (onInterval ? intervalPositions : rootPositions).forEach((p) => registerIntervalClick(p.string, p.fret))
            }
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-xs font-bold tracking-wide text-amber-400 transition-colors hover:bg-amber-500/20"
            title="Dev-only: instantly solves the current step">
            🧪 Solve this step (dev)
          </button>
        )}
        {onDevPassExam && (
          <button
            type="button"
            onClick={onDevPassExam}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-xs font-bold tracking-wide text-emerald-400 transition-colors hover:bg-emerald-500/20"
            title="Dev-only: ends the WHOLE EXAM right now and runs the normal finish flow">
            🏁 Pass whole exam (dev)
          </button>
        )}
      </div>
    </div>
  );
}
