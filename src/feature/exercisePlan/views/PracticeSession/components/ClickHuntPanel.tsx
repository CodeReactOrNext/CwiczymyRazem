import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { playGuitarNotePreview, preloadGuitarNotePreview } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CLICK_EXAM_MISTAKE_LIMIT, useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { EXAM_HINT_MS, PRACTICE_HINT_MS, unfoundTwinEStrings } from "../helpers/clickHuntHints";
import {
  loadClickHuntNoteSoundPreference,
  midiForPosition,
  pickReferenceMidi,
  saveClickHuntNoteSoundPreference,
} from "../helpers/clickHuntNoteSound";
import { ClickableFretboard, useShowFullNeck } from "./ClickableFretboard";
import { HuntStage, HuntStats, HuntTargetCard, HuntViewMenu } from "./HuntStage";

interface ClickHuntPanelProps {
  targetNote: string;
  description?: string;
  startFret: number;
  endFret: number;
  strings?: number[];
  /** Whether the session timer is running. While it isn't, the board sits under
   *  the Start gate and clicks don't score — same as every other exercise. */
  isPlaying: boolean;
  /** Starts the session clock, from the Start gate over the board. */
  onStart: () => void;
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

type HintLevel = 0 | 1 | 2;

/**
 * Click-to-answer counterpart to NoteHuntDetector: shows the target note name
 * and a clickable fretboard diagram instead of mic-driven pitch detection.
 */
export function ClickHuntPanel({ targetNote: targetNoteProp, description, startFret, endFret, strings, isPlaying, onStart, isExamMode, onDevPassExam }: ClickHuntPanelProps) {
  const { t } = useTranslation("session");
  const { clickHunt, huntTarget, noteHuntSecondsLeft, noteHuntSecondsTotal, advanceHunt, registerFretClick } = useNoteMatchingContext();
  const mistakeCount = clickHunt?.mistakeCount ?? 0;

  const targetNote = huntTarget ?? targetNoteProp;
  // Memoized so the note-audio hooks below don't see a fresh array every render.
  const targetPositions = useMemo(() => clickHunt?.targetPositions ?? [], [clickHunt?.targetPositions]);
  // Stable when nothing was found, so the memoised neck skips the countdown ticks.
  const foundKeys = useMemo(() => clickHunt?.foundKeys ?? [], [clickHunt?.foundKeys]);
  const lastClick = clickHunt?.lastClick ?? null;
  const score = clickHunt?.gameState.score ?? 0;

  const foundCount = foundKeys.length;
  const totalTargets = targetPositions.length;
  const complete = totalTargets > 0 && foundCount >= totalTargets;
  const isRotating = noteHuntSecondsLeft !== null;

  const [showFullNeck, setShowFullNeck] = useShowFullNeck();

  // ── Hints for a player who has stopped finding anything ────────────────────
  // First "check every string", then, when the miss is the other E string, a
  // pointer at its name. Neither shows where the note is: in an exam that would
  // hand over the answer. Keyed by the round and what is found in it, so every
  // find (and every new note) starts the wait over.
  const hintKey = `${targetNote}|${foundKeys.join(",")}`;
  const [hint, setHint] = useState<{ key: string; level: HintLevel }>({ key: "", level: 0 });
  const hintLevel: HintLevel = hint.key === hintKey ? hint.level : 0;
  useEffect(() => {
    if (!isPlaying || complete || totalTargets === 0) return undefined;
    const [first, second] = isExamMode ? EXAM_HINT_MS : PRACTICE_HINT_MS;
    const timers = [
      setTimeout(() => setHint({ key: hintKey, level: 1 }), first),
      setTimeout(() => setHint({ key: hintKey, level: 2 }), second),
    ];
    return () => timers.forEach(clearTimeout);
  }, [hintKey, isPlaying, complete, totalTargets, isExamMode]);

  const twinStrings = useMemo(() => unfoundTwinEStrings(targetPositions, foundKeys), [targetPositions, foundKeys]);
  const pointsAtString = hintLevel === 2 && twinStrings.length > 0;
  const hintText = hintLevel === 0 ? null : pointsAtString ? t("click_hunt.hint_same_e") : t("click_hunt.hint_scan");

  // Once every position is found, move on to the next note by ourselves after
  // a short beat — instead of waiting on the shared rotation timer's slower
  // fast-forward or making the player press "Next" every time.
  const advanceHuntRef = useRef(advanceHunt);
  useEffect(() => { advanceHuntRef.current = advanceHunt; });
  useEffect(() => {
    if (!complete) return undefined;
    const timer = setTimeout(() => advanceHuntRef.current(), 900);
    return () => clearTimeout(timer);
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
      // The gate covers the board while stopped; this keeps a stray click from
      // scoring in the frame it fades in or out.
      if (!isPlaying) return;
      if (noteSound && targetPositions.some((p) => p.string === string && p.fret === fret)) {
        const midi = midiForPosition(string, fret);
        if (midi >= 0) playGuitarNotePreview(midi);
      }
      registerFretClick(string, fret);
    },
    [isPlaying, noteSound, targetPositions, registerFretClick],
  );

  // With more than one position, the count leads the instruction: "Click every
  // string where…" read as one cell, and players stopped after the first.
  const singleFret = startFret === endFret;
  const instruction =
    totalTargets > 1 && singleFret
      ? totalTargets === 2
        ? t("click_hunt.find_both_on_fret", { note: targetNote, fret: startFret })
        : t("click_hunt.find_all_on_fret", { note: targetNote, fret: startFret, count: totalTargets })
      : stripFretRange(description);
  const progressLine =
    totalTargets < 2
      ? null
      : complete
        ? t("click_hunt.all_found")
        : foundCount > 0
          ? t("click_hunt.left", { count: totalTargets - foundCount })
          : singleFret
            ? null
            : t("click_hunt.to_find", { count: totalTargets });

  return (
    <HuntStage
      awaitingStart={!isPlaying}
      onStart={onStart}
      stats={
        <HuntStats
          score={score}
          mistakes={isExamMode ? { count: mistakeCount, limit: CLICK_EXAM_MISTAKE_LIMIT } : undefined}
          secondsLeft={isRotating ? noteHuntSecondsLeft : null}
          secondsTotal={noteHuntSecondsTotal}
          complete={complete}
          trailing={
            // Everything that used to sit under the neck. The board is the last
            // thing on the stage now, so nothing pulls the eyes down off it.
            <div className="flex flex-wrap items-center gap-2">
              {/* An exam round can't be skipped: leaving one unanswered is a miss. */}
              {isRotating && !isExamMode && (
                <Button type="button" variant="ghost" size="sm" onClick={advanceHunt}>
                  {t("hunt.next")} <ArrowRight aria-hidden />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={playReference}
                disabled={referenceMidi === null}
                title={t("click_hunt.play_note")}>
                <Volume2 aria-hidden className="text-zinc-400" /> {t("click_hunt.hear_it")}
              </Button>
              <HuntViewMenu
                showFullNeck={showFullNeck}
                onShowFullNeckChange={setShowFullNeck}
                noteSound={noteSound}
                onNoteSoundChange={toggleNoteSound}
              />
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
      }
      prompt={
        <div className="flex flex-col items-center gap-4 shortwide:flex-row">
          <HuntTargetCard value={targetNote} complete={complete} foundCount={foundCount} animationKey={targetNote} total={totalTargets} />
          <div className="flex flex-col items-center gap-2 text-center shortwide:max-w-[14rem] shortwide:items-start shortwide:text-left">
            {instruction && <p className="text-sm font-bold text-zinc-200 shortwide:text-xs">{instruction}</p>}
            {progressLine && (
              <p className={cn("text-sm font-semibold tabular-nums shortwide:text-xs", complete ? "text-emerald-400" : "text-zinc-400")}>
                {progressLine}
              </p>
            )}
            <p aria-live="polite" className={cn(!hintText && "sr-only")}>
              {hintText && (
                <span className="inline-block max-w-[16rem] rounded-lg bg-white px-3 py-2 text-sm font-bold leading-snug text-black shortwide:text-xs">
                  {hintText}
                </span>
              )}
            </p>
          </div>
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
          pointedStrings={pointsAtString ? twinStrings : undefined}
        />
      }
    />
  );
}
