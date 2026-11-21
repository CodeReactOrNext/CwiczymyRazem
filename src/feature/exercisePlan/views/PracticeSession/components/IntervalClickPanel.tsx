import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { playGuitarNotePreview, preloadGuitarNotePreview } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";
import { intervalBySemitones, semitonesBetween } from "feature/exercisePlan/intervals/intervalDefinitions";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CLICK_EXAM_MISTAKE_LIMIT, useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import {
  loadClickHuntNoteSoundPreference,
  midiForPosition,
  pickReferenceMidi,
  saveClickHuntNoteSoundPreference,
} from "../helpers/clickHuntNoteSound";
import { isWithinReach, reachZoneKeys } from "../helpers/clickTargets";
import { INTERVAL_PHRASE_HOLD_MS, playIntervalPhrase } from "../helpers/intervalPreview";
import { ClickableFretboard, useShowFullNeck } from "./ClickableFretboard";
import { HuntAsk, HuntFooter, HuntStage, HuntStats, HuntViewMenu } from "./HuntStage";
import { HuntSuccessBurst } from "./HuntSuccessBurst";

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
 * What a tile is doing, in the same colours the board uses for it: cyan is
 * "look here now" (and the lit frets), amber is the root you placed (and its R on
 * the neck), emerald is solved. A found root used to turn green as if the round
 * were over, while the half still to do sat in the same cyan as the search window.
 */
type StepState = "waiting" | "active" | "anchor" | "done";

/** How long a solved round stays up when the notes are muted — just the reveal to
 *  read. With sound on it is the interval phrase that sets the pace instead. */
const SILENT_ADVANCE_MS = 1400;
/** A beat of silence between the previous round's phrase and the new prompt's root,
 *  so the two never blur into one another. */
const PROMPT_ROOT_DELAY_MS = 280;

const STEP_TILE_STYLES: Record<StepState, string> = {
  waiting: "bg-zinc-800/60 text-zinc-500",
  active: "bg-cyan-500/15 text-cyan-200",
  anchor: "bg-amber-500/15 text-amber-200",
  done: "bg-emerald-500/15 text-emerald-200",
};

interface StepTileProps {
  /** One word under the tile — the instruction lives in the heading above. */
  caption: string;
  value: string;
  state: StepState;
  /** Fires the found/complete flourish on the tile the player is working on. */
  burst?: { foundCount: number; complete: boolean };
}

