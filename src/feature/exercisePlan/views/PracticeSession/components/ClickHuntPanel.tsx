import { Checkbox } from "assets/components/ui/checkbox";
import { Label } from "assets/components/ui/label";
import { cn } from "assets/lib/utils";
import { playGuitarNotePreview, preloadGuitarNotePreview } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaArrowRight, FaVolumeUp } from "react-icons/fa";

import { CLICK_EXAM_MISTAKE_LIMIT, useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import {
  loadClickHuntNoteSoundPreference,
  midiForPosition,
  pickReferenceMidi,
  saveClickHuntNoteSoundPreference,
} from "../helpers/clickHuntNoteSound";
import { ClickableFretboard, FullNeckToggle, useShowFullNeck } from "./ClickableFretboard";
import { HuntStage, HuntStats, HuntTargetCard } from "./HuntStage";

interface ClickHuntPanelProps {
  targetNote: string;
  description?: string;
  startFret: number;
  endFret: number;
  strings?: number[];
  /** Whether the session timer is running — the note-rotation countdown is
   *  frozen until it is, even though clicking itself always works. */
  isPlaying: boolean;
  /** Shows the mistake counter and puts it under the exam's 3-strike limit. */
  isExamMode?: boolean;
  /** Dev-only (non-production): fast-tracks the WHOLE EXAM finish flow instantly.
   *  Undefined outside exam mode — distinct from the per-note "complete instantly"
   *  button below, which only solves the current rotating target. */
  onDevPassExam?: () => void;
}

// Exercise descriptions end with the fret window — "…on the B string (frets
// 0-12)". The neck numbers its own frets and shades the answerable ones, so the
// sentence doesn't need to carry it as well.
const stripFretRange = (description?: string) =>
  description?.replace(/\s*\(\s*frets?\b[^)]*\)\s*$/i, "").trim() || undefined;

/**
 * Click-to-answer counterpart to NoteHuntDetector: shows the target note name
 * and a clickable fretboard diagram instead of mic-driven pitch detection.
 */
export function ClickHuntPanel({ targetNote: targetNoteProp, description, startFret, endFret, strings, isPlaying, isExamMode, onDevPassExam }: ClickHuntPanelProps) {
  const { clickHunt, huntTarget, noteHuntSecondsLeft, advanceHunt, registerFretClick } = useNoteMatchingContext();
  const mistakeCount = clickHunt?.mistakeCount ?? 0;

  const targetNote = huntTarget ?? targetNoteProp;
  // Memoized so the note-audio hooks below don't see a fresh array every render.
  const targetPositions = useMemo(() => clickHunt?.targetPositions ?? [], [clickHunt?.targetPositions]);
  const foundKeys = clickHunt?.foundKeys ?? [];
  const lastClick = clickHunt?.lastClick ?? null;
  const score = clickHunt?.gameState.score ?? 0;

  const foundCount = foundKeys.length;
  const totalTargets = targetPositions.length;
  const complete = totalTargets > 0 && foundCount >= totalTargets;
  const isRotating = noteHuntSecondsLeft !== null;

  const [showFullNeck, setShowFullNeck] = useShowFullNeck();

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

  // ── Reference note audio ───────────────────────────────────────────────────
  // Asked for on Discord: hear the note the exercise is asking for. Opt-out and
  // persisted, so the choice is made once and carries into every later session.
  const [noteSound, setNoteSound] = useState(loadClickHuntNoteSoundPreference);
  const toggleNoteSound = (enabled: boolean) => {
    setNoteSound(enabled);
    saveClickHuntNoteSoundPreference(enabled);
  };

  // Fetch the sampled guitar as the panel opens, so the first note the player
  // hears is the real instrument and not the synthesised stand-in.
  useEffect(() => { preloadGuitarNotePreview(); }, []);

  const referenceMidi = useMemo(
    () => pickReferenceMidi(targetPositions, targetNote),
    [targetPositions, targetNote],
  );
  const playReference = useCallback(() => {
    if (referenceMidi !== null) playGuitarNotePreview(referenceMidi);
  }, [referenceMidi]);

  // Sound the new target as it appears. Deliberately gated on the session
  // actually running: the panel is live (and clickable) well before Play is
  // pressed, so without this the note fires the moment the exercise loads —
  // while the player is still reading the screen — and again on every remount.
  // The "Hear the note" button covers wanting it early.
  useEffect(() => {
    if (!noteSound || !isPlaying) return;
    playReference();
  }, [noteSound, isPlaying, playReference]);

  // A correct click sounds the pitch of the cell that was hit — same note as the
  // target, in whichever octave the player found it. Wrong clicks stay silent;
  // the red flash already says enough.
  const handleCellClick = useCallback(
    (string: number, fret: number) => {
      if (noteSound && targetPositions.some((p) => p.string === string && p.fret === fret)) {
        const midi = midiForPosition(string, fret);
        if (midi >= 0) playGuitarNotePreview(midi);
      }
      registerFretClick(string, fret);
    },
    [noteSound, targetPositions, registerFretClick],
  );

  const instruction = stripFretRange(description);

  return (
    <HuntStage
      awaitingStart={!isPlaying}
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
          <HuntTargetCard value={targetNote} complete={complete} foundCount={foundCount} animationKey={targetNote} />
          {instruction && <p className="text-center text-sm font-bold text-zinc-200">{instruction}</p>}
        </div>
      }
      board={
        <ClickableFretboard
          startFret={startFret}
          endFret={endFret}
          strings={strings}
          foundKeys={foundKeys}
          totalTargets={totalTargets}
          lastClick={lastClick}
          onCellClick={handleCellClick}
          showFullNeck={showFullNeck}
        />
      }
      footer={
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {totalTargets > 1 && (
            <p className={cn("text-sm font-extrabold tabular-nums transition-colors", complete ? "text-emerald-400" : "text-zinc-300")}>
              {complete ? "★ all positions found" : `${foundCount} / ${totalTargets} found`}
            </p>
          )}
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
              onClick={playReference}
              disabled={referenceMidi === null}
              className="inline-flex items-center gap-2 rounded bg-zinc-800/60 px-3 py-1.5 text-xs font-bold text-zinc-100 transition-colors hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              title="Play the note you are looking for">
              <FaVolumeUp className="h-3 w-3 text-zinc-400" /> Hear it
            </button>
            <FullNeckToggle value={showFullNeck} onChange={setShowFullNeck} />
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                id="click-hunt-note-sound"
                checked={noteSound}
                onCheckedChange={(checked) => toggleNoteSound(checked === true)}
              />
              <Label htmlFor="click-hunt-note-sound" className="cursor-pointer text-xs font-semibold text-zinc-400">
                Autoplay
              </Label>
            </div>
          </div>

          {process.env.NODE_ENV !== "production" && !complete && totalTargets > 0 && (
            <button
              type="button"
              onClick={() => targetPositions.forEach((p) => registerFretClick(p.string, p.fret))}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/20"
              title="Dev-only: instantly clicks every valid position for this note">
              🧪 Complete instantly (dev)
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
