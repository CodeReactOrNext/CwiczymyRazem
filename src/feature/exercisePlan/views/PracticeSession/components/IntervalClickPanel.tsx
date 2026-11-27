import { Button, PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { playGuitarNotePreview, preloadGuitarNotePreview } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";
import { intervalBySemitones, semitonesBetween } from "feature/exercisePlan/intervals/intervalDefinitions";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Lightbulb, Volume2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NOTES } from "utils/audio/noteUtils";

import { CLICK_EXAM_MISTAKE_LIMIT, useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { ANSWER_CHIME_LEAD_MS, playAnswerChime } from "../helpers/answerChime";
import {
  loadClickHuntNoteSoundPreference,
  midiForPosition,
  pickReferenceMidi,
  saveClickHuntNoteSoundPreference,
} from "../helpers/clickHuntNoteSound";
import { clickTargetKey, computeClickTargets, isWithinReach, reachZoneKeys, revealInterval, targetsWithinReach } from "../helpers/clickTargets";
import { INTERVAL_PHRASE_HOLD_MS, playIntervalPhrase } from "../helpers/intervalPreview";
import { ClickableFretboard, useShowFullNeck } from "./ClickableFretboard";
import { HuntRoundBar } from "./HuntRoundBar";
import { IntervalRoundStrip, ROUND_VERDICT_TONE } from "./HuntRoundStrip";
import { HuntAsk, HuntStage, HuntViewMenu } from "./HuntStage";
import { HuntSuccessBurst } from "./HuntSuccessBurst";
import { VERDICT_GROUND } from "./SessionVerdict";

interface IntervalClickPanelProps {
  /** Fallbacks for before the rotation hook has published its first prompt. */
  rootNote: string;
  intervalLabel?: string;
  targetNote: string;
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
  /** Dev-only (non-production): fast-tracks the WHOLE EXAM finish flow instantly. */
  onDevPassExam?: () => void;
}

/**
 * What a tile is doing. White is "this one now", which is also the step the player
 * is on; amber is the root they placed, in the colour it wears on the neck;
 * emerald is solved.
 */
type StepState = "waiting" | "active" | "anchor" | "done";

/** How long a solved round stays up when the notes are muted — just the reveal to
 *  read. With sound on it is the interval phrase that sets the pace instead. */
const SILENT_ADVANCE_MS = 1400;
/** A beat of silence between the previous round's phrase and the new prompt's root,
 *  so the two never blur into one another. */
const PROMPT_ROOT_DELAY_MS = 280;

/** How long a wrong click stays named, on the neck and under the instruction. */
const WRONG_CLICK_MS = 1800;

const STEP_TILE_STYLES: Record<StepState, string> = {
  waiting: "border-b-transparent bg-zinc-800 text-zinc-500",
  active: "border-b-zinc-400 bg-zinc-100 text-zinc-950",
  anchor: "border-b-amber-700 bg-amber-500 text-amber-950",
  done: "border-b-emerald-700 bg-emerald-400 text-emerald-950",
};

interface StepTileProps {
  value: string;
  state: StepState;
  /** Fires the found/complete flourish on the tile the player is working on. */
  burst?: { foundCount: number; complete: boolean };
  /** Makes the tile a key that sounds its note. */
  onHear?: () => void;
  hearLabel?: string;
}

function StepTile({ value, state, burst, onHear, hearLabel }: StepTileProps) {
  const face: ReactNode = (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 8, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.85 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="font-display text-4xl font-extrabold tracking-tight shortwide:text-2xl">
        {value}
      </motion.span>
    </AnimatePresence>
  );
  const tileClass = cn(
    PRESSABLE,
    "relative flex h-20 w-20 items-center justify-center rounded-lg border-b-[5px] transition-colors duration-base sm:h-24 sm:w-24 shortwide:h-14 shortwide:w-14 shortwide:border-b-4",
    STEP_TILE_STYLES[state],
  );

  return (
    <motion.div
      className="relative"
      animate={state === "done" || state === "anchor" ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}>
      {burst && <HuntSuccessBurst foundCount={burst.foundCount} complete={burst.complete} />}
      {onHear ? (
        <button
          type="button"
          onClick={onHear}
          aria-label={hearLabel}
          title={hearLabel}
          className={cn(tileClass, "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
          {face}
          <Volume2 aria-hidden className="absolute right-1.5 top-1.5 h-4 w-4 opacity-60 shortwide:right-1 shortwide:top-1 shortwide:h-3 shortwide:w-3" />
        </button>
      ) : (
        <div className={tileClass}>{face}</div>
      )}
    </motion.div>
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
  startFret: startFretProp,
  endFret: endFretProp,
  strings,
  isPlaying,
  onStart,
  isExamMode,
  onDevPassExam,
}: IntervalClickPanelProps) {
  const { t } = useTranslation("session");
  const {
    intervalClickHunt, huntTarget, huntRegion, customGoalPrompt, noteHuntSecondsLeft, noteHuntSecondsTotal,
    noteHuntRoundEnd, noteHuntStreak, advanceHunt, registerIntervalClick,
  } = useNoteMatchingContext();
  const isRoundOver = noteHuntRoundEnd !== null;
  // Drills that move the window every round score against the rotated one, so
  // the board has to follow it rather than the exercise's opening window.
  const startFret = huntRegion?.startFret ?? startFretProp;
  const endFret = huntRegion?.endFret ?? endFretProp;

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
  const anchor = intervalClickHunt?.anchor ?? null;
  const lastClick = intervalClickHunt?.lastClick ?? null;
  const mistakeCount = intervalClickHunt?.mistakeCount ?? 0;
  const phase = intervalClickHunt?.phase ?? "root";
  const complete = intervalClickHunt?.complete ?? false;

  const onInterval = phase === "interval";
  const isTimeUp = noteHuntRoundEnd?.kind === "timeUp";
  const isRotating = noteHuntSecondsLeft !== null;

  // Step 2 only accepts the interval within a hand's reach of the root the player
  // placed, so the board shades that span — the whole rectangle, answers and all,
  // which shows where to look without pointing at the note. Skipped when the span
  // was too tight to hold an answer and the hunt fell back to the whole window.
  const zoneKeys = useMemo(() => {
    if (!anchor || !onInterval || complete || isRoundOver) return undefined;
    if (!intervalPositions.every((p) => isWithinReach(p, anchor))) return undefined;
    return reachZoneKeys(anchor, startFret, endFret, strings);
  }, [anchor, onInterval, complete, isRoundOver, intervalPositions, startFret, endFret, strings]);

  // The neck's markers carry note names; where the round ran out of time, the
  // answer too — outside an exam.
  const foundRootKeys = useMemo(() => (anchor ? [clickTargetKey(anchor)] : []), [anchor]);
  const foundIntervalKey = intervalClickHunt?.foundIntervalKeys[0] ?? null;
  const reveal = useMemo(() => {
    if (!isTimeUp || isExamMode) return null;
    const targets = computeClickTargets(targetNote, startFret, endFret, strings);
    return revealInterval(anchor, rootPositions, anchor ? targetsWithinReach(targets, anchor) : targets);
  }, [isTimeUp, isExamMode, targetNote, startFret, endFret, strings, anchor, rootPositions]);
  const board = useMemo(() => {
    const rootKey = foundRootKeys[0] ?? (reveal ? clickTargetKey(reveal.root) : undefined);
    const revealKey = reveal ? clickTargetKey(reveal.target) : undefined;
    const labels: Record<string, string> = {};
    if (rootKey) labels[rootKey] = rootNote;
    if (foundIntervalKey) labels[foundIntervalKey] = targetNote;
    if (revealKey) labels[revealKey] = targetNote;
    return {
      labels,
      // Solved, both notes are found and joined; until then the root is a mark.
      found: foundIntervalKey ? [foundIntervalKey, ...foundRootKeys] : [],
      marked: !foundIntervalKey && rootKey ? [rootKey] : undefined,
      reveal: revealKey ? [revealKey] : undefined,
      link: foundIntervalKey && rootKey ? ([rootKey, foundIntervalKey] as const) : undefined,
    };
  }, [foundRootKeys, foundIntervalKey, reveal, rootNote, targetNote]);

  // A solved round that ends without a verdict — the session's own clock is down —
  // moves on by itself, but not until the interval phrase has said its piece (see
  // the audio section below). Rotating in the middle of it is what left one round's
  // notes running into the next.
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
    const timer = setTimeout(playRoot, PROMPT_ROOT_DELAY_MS);
    return () => clearTimeout(timer);
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
    // The chime says "right" first; the phrase follows it rather than covering it.
    let stop: (() => void) | undefined;
    const timer = setTimeout(() => {
      stop = playIntervalPhrase(base, base + semitones);
    }, ANSWER_CHIME_LEAD_MS);
    return () => {
      clearTimeout(timer);
      stop?.();
    };
  }, [complete, noteSound, anchorMidi, rootMidi, semitones]);

  // The reaction to a right click: a bell for the root, two for the solved round.
  const chimedRef = useRef<string | null>(null);
  useEffect(() => {
    const step = complete ? "solved" : foundRootsKey ? "root" : null;
    const chimeKey = step && `${promptKey}:${step}`;
    if (chimeKey && chimeKey !== chimedRef.current) playAnswerChime(complete ? targetNote : rootNote, complete);
    chimedRef.current = chimeKey;
  }, [complete, foundRootsKey, promptKey, rootNote, targetNote]);

  // Hold the solved round open until that phrase has finished; muted, there is only
  // the reveal to read.
  useEffect(() => {
    if (!complete || isRoundOver) return undefined;
    const timer = setTimeout(
      () => advanceHuntRef.current(),
      noteSound ? ANSWER_CHIME_LEAD_MS + INTERVAL_PHRASE_HOLD_MS : SILENT_ADVANCE_MS,
    );
    return () => clearTimeout(timer);
  }, [complete, isRoundOver, noteSound]);

  // A correct click in step 1 sounds the pitch of the cell that was hit; wrong
  // clicks stay silent — the red flash already says enough. Step 2's click is silent
  // too: it is the click that solves the round, and the phrase above follows it
  // immediately. A loose note in front of that turned the ending into four notes in
  // a row with no shape to them.
  const handleCellClick = useCallback(
    (string: number, fret: number) => {
      // The gate covers the board while stopped; this keeps a stray click from
      // scoring in the frame it fades in or out.
      if (!isPlaying || isRoundOver) return;
      if (noteSound && !onInterval && rootPositions.some((p) => p.string === string && p.fret === fret)) {
        const midi = midiForPosition(string, fret);
        if (midi >= 0) playGuitarNotePreview(midi);
      }
      registerIntervalClick(string, fret);
    },
    [isPlaying, isRoundOver, noteSound, onInterval, rootPositions, registerIntervalClick],
  );

  const [showSemitones, setShowSemitones] = useState(false);
  const [showFullNeck, setShowFullNeck] = useShowFullNeck();

  const intervalName = interval?.name ?? intervalLabel.replace(" ↑", "");
  // Which strings are live is already obvious on the board (the rest sit behind a
  // scrim), so the hint only points at it rather than listing string names.
  const scope = strings && strings.length < 6 ? ` ${t("interval_click.on_highlighted")}` : "";

  // A wrong click is named for a moment: what it was, and what interval that makes.
  const wrongKey = lastClick && !lastClick.correct ? `${promptKey}:${lastClick.id}` : null;
  const [readWrongKey, setReadWrongKey] = useState<string | null>(null);
  useEffect(() => {
    if (!wrongKey) return undefined;
    const timer = setTimeout(() => setReadWrongKey(wrongKey), WRONG_CLICK_MS);
    return () => clearTimeout(timer);
  }, [wrongKey]);
  const wrongNote =
    lastClick && wrongKey && wrongKey !== readWrongKey && !isRoundOver
      ? NOTES[midiForPosition(lastClick.string, lastClick.fret) % 12]
      : undefined;
  const wrongInterval = wrongNote && onInterval ? intervalBySemitones(semitonesBetween(rootNote, wrongNote)) : undefined;
  const wrongWords = !wrongNote
    ? undefined
    : onInterval && wrongNote === targetNote
      ? t("interval_click.too_far", { root: rootNote })
      : wrongInterval
        ? t("interval_click.wrong_interval", { note: wrongNote, interval: wrongInterval.name })
        : t("interval_click.wrong_note", { note: wrongNote });

  // The question stays up through its answer: the sum is the verdict's to say.
  const title =
    onInterval
      ? t("interval_click.now_above", { interval: intervalName, root: rootNote })
      : t("interval_click.click_any", { note: rootNote });
  const hint = complete || isRoundOver
    ? undefined
    : onInterval
      ? t(zoneKeys ? "interval_click.near_zone" : "interval_click.near", { root: rootNote })
      : `${t("interval_click.anywhere", { from: startFret, to: endFret })}${scope}`;

  return (
    <HuntStage
      layout="column"
      className="max-w-5xl gap-7 shortwide:max-w-none"
      awaitingStart={!isPlaying}
      onStart={onStart}
      stats={
        // The round's verdict stands over its own bar, at the top of the drill
        // where the eyes already are, rather than at the foot of the screen. The
        // bar keeps its place underneath, so the board doesn't jump every round.
        <div className='relative'>
          <div className={cn(noteHuntRoundEnd && "invisible")}>
            <HuntRoundBar
              mistakes={isExamMode ? { count: mistakeCount, limit: CLICK_EXAM_MISTAKE_LIMIT } : undefined}
              streak={noteHuntStreak}
              secondsLeft={isRotating ? noteHuntSecondsLeft : null}
              secondsTotal={noteHuntSecondsTotal}
              complete={complete}
              // A skipped round is an unanswered one, and in an exam that ends it.
              onSkip={isRotating && !isExamMode ? advanceHunt : undefined}
              canSkip={!isRoundOver && !complete}
            />
          </div>
          {noteHuntRoundEnd && (
            <div
              className={cn(
                "absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 items-center rounded-lg px-4 py-2 shortwide:py-1.5",
                VERDICT_GROUND[ROUND_VERDICT_TONE[noteHuntRoundEnd.kind]],
              )}>
              <IntervalRoundStrip roundEnd={noteHuntRoundEnd} isExamMode={!!isExamMode} onContinue={advanceHunt} />
            </div>
          )}
        </div>
      }
      prompt={
        // Sideways on a phone the verdict stands under the board and needs the
        // height; what the prompt said is in it.
        <div
          className={cn(
            "flex w-full flex-col items-center gap-5 sm:flex-row sm:justify-between shortwide:flex-row shortwide:justify-between shortwide:gap-4",
            isRoundOver && "shortwide:hidden",
          )}>
          <HuntAsk
            className="min-h-[4.5rem] justify-center sm:items-start sm:text-left sm:[&_p:first-child]:text-3xl shortwide:min-h-0 shortwide:max-w-none shortwide:[&_p:first-child]:text-lg"
            title={title}
            hint={wrongWords ?? hint}
            isAlert={!!wrongWords}
          />

          {/* Root, the interval between, and the answer slot — read left to right
              like the sentence it is. The white one is the one to find now. */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4 shortwide:gap-2.5">
            <StepTile
              value={rootNote}
              state={complete ? "done" : onInterval ? "anchor" : "active"}
              burst={onInterval ? undefined : { foundCount: foundRootKeys.length, complete: false }}
              onHear={heardRootMidi === null ? undefined : hearRoot}
              hearLabel={t("interval_click.play_root")}
            />
            <div className="flex flex-col items-center gap-1">
              <span className="whitespace-nowrap text-base font-bold text-zinc-200 shortwide:text-xs">{intervalLabel}</span>
              {showSemitones && semitones >= 0 && (
                <span className="text-xs font-semibold text-cyan-300">{t("interval_click.frets_up", { count: semitones })}</span>
              )}
            </div>
            <StepTile
              value={complete || reveal ? targetNote : "?"}
              state={complete ? "done" : onInterval && !isRoundOver ? "active" : "waiting"}
              burst={onInterval ? { foundCount: foundIntervalKey ? 1 : 0, complete } : undefined}
            />
          </div>
        </div>
      }
      board={
        <ClickableFretboard
          startFret={startFret}
          endFret={endFret}
          strings={strings}
          foundKeys={board.found}
          // One click settles either step, so the board's "solved" state is a single find.
          totalTargets={1}
          markedKeys={board.marked}
          cellLabels={board.labels}
          revealKeys={board.reveal}
          linkKeys={board.link}
          wrongLabel={wrongNote}
          zoneKeys={zoneKeys}
          lastClick={lastClick}
          onCellClick={handleCellClick}
          showFullNeck={showFullNeck}
        />
      }
      footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={showSemitones}
            onClick={() => setShowSemitones((v) => !v)}
            className={cn("mr-auto", showSemitones && "text-cyan-300 hover:text-cyan-200")}>
            <Lightbulb aria-hidden /> {showSemitones ? t("interval_click.hide_distance") : t("interval_click.how_far")}
          </Button>
          <HuntViewMenu
            showFullNeck={showFullNeck}
            onShowFullNeckChange={setShowFullNeck}
            noteSound={noteSound}
            onNoteSoundChange={toggleNoteSound}
          />

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