function StepTile({ caption, value, state, burst }: StepTileProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 shortwide:gap-1">
      <div className="relative">
        {burst && <HuntSuccessBurst foundCount={burst.foundCount} complete={burst.complete} />}
        <motion.div
          animate={state === "done" || state === "anchor" ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-lg transition-colors duration-slow sm:h-20 sm:w-20 shortwide:h-14 shortwide:w-14",
            STEP_TILE_STYLES[state],
          )}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.85 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="font-display text-3xl font-black tracking-tight sm:text-4xl shortwide:text-2xl">
              {value}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>
      <span className="text-xs font-semibold text-zinc-500">{caption}</span>
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
  startFret: startFretProp,
  endFret: endFretProp,
  strings,
  isPlaying,
  onStart,
  isExamMode,
  onDevPassExam,
}: IntervalClickPanelProps) {
  const { t } = useTranslation("session");
  const { intervalClickHunt, huntTarget, huntRegion, customGoalPrompt, noteHuntSecondsLeft, noteHuntSecondsTotal, advanceHunt, registerIntervalClick } =
    useNoteMatchingContext();
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
    return playIntervalPhrase(base, base + semitones);
  }, [complete, noteSound, anchorMidi, rootMidi, semitones]);

  // Hold the solved round open until that phrase has finished; muted, there is only
  // the reveal to read.
  useEffect(() => {
    if (!complete) return undefined;
    const timer = setTimeout(() => advanceHuntRef.current(), noteSound ? INTERVAL_PHRASE_HOLD_MS : SILENT_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [complete, noteSound]);

  // A correct click in step 1 sounds the pitch of the cell that was hit; wrong
  // clicks stay silent — the red flash already says enough. Step 2's click is silent
  // too: it is the click that solves the round, and the phrase above follows it
  // immediately. A loose note in front of that turned the ending into four notes in
  // a row with no shape to them.
  const handleCellClick = useCallback(
    (string: number, fret: number) => {
      // The gate covers the board while stopped; this keeps a stray click from
      // scoring in the frame it fades in or out.
      if (!isPlaying) return;
      if (noteSound && !onInterval && rootPositions.some((p) => p.string === string && p.fret === fret)) {
        const midi = midiForPosition(string, fret);
        if (midi >= 0) playGuitarNotePreview(midi);
      }
      registerIntervalClick(string, fret);
    },
    [isPlaying, noteSound, onInterval, rootPositions, registerIntervalClick],
  );

  const [showSemitones, setShowSemitones] = useState(false);
  const [showFullNeck, setShowFullNeck] = useShowFullNeck();

  const intervalName = interval?.name ?? intervalLabel.replace(" ↑", "");
  // Which strings are live is already obvious on the board (the rest sit behind a
  // scrim), so the hint only points at it rather than listing string names.
  const scope = strings && strings.length < 6 ? ` ${t("interval_click.on_highlighted")}` : "";

  // Heading first, tiles second: the step, the instruction, and one line on where
  // to look. The tiles below only illustrate it.
  const ask = complete
    ? {
        step: t("hunt.solved"),
        title: t("interval_click.solved", { root: rootNote, interval: intervalName, target: targetNote }),
        hint: undefined,
      }
    : onInterval
      ? {
          step: t("interval_click.step", { step: 2 }),
          title: t("interval_click.now_above", { interval: intervalName, root: rootNote }),
          hint: t(zoneKeys ? "interval_click.near_zone" : "interval_click.near", { root: rootNote }),
        }
      : {
          step: t("interval_click.step", { step: 1 }),
          title: t("interval_click.click_any", { note: rootNote }),
          hint: `${t("interval_click.anywhere", { from: startFret, to: endFret })}${scope}`,
        };

  return (
    <HuntStage
      awaitingStart={!isPlaying}
      onStart={onStart}
      railClassName="xl:w-80 xl:items-start"
      stats={
        <HuntStats
          score={score}
          mistakes={isExamMode ? { count: mistakeCount, limit: CLICK_EXAM_MISTAKE_LIMIT } : undefined}
          secondsLeft={isRotating ? noteHuntSecondsLeft : null}
          secondsTotal={noteHuntSecondsTotal}
          complete={complete}
        />
      }
      prompt={
        <div className="flex flex-col items-center gap-5 xl:items-start shortwide:flex-row shortwide:gap-4">
          <HuntAsk step={ask.step} title={ask.title} hint={ask.hint} solved={complete} />

          {/* Root, the interval on the arrow between them, and the answer slot —
              read left to right like the sentence it is. */}
          <div className="flex items-start gap-2.5 sm:gap-3">
            <StepTile
              caption={t("interval_click.root")}
              value={rootNote}
              state={complete ? "done" : onInterval ? "anchor" : "active"}
              burst={onInterval ? undefined : { foundCount: rootFound, complete: false }}
            />

            <div className="flex w-24 flex-col items-center gap-1.5 pt-6 sm:w-28 sm:pt-7 shortwide:w-20 shortwide:pt-4">
              <span className="whitespace-nowrap text-sm font-bold text-zinc-200 shortwide:text-xs">{intervalLabel}</span>
              <span aria-hidden className="relative h-0.5 w-full rounded-full bg-zinc-600">
                <span className="absolute -right-0.5 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[5px] border-l-[7px] border-y-transparent border-l-zinc-600" />
              </span>
              {showSemitones && semitones >= 0 && (
                <span className="text-xs font-semibold text-cyan-300">
                  {t("interval_click.frets_up", { count: semitones })}
                </span>
              )}
            </div>

            <StepTile
              caption={t("interval_click.target")}
              value={complete ? targetNote : "?"}
              state={complete ? "done" : onInterval ? "active" : "waiting"}
              burst={onInterval ? { foundCount: intervalFound, complete } : undefined}
            />
          </div>
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
        <HuntFooter onNext={isRotating ? advanceHunt : undefined}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={hearRoot}
            disabled={heardRootMidi === null}
            title={t("interval_click.play_root")}>
            <Volume2 aria-hidden className="text-zinc-400" /> {t("interval_click.hear_root")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={showSemitones}
            onClick={() => setShowSemitones((v) => !v)}
            className={cn(showSemitones && "text-cyan-300 hover:text-cyan-200")}>
            {showSemitones ? t("interval_click.hide_distance") : t("interval_click.how_far")}
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
        </HuntFooter>
      }
    />
  );
}
