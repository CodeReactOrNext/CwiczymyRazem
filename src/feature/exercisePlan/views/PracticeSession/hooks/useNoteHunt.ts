import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNoteFromFrequency, NOTES } from "utils/audio/noteUtils";

import type { GameState } from "./noteMatchingFeedback";

/** Shift a note name by `shift` semitones (wrapping), e.g. shiftNote("A", -1) === "G#". */
function shiftNote(note: string, shift: number): string {
  const idx = NOTES.indexOf(note);
  if (idx < 0 || shift === 0) return note;
  return NOTES[(idx + shift + 12 * 10) % 12];
}

export interface NoteHuntState {
  /** Live detected note name (e.g. "C#"), or null when silent. */
  detectedNote: string | null;
  /** Live detected octave, or null when silent. */
  detectedOctave: number | null;
  /** Tuning offset of the detected note in cents. */
  cents: number;
  /** True while the detected note matches the target (any octave) and is stable. */
  isMatch: boolean;
  /** Octaves of the target note the player has confirmed at least once, sorted. */
  foundOctaves: number[];
  /** Octaves of the target note reachable on a standard-tuned guitar. */
  octaves: number[];
  /** Increments on every fresh match attack — use it to trigger hit animations. */
  hitId: number;
  // ── Scoring (mirrors the tablature game so the success screen is consistent) ──
  gameState: GameState;
  accuracy: number;
  maxPossibleScore: number;
  maxCombo: number;
  /** Round tally for the prompt drills, `null` for the octave hunts — how many
   *  questions the session has put up and how many were answered. */
  rounds: { solved: number; presented: number } | null;
  /** Whole-neck octave hunts: octaves found and missed over the run, for the
   *  live readout. Both 0 until the first round is over. Null elsewhere. */
  tally: { hits: number; misses: number } | null;
}

/** The neck's end for the whole-neck hunts. Every guitar has this many frets —
 *  asking for every octave up to the 24th made E impossible to finish on 22. */
export const HUNT_MAX_FRET = 15;
const HIGH_E_OPEN_MIDI = 64;

const SAMPLE_MS = 50;            // ~20 Hz, same cadence as the live tuner
const CONFIRM_SAMPLES = 2;       // require ~100ms of a stable pitch before counting it
const VOLUME_THRESHOLD = 0.01;

type FreqRef = React.RefObject<number> | React.MutableRefObject<number> | undefined;

/**
 * Octaves of `note` reachable on a standard-tuned guitar, roughly E2 (MIDI 40)
 * up to E6 (MIDI 88) — open strings through ~24th fret.
 */
export function playableOctaves(note: string): number[] {
  const idx = NOTES.indexOf(note);
  if (idx < 0) return [];
  const octaves: number[] = [];
  for (let o = 1; o <= 7; o++) {
    const midi = (o + 1) * 12 + idx; // C{o} = (o+1)*12
    if (midi >= 40 && midi <= 88) octaves.push(o);
  }
  return octaves;
}

/**
 * Every position of `note` inside the hunt's fret window, restricted to `strings`
 * (1 = high e … 6 = low E) when the exercise names specific ones. Exported so the
 * UI can map found octaves back onto concrete fretboard cells.
 */
export function huntPositions(
  note: string,
  fretRange: [number, number],
  strings?: readonly number[],
): { string: number; fret: number; midiNote: number; octave: number }[] {
  const idx = NOTES.indexOf(note);
  if (idx < 0) return [];
  return getNotePositionsInRange(idx, fretRange[0], fretRange[1], strings);
}

/** The octaves a whole-neck hunt asks for: up to HUNT_MAX_FRET. */
export function wholeNeckOctaves(note: string): number[] {
  const idx = NOTES.indexOf(note);
  return playableOctaves(note).filter(o => (o + 1) * 12 + idx <= HIGH_E_OPEN_MIDI + HUNT_MAX_FRET);
}

/**
 * Octaves of `note` the player should hunt: the whole neck normally, or — in
 * region mode — only those reachable inside the `[startFret, endFret]` window
 * on the strings in play.
 *
 * The string filter is what makes "play this note on the G string" honest: on
 * one string a pitch class appears in exactly one octave per 12-fret window, so
 * the same note played on a different string lands in the wrong octave and is
 * not counted — the mic can't hear which string was plucked, but it can hear that.
 */
function targetOctaves(
  note: string,
  fretRange?: [number, number],
  strings?: readonly number[],
  /** Prompt drills take the answer in any octave the guitar has. */
  anyOctave = false,
): number[] {
  if (!fretRange) return anyOctave ? playableOctaves(note) : wholeNeckOctaves(note);
  const positions = huntPositions(note, fretRange, strings);
  return Array.from(new Set(positions.map(p => p.octave))).sort((a, b) => a - b);
}

/** Escalating score for finding `n` octaves — same curve as note-matching. */
function scoreForCount(n: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) total += 100 * Math.min(8, Math.floor(i / 5) + 1);
  return total;
}

function sameState(a: NoteHuntState, b: NoteHuntState): boolean {
  return (
    a.detectedNote === b.detectedNote &&
    a.detectedOctave === b.detectedOctave &&
    a.isMatch === b.isMatch &&
    a.hitId === b.hitId &&
    a.gameState.score === b.gameState.score &&
    a.accuracy === b.accuracy &&
    a.tally?.hits === b.tally?.hits &&
    a.tally?.misses === b.tally?.misses &&
    a.foundOctaves.length === b.foundOctaves.length &&
    a.octaves.length === b.octaves.length &&
    Math.abs(a.cents - b.cents) < 3
  );
}

function buildState(
  octaves: number[],
  found: Set<number>,
  detectedNote: string | null,
  detectedOctave: number | null,
  cents: number,
  isMatch: boolean,
  hitId: number,
  scoreOffset = 0,
  /** Rounds banked so far (the current one excluded from `solved`, included in
   *  `presented`). `null` grades by octave instead — see below. */
  rounds: { solved: number; presented: number } | null = null,
  /** Octave hunts: octaves found and asked for in the rounds gone by. */
  banked: { found: number; total: number } | null = null,
  /** Share of the points the note on screen pays (see `scoreFactor` on the hook). */
  scoreFactor = 1,
  /** Whether the run's hits and misses are read out live (whole-neck hunts). */
  tallied = true,
): NoteHuntState {
  const foundInRange = octaves.filter(o => found.has(o)).length;

  // Two different things can be graded here, and grading the wrong one is what
  // made the prompt drills unwinnable. An octave hunt asks for every octave of a
  // note, so its unit is the octave. A prompt drill ("the 7th of E7") is answered
  // by playing the target ONCE, so its unit is the round: playing D in one octave
  // is a whole correct answer, not a quarter of one. Counting octaves there
  // capped a perfect run at 100/number-of-playable-octaves — 25% — and reset it
  // on every rotation, so the grade only ever flickered between 0% and 25%.
  const units = rounds ? rounds.solved + (foundInRange > 0 ? 1 : 0) : foundInRange;
  const total = rounds ? rounds.presented : octaves.length;
  const multiplier = Math.min(8, Math.floor(units / 5) + 1);
  // A hunt of many notes is graded over all of them. The note on screen only
  // costs what it misses once it is over; until the first one is, it is all
  // there is to grade.
  const hasBanked = !!banked && banked.total > 0;
  const gradedFound = hasBanked ? banked.found + foundInRange : units;
  const gradedTotal = hasBanked ? banked.total + foundInRange : total;
  return {
    detectedNote, detectedOctave, cents, isMatch, hitId, octaves,
    foundOctaves: Array.from(found).sort((a, b) => a - b),
    gameState: {
      // Cumulative across the session either way: the round tally already spans
      // it, and the octave hunts add the banked total of the targets gone by.
      score: rounds ? scoreForCount(units) : scoreOffset + Math.round(scoreForCount(foundInRange) * scoreFactor),
      combo: units,
      multiplier,
    },
    accuracy: gradedTotal > 0 ? Math.round((gradedFound / gradedTotal) * 100) : 0,
    maxPossibleScore: scoreForCount(total),
    maxCombo: units,
    rounds,
    tally: !banked || !tallied ? null : {
      hits: hasBanked ? gradedFound : 0,
      misses: banked.total - banked.found,
    },
  };
}

/**
 * Listens to the live mic pitch and reports whether the player is hitting the
 * target note (ignoring octave), tracking which octaves they've located and
 * scoring the hunt. Self-contained — no tablature/timing, unlike useNoteMatching.
 *
 * Designed to live in a long-lived owner (NoteMatchingProvider): it retargets
 * and clears progress in place when `targetNote` changes, rather than relying on
 * remounting. `roundGraded` switches it from grading octaves to grading rounds,
 * which is what the hidden-answer prompt drills actually ask for.
 */
export interface NoteHuntControls {
  state: NoteHuntState;
  /** Manually toggle an octave as found — used in no-mic (self-check) practice. */
  markOctave: (octave: number) => void;
}

export function useNoteHunt(
  targetNote: string,
  frequencyRef: FreqRef,
  volumeRef: FreqRef,
  active: boolean,
  fretRange?: [number, number],
  /** Strings in play (1 = high e … 6 = low E). Omitted = the whole neck. Only
   *  meaningful together with `fretRange`. */
  strings?: readonly number[],
  /** Semitone shift applied to the target before matching the mic's detected
   *  pitch — see getUniformTuningShift. 0 (default) matches literal absolute pitch. */
  tuningShift = 0,
  /** Prompt drills (interval mode): the target is hidden behind a question and
   *  playing it once answers the round, so score and grade run across rounds
   *  rather than across the octaves of the note currently up. */
  roundGraded = false,
  /** Identity of the question the target belongs to, for the drills that have
   *  one. Two rounds in a row can land on the same note — the ♭3 of Am and the
   *  5th of F are both C — and retargeting on the note alone missed the change:
   *  the new question opened with the old one's answer already revealed, already
   *  solved, and never counted as a round of its own. */
  roundKey?: string,
  /** Identity of the run. A new value (restart, next exercise) starts the score
   *  and rounds over from zero instead of banking onto the last run. */
  runKey: string | number = 0,
  /** Whether hits count. False before Start (and while paused): the mic still
   *  shows what it hears, so the player can check it works, but nothing is
   *  found or scored — a hunt can't be answered ahead of its own clock. */
  counting = true,
  /** Share of the points an octave hunt's finds are worth, 1 = all of them. Less
   *  where the neck is showing the answer: looking a note up is practice too,
   *  but it is not the recall the full score stands for. Read when a find is
   *  scored and when the target is banked, so switching mid-run only changes
   *  the notes from there on. */
  scoreFactor = 1,
): NoteHuntControls {
  const runKeyRef = useRef(runKey);
  const countingRef = useRef(counting);
  useEffect(() => { countingRef.current = counting; });
  const scoreFactorRef = useRef(scoreFactor);
  const shiftedTargetNote = shiftNote(targetNote, tuningShift);
  // Every octave hunt is graded over the whole run. Without the bank a region
  // hunt graded only the note on screen, so a run that moved on after each find
  // always ended on a fresh note and read 0%.
  const gradesWholeRun = !roundGraded;
  // The live hits/misses readout stays with the whole-neck hunts.
  const tallied = !fretRange;
  const [state, setState] = useState<NoteHuntState>(() =>
    buildState(
      targetOctaves(shiftedTargetNote, fretRange, strings, roundGraded), new Set(), null, null, 0, false, 0, 0,
      roundGraded ? { solved: 0, presented: 1 } : null,
      gradesWholeRun ? { found: 0, total: 0 } : null,
      scoreFactor, tallied,
    ),
  );

  // Re-roll progress when the note, region window, strings or tuning change.
  // Derived as a primitive key so a fresh fretRange/strings array each render
  // doesn't reset us.
  const targetKey = `${shiftedTargetNote}|${fretRange ? `${fretRange[0]}-${fretRange[1]}` : ""}|${strings?.join(",") ?? ""}|${roundKey ?? ""}`;

  const rafRef         = useRef(0);
  const lastSampleRef  = useRef(0);
  const stableRef      = useRef<{ note: string; octave: number; count: number } | null>(null);
  const wasMatchingRef = useRef(false);
  const foundRef       = useRef<Set<number>>(new Set());
  const prevFoundRef   = useRef(0);
  const hitIdRef       = useRef(0);
  const targetRef      = useRef(shiftedTargetNote);
  const octavesRef     = useRef<number[]>(targetOctaves(shiftedTargetNote, fretRange, strings, roundGraded));
  // Score banked from previous targets — keeps the total accumulating across rotations.
  const sessionScoreRef = useRef(0);
  const firstTargetRef  = useRef(true);
  // Prompt drills: rounds answered (the one on screen excluded until it rotates)
  // and rounds the session has put up (the one on screen included, so an
  // unanswered question already counts against the grade).
  const roundsSolvedRef    = useRef(0);
  const roundsPresentedRef = useRef(1);
  // Octave hunts: what the rounds gone by asked for and got. A target
  // swapped out before the clock ever ran on it was never asked.
  const bankedRef = useRef<{ found: number; total: number } | null>(gradesWholeRun ? { found: 0, total: 0 } : null);
  const roundLiveRef = useRef(false);

  // Retarget in place when the goal note or region changes (no remount). Refs
  // only — the RAF loop pushes the cleared state on its next tick.
  useEffect(() => {
    // Bank the finishing target's score before clearing (skip the initial mount)
    // — unless a new run started, which starts the total over.
    const isNewRun = runKeyRef.current !== runKey;
    runKeyRef.current = runKey;
    if (isNewRun) {
      sessionScoreRef.current = 0;
      roundsSolvedRef.current = 0;
      roundsPresentedRef.current = 1;
      bankedRef.current = gradesWholeRun ? { found: 0, total: 0 } : null;
    } else if (!firstTargetRef.current) {
      sessionScoreRef.current += Math.round(scoreForCount(prevFoundRef.current) * scoreFactorRef.current);
      if (prevFoundRef.current > 0) roundsSolvedRef.current += 1;
      roundsPresentedRef.current += 1;
      if (bankedRef.current && roundLiveRef.current) {
        bankedRef.current = {
          found: bankedRef.current.found + prevFoundRef.current,
          total: bankedRef.current.total + octavesRef.current.length,
        };
      }
    }
    roundLiveRef.current = countingRef.current;
    firstTargetRef.current = false;
    targetRef.current     = shiftedTargetNote;
    octavesRef.current    = targetOctaves(shiftedTargetNote, fretRange, strings, roundGraded);
    foundRef.current      = new Set();
    stableRef.current     = null;
    wasMatchingRef.current = false;
    prevFoundRef.current  = 0;
    hitIdRef.current      = 0;
    // Push the cleared state now — the RAF loop is idle when the mic is off, so
    // without this the previous note's found octaves would linger after a rotate.
    setState(buildState(
      octavesRef.current, foundRef.current, null, null, 0, false, 0, sessionScoreRef.current,
      roundGraded ? { solved: roundsSolvedRef.current, presented: roundsPresentedRef.current } : null,
      bankedRef.current, scoreFactorRef.current, tallied,
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, runKey]);

  // After the retarget above: a target banks at the rate it was played under.
  useEffect(() => { scoreFactorRef.current = scoreFactor; }, [scoreFactor]);

  // After the retarget above, so a round that opens on a running clock counts as live.
  useEffect(() => { if (counting) roundLiveRef.current = true; }, [counting]);

  useEffect(() => {
    if (!active) return () => { /* nothing to clean up */ };

    const tick = () => {
      const now = Date.now();
      if (now - lastSampleRef.current >= SAMPLE_MS) {
        lastSampleRef.current = now;

        const freq = frequencyRef?.current ?? 0;
        const vol  = volumeRef?.current ?? 0;
        const octaves = octavesRef.current;

        if (freq > 40 && vol > VOLUME_THRESHOLD) {
          const data = getNoteFromFrequency(freq);
          if (data) {
            const matchesTarget = data.note === targetRef.current;

            // Stability: the same note+octave must persist across a few samples
            // before we trust it — guitar attacks momentarily report wrong pitches.
            const prevStable = stableRef.current;
            let entry: { note: string; octave: number; count: number };
            if (prevStable && prevStable.note === data.note && prevStable.octave === data.octave) {
              prevStable.count++;
              entry = prevStable;
            } else {
              entry = { note: data.note, octave: data.octave, count: 1 };
              stableRef.current = entry;
            }
            const confirmed = entry.count >= CONFIRM_SAMPLES;
            const isMatch = matchesTarget && confirmed && countingRef.current;

            if (isMatch) {
              if (!wasMatchingRef.current) hitIdRef.current++; // new attack → flash
              wasMatchingRef.current = true;
              foundRef.current.add(data.octave);
            } else if (!matchesTarget) {
              wasMatchingRef.current = false;
            }

            const foundInRange = octaves.filter(o => foundRef.current.has(o)).length;
            if (foundInRange > prevFoundRef.current) prevFoundRef.current = foundInRange;

            const next = buildState(
              octaves, foundRef.current, data.note, data.octave, data.cents,
              isMatch, hitIdRef.current, sessionScoreRef.current,
              roundGraded ? { solved: roundsSolvedRef.current, presented: roundsPresentedRef.current } : null,
              bankedRef.current, scoreFactorRef.current, tallied,
            );
            setState(prev => sameState(prev, next) ? prev : next);
          }
        } else {
          // Silence — drop the live readout but keep the found-octaves progress.
          stableRef.current = null;
          wasMatchingRef.current = false;
          setState(prev =>
            prev.detectedNote === null && !prev.isMatch
              ? prev
              : { ...prev, detectedNote: null, detectedOctave: null, isMatch: false },
          );
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, frequencyRef, volumeRef, roundGraded, tallied]);

  // Self-check for players without a mic: tap to toggle an octave as found. Feeds
  // the same found-set/scoring path as live detection.
  const markOctave = useCallback((octave: number) => {
    if (!countingRef.current) return;
    const found = foundRef.current;
    if (found.has(octave)) {
      found.delete(octave);
    } else {
      found.add(octave);
      hitIdRef.current++;
    }
    const foundInRange = octavesRef.current.filter(o => found.has(o)).length;
    prevFoundRef.current = foundInRange;
    setState(prev => buildState(
      octavesRef.current, found, prev.detectedNote, prev.detectedOctave, prev.cents,
      prev.isMatch, hitIdRef.current, sessionScoreRef.current,
      roundGraded ? { solved: roundsSolvedRef.current, presented: roundsPresentedRef.current } : null,
      bankedRef.current, scoreFactorRef.current, tallied,
    ));
  }, [roundGraded, tallied]);

  return { state, markOctave };
}
