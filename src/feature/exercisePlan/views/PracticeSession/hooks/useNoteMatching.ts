import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Spectrum } from "utils/audio/chordTones";
import { CHORD_TONE_HIT, CHORD_TONE_SUSTAIN, createChordToneEvidence, isChordToneSounding, spectrumPeak } from "utils/audio/chordTones";
import { correctOctaveForLowStrings, getAdaptiveVolumeGate, getCentsDistance, getDetectionGates, getExpectationBiasedTolerance, getFrequencyFromTab, midiToFrequency } from "utils/audio/noteUtils";

import type { TablatureMeasure } from "../../../types/exercise.types";
import type { IntonationKind, LivePitch, ScoringFocus } from "../utils/pitchScoring";
import { closerIntonation, continuationAttackFloorMs, gradeIntonation, hasOwnAttack, INTONATION_SETTLE_MS, intonationKindOf, isNearPitch, isSamePitchContinuation, liveBendAmount, medianCents, noteSettleMs } from "../utils/pitchScoring";
import { tempoScoreFactor } from "../utils/tempoScoreFactor";
import type { RunNote, TimingGrade } from "../utils/timingGrade";
import { gradeTiming, isPerfectTiming, TIMING_GRADE_POINTS, timingHintFor } from "../utils/timingGrade";
import { MAX_TIMED_NOTES } from "../utils/timingPrecision";
import type { ExpectedAttack } from "./noteEventGrader";
import { assignAttacks } from "./noteEventGrader";
import { buildTempoMap, createBeatClock } from "./tempoBeatClock";
import { useGameState } from "./useGameState";

const CENTS_TOLERANCE      = 45;
const VOLUME_GATE          = 0.005;

interface UseNoteMatchingOptions {
  isPlaying: boolean;
  startTime: number | null;
  /** Playback AudioContext (metronome/GP/synth clock). When provided together with
   *  audioStartTime, matching follows this clock instead of Date.now() — the wall
   *  clock drifts away from the audio hardware clock over a session, which made
   *  hit windows (and the green marks) lag more and more the longer playback ran. */
  audioContext?: AudioContext | null;
  /** AudioContext.currentTime of the first scheduled beat (same instant as startTime). */
  audioStartTime?: number | null;
  effectiveBpm: number;
  /** raw metronome BPM — × speedMultiplier gives the tempo a note scores at */
  rawBpm: number;
  activeTablature: TablatureMeasure[] | null | undefined;
  isMicEnabled: boolean;
  currentExerciseIndex: number;
  speedMultiplier: number;
  getLatencyMs: () => number;
  audioRefs: AudioRefs;
  getAdjustedTargetFreq: (string: number, baseFreq: number) => number;
  /** Per-string semitone offset from standard tuning (index 0 = string 1 … index 5 = string 6).
   *  Only applied to notes without a real `midiNote` — GP imports already carry their actual pitch. */
  tuningOffsets?: readonly number[];
  onReset?: () => void;
  /** Measured end-to-end latency (timing calibration). Replaces getLatencyMs()
   *  here when set; null/undefined = not calibrated, use the estimate. */
  calibratedLatencyMs?: number | null;
  /** What the score rewards beyond hitting the notes — see pitchScoring.ts. */
  scoringFocus?: ScoringFocus;
  /** Every tab note the moment it is settled — see NoteJudgement. */
  onNoteJudged?: (judgement: NoteJudgement) => void;
}

/**
 * One tab note settled by the matcher, delivered from inside the matching loop
 * — not on the next flush to React — so a game mode can react to each note
 * as it lands. Notes repeat their key on every pass of a looping tab.
 */
export interface NoteJudgement {
  noteKey: string;
  hit: boolean;
  /** How the attack sat on the beat; null for a miss. */
  grade: TimingGrade | null;
  /** Dead on (±25 ms). Feedback only — the score treats it as a 3. */
  perfect: boolean;
  /** The streak after this note: 0 after a miss. */
  combo: number;
}

/** A pitch-graded note that was hit and is still playing out — its points
 *  wait for the note to show where its pitch actually sat. */
interface PendingIntonation {
  kind: IntonationKind;
  beatEnd: number;
  multiplier: number;
  /** The run's tempo factor when the note was hit — the note scores at it. */
  tempoFactor: number;
  targetFreq: number;
  volumeGate: number;
  /** Readings before this (Date.now ms) still belong to the note before. */
  trackFromMs: number;
  /** Bend / release: the closest reading so far. */
  best: number | null;
  /** Fretted note: every settled reading — judged on their median. */
  readings: number[];
  /** Fretted note: the reading the hit was proven with, for a note too short
   *  to leave any settled reading. */
  atHit: number | null;
  /** Its entry in the run log, which the verdict fills in; -1 past the cap. */
  logIndex: number;
}

export function useNoteMatching({
  isPlaying, startTime, audioContext, audioStartTime, effectiveBpm, rawBpm,
  activeTablature, isMicEnabled, currentExerciseIndex,
  speedMultiplier, getLatencyMs, audioRefs, getAdjustedTargetFreq, tuningOffsets, onReset, calibratedLatencyMs,
  scoringFocus = "timing", onNoteJudged,
}: UseNoteMatchingOptions) {
  // Read by the matching loop, which must not restart when the listener changes.
  const onNoteJudgedRef = useRef(onNoteJudged);
  useEffect(() => { onNoteJudgedRef.current = onNoteJudged; }, [onNoteJudged]);

  const {
    hitNotes, missedNotes, sessionAccuracy, sessionStats, maxCombo, gameState, noteTimings,
    hitNotesRef, missedNotesRef, gameStateRef, statsRef,
    maxComboRef, needsFlushRef, minScoredBpmRef,
    noteTimingsRef, timingCountsRef, timingOffsetsRef, intonationCountsRef, intonationOffsetsRef, runLogRef,
    flushToReact, reset: resetGameState,
  } = useGameState(currentExerciseIndex, onReset);

  /** noteKey -> pitch-graded hit waiting for its intonation verdict. */
  const pendingIntonationRef = useRef<Map<string, PendingIntonation>>(new Map());
  /** The bend or release under the cursor right now, for the tab to animate.
   *  Written every matching tick, read by the tab's own frame loop. */
  const livePitchRef = useRef<LivePitch | null>(null);
  /** When each chord tone was first heard after its attack (chordTones.ts). */
  const chordEvidenceRef = useRef(createChordToneEvidence());

  const resetGame = useCallback(() => {
    pendingIntonationRef.current.clear();
    chordEvidenceRef.current.clear();
    livePitchRef.current = null;
    resetGameState();
  }, [resetGameState]);

  // A new exercise starts its own run; useGameState resets the rest.
  useEffect(() => {
    pendingIntonationRef.current.clear();
    chordEvidenceRef.current.clear();
  }, [currentExerciseIndex]);

  /** Banks a pitch-graded note once it has played out: its points, at the
   *  multiplier it was hit with, scaled by how close it got. Lives outside the
   *  matching loop's effect on purpose — that effect restarts whenever its
   *  inputs change identity, and a note mid-way through must survive it. */
  const settleIntonation = useCallback((noteKey: string, pending: PendingIntonation) => {
    pendingIntonationRef.current.delete(noteKey);
    const isFretted = pending.kind === "note";
    const cents = isFretted ? medianCents(pending.readings) ?? pending.atHit : pending.best;
    // A fretted note we never got a clean reading of was still heard at
    // its pitch (that's what made it a hit) — nothing to mark it down for.
    if (isFretted && cents === null) {
      gameStateRef.current.score += Math.round(100 * pending.multiplier * pending.tempoFactor * TIMING_GRADE_POINTS[3]);
      needsFlushRef.current = true;
      return;
    }
    const grade: TimingGrade = gradeIntonation(cents);
    gameStateRef.current.score += Math.round(100 * pending.multiplier * pending.tempoFactor * TIMING_GRADE_POINTS[grade]);
    intonationCountsRef.current[grade]++;
    if (cents !== null) intonationOffsetsRef.current.push(cents);
    const logged = runLogRef.current[pending.logIndex];
    if (logged && cents !== null) logged.cents = Math.round(cents);
    const timing = noteTimingsRef.current[noteKey];
    if (timing) {
      noteTimingsRef.current[noteKey] = { ...timing, intonation: { grade, cents: cents === null ? null : Math.round(cents) } };
    }
    needsFlushRef.current = true;
  }, [gameStateRef, intonationCountsRef, intonationOffsetsRef, runLogRef, noteTimingsRef, needsFlushRef]);

  /** Settles every note still playing out — for a run that is ending, so the
   *  note under the cursor when time ran out still counts. Returns the run's
   *  score with them banked, which React state only catches up with later. */
  const settlePendingIntonation = useCallback((): number => {
    for (const [noteKey, pending] of pendingIntonationRef.current) settleIntonation(noteKey, pending);
    return gameStateRef.current.score;
  }, [settleIntonation, gameStateRef]);

  const lastLoopedBeatsRef = useRef(0);
  const processedNotesRef  = useRef<Set<string>>(new Set());
  const rafIdRef           = useRef<number>(0);
  /** Onset timestamps of attacks already credited to some note, so one attack
   *  can never fill a whole run of notes. Keyed by onsetMs, which the processor
   *  derives per hop and is therefore unique per attack. */
  const consumedAttacksRef = useRef<Set<number>>(new Set());

  // ── Derived ───────────────────────────────────────────────────────────────────

  const totalNotes = useMemo(() => {
    if (!activeTablature) return 0;
    return activeTablature.reduce((acc, m) => acc + m.beats.reduce((a, b) => a + b.notes.length, 0), 0);
  }, [activeTablature]);

  const maxPossibleScore = useMemo(() => {
    if (totalNotes === 0) return 0;
    const tempoFactor = tempoScoreFactor(rawBpm * speedMultiplier);
    let total = 0;
    for (let i = 0; i < totalNotes; i++) {
      total += Math.round(100 * Math.min(8, Math.floor(i / 5) + 1) * tempoFactor);
    }
    return total;
  }, [totalNotes, speedMultiplier, rawBpm]);

  const totalExerciseBeats = useMemo(() => {
    if (!activeTablature) return 0;
    return activeTablature.reduce((acc, m) => acc + m.beats.reduce((a, b) => a + b.duration, 0), 0);
  }, [activeTablature]);

  const beatsPerSecond = effectiveBpm / 60;
  const currentBeatsElapsedRef = useRef(0);

  // Tempo-aware clock shared by the cursor ref and the matching loop. GP imports
  // carry tempo automation that the audio playback and the visual cursor follow;
  // matching must follow the same curve or it drifts progressively into the song.
  const beatClock = useMemo(() => {
    if (!activeTablature || !totalExerciseBeats) return null;
    return createBeatClock(buildTempoMap(activeTablature), totalExerciseBeats, effectiveBpm);
  }, [activeTablature, totalExerciseBeats, effectiveBpm]);

  useEffect(() => {
    if (!isPlaying || !startTime || !totalExerciseBeats) { currentBeatsElapsedRef.current = 0; return; }
    let rafId: number;
    const tick = () => {
      // Prefer the audio clock (what the user actually hears) over Date.now().
      const elapsedSec = audioContext && audioStartTime != null
        ? audioContext.currentTime - audioStartTime
        : (Date.now() - startTime) / 1000;
      const beats = beatClock ? beatClock.toBeats(elapsedSec) : elapsedSec * beatsPerSecond;
      currentBeatsElapsedRef.current = beats % totalExerciseBeats;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, startTime, audioContext, audioStartTime, beatClock, beatsPerSecond, totalExerciseBeats]);

  // ── RAF note-matching loop ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isPlaying || !startTime || !activeTablature || !isMicEnabled) return;

    // Pre-flatten beats once per effect mount for O(log n) window search
    const flatBeats: {
      beat: any; beatStart: number; beatEnd: number;
      notes: { note: any; noteKey: string }[];
    }[] = [];
    let pos = 0;
    for (let mIdx = 0; mIdx < activeTablature.length; mIdx++) {
      for (let bIdx = 0; bIdx < activeTablature[mIdx].beats.length; bIdx++) {
        const beat = activeTablature[mIdx].beats[bIdx];
        flatBeats.push({
          beat, beatStart: pos, beatEnd: pos + beat.duration,
          notes: beat.notes.map((note: any, nIdx: number) => ({
            note, noteKey: `${mIdx}-${bIdx}-${nIdx}`,
          })),
        });
        pos += beat.duration;
      }
    }
    const totalExBeats = pos;
    if (totalExBeats === 0) return;

    const scoredBpm        = rawBpm * speedMultiplier;
    const tempoFactor      = tempoScoreFactor(scoredBpm);

    /** Expected pitch of a note, plus the unbent pitch of an in-progress bend.
     *  Shared by the attack-assignment pre-pass and the live grading pass so the
     *  two can never disagree about what a note is supposed to sound like. */
    const targetFreqsFor = (note: any): { targetFreq: number; preBendTargetFreq: number } => {
      if (note.isDead) return { targetFreq: 0, preBendTargetFreq: 0 };
      const bendOffset = (note.isBend || note.isPreBend) && note.bendSemitones ? note.bendSemitones : 0;
      const freqForOffset = (semitoneOffset: number) => typeof note.midiNote === "number"
        ? midiToFrequency(note.midiNote + semitoneOffset)
        : getFrequencyFromTab(note.string, note.fret + semitoneOffset, tuningOffsets);
      return {
        targetFreq: getAdjustedTargetFreq(note.string, freqForOffset(bendOffset)),
        preBendTargetFreq: note.isBend && !note.isPreBend && bendOffset !== 0
          ? getAdjustedTargetFreq(note.string, freqForOffset(0))
          : 0,
      };
    };

    const baseToleranceFor = (targetFreq: number) =>
      targetFreq < 100 ? CENTS_TOLERANCE + 25
        : targetFreq < 165 ? CENTS_TOLERANCE + 15
          : CENTS_TOLERANCE;

    // Single picked notes whose pitch a long previous note already leaves
    // ringing (see isSamePitchContinuation). The exercise loops, so the first
    // note follows the last one.
    const msPerBeatAtTempo = 60000 / effectiveBpm;
    const isContinuation = flatBeats.map(({ beat, beatStart, beatEnd }, i) => {
      if (beat.notes.length !== 1 || !hasOwnAttack(beat.notes[0])) return false;
      const prev = flatBeats[i > 0 ? i - 1 : flatBeats.length - 1];
      if (prev.beat.notes.length !== 1 || prev.beat.notes[0].isDead) return false;
      return isSamePitchContinuation(
        targetFreqsFor(prev.beat.notes[0]).targetFreq,
        targetFreqsFor(beat.notes[0]).targetFreq,
        (prev.beatEnd - prev.beatStart) * msPerBeatAtTempo,
        (beatEnd - beatStart) * msPerBeatAtTempo,
      );
    });

    const pitchFocused = scoringFocus === "pitch";
    // Not cleared here: this effect restarts on every identity change of its
    // inputs, and the notes waiting for a verdict belong to the run, not to it.
    const pendingIntonation = pendingIntonationRef.current;

    /** Appends a graded note to the run log; returns its index, -1 past the cap. */
    const logRunNote = (note: RunNote): number => {
      if (runLogRef.current.length >= MAX_TIMED_NOTES) return -1;
      return runLogRef.current.push(note) - 1;
    };

    const tick = () => {
      const now = Date.now();

      const currentFreq   = audioRefs.frequencyRef.current;
      const currentVolume = audioRefs.rawVolumeRef.current;
      const lastOnsetTime = audioRefs.lastOnsetTimeRef.current;
      const lastTickTime  = audioRefs.lastTickTimeRef.current;
      // Noise-floor-relative gate once measured (see guitarBufferProcessor.ts);
      // falls back to the fixed constant until a first confirmed-silent window
      // has been observed this session.
      const volumeGateBase = audioRefs.noiseFloorRef.current > 0
        ? getAdaptiveVolumeGate(audioRefs.noiseFloorRef.current)
        : VOLUME_GATE;

      // Lazy spectrum — read at most once per tick, only for chord beats, with
      // its loudest peak (what every chord tone's level is held against).
      let spectrum: { heard: Spectrum; peak: number } | null | undefined = undefined;
      const getSpectrum = () => {
        if (spectrum === undefined) {
          const heard = audioRefs.readSpectrum?.() ?? null;
          spectrum = heard ? { heard, peak: spectrumPeak(heard) } : null;
        }
        return spectrum;
      };

      const beatsPerSec      = effectiveBpm / 60;
      const beatDurationMs   = 60000 / effectiveBpm;
      const onsetRecencyMs   = Math.min(800, Math.max(200, beatDurationMs * 0.8));
      const windowMs         = Math.min(420, Math.max(130, beatDurationMs * 0.30));
      const windowBeats      = (windowMs / 1000) * beatsPerSec;
      const earlyWindowBeats = (Math.max(16, Math.min(50, beatDurationMs * 0.05)) / 1000) * beatsPerSec;

      // Position on the clock the user hears (audio context), tempo-map-aware,
      // shifted back by the input latency so windows line up with the played note.
      const rawElapsedSec = audioContext && audioStartTime != null
        ? audioContext.currentTime - audioStartTime
        : (now - startTime) / 1000;
      const elapsedSec = rawElapsedSec - (calibratedLatencyMs ?? getLatencyMs()) / 1000;
      const beatsTotal = beatClock
        ? beatClock.toBeats(elapsedSec)
        : elapsedSec * beatsPerSec;
      const loopedBeatsElapsed = beatsTotal % totalExBeats;
      const hasRecentOnset     = (now - lastOnsetTime) < onsetRecencyMs;
      const hasRecentTick      = (now - lastTickTime)  < onsetRecencyMs;

      // Detect loop restart — reset note tracking
      if (loopedBeatsElapsed < lastLoopedBeatsRef.current - 0.1) {
        // The pass is over, so is every bend still waiting for its verdict.
        for (const [noteKey, pending] of pendingIntonation) settleIntonation(noteKey, pending);
        hitNotesRef.current   = {};
        missedNotesRef.current = {};
        processedNotesRef.current.clear();
        consumedAttacksRef.current.clear();
        chordEvidenceRef.current.clear();
        needsFlushRef.current = true;
      }
      lastLoopedBeatsRef.current = loopedBeatsElapsed;

      const gs = gameStateRef.current;
      const s  = statsRef.current;

      // ── Intonation of the pitch-graded notes still playing out ──────────
      for (const [noteKey, pending] of pendingIntonation) {
        if (now >= pending.trackFromMs && loopedBeatsElapsed <= pending.beatEnd
            && currentVolume > pending.volumeGate && currentFreq > 20) {
          const cents = getCentsDistance(correctOctaveForLowStrings(currentFreq, pending.targetFreq), pending.targetFreq);
          if (pending.kind === "note") {
            if (isNearPitch(cents)) pending.readings.push(cents);
          } else {
            pending.best = closerIntonation(pending.best, cents);
          }
        }
        if (loopedBeatsElapsed > pending.beatEnd) settleIntonation(noteKey, pending);
      }

      // We must search slightly further back than windowBeats so we can evaluate `isPassed` and mark misses
      let low = 0, high = flatBeats.length - 1, startIdx = 0;
      const searchTarget = Math.max(0, loopedBeatsElapsed - windowBeats - (beatsPerSec * 1.5)); // Look 1.5s into the past
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (flatBeats[mid].beatEnd < searchTarget) { startIdx = mid + 1; low = mid + 1; }
        else high = mid - 1;
      }

      // ── Attack assignment (onset-anchored pitch) ──────────────────────────
      // Pitch reaches us later than the attack that produced it — ~40 ms in the
      // high register, ~105 ms in the low one. Read as a "what is sounding now"
      // value it therefore gets attributed to whichever note the cursor has
      // reached by the time it lands, which past ~140 BPM in sixteenths is the
      // NEXT note. Each detected attack instead carries its own onset timestamp,
      // and matching attacks to expected notes is a small assignment problem
      // solved once per tick over only the notes currently in window.
      //
      // Strictly additive: a note credited here is one whose correct pitch WAS
      // detected, merely too late for the live check below to see it against the
      // right note. Nothing the live check already credits changes.
      const eventHits = new Map<string, number>();
      const attacks = audioRefs.noteEventsRef.current;
      if (attacks.length > 0) {
        const expected: ExpectedAttack[] = [];
        const msPerBeat = 1000 / beatsPerSec;
        for (let i = startIdx; i < flatBeats.length; i++) {
          const { beat, beatStart, beatEnd, notes } = flatBeats[i];
          if (beatStart > loopedBeatsElapsed + earlyWindowBeats + 1) break;
          // Chords are graded on the spectrum, not on a single pitch.
          if (beat.notes.length !== 1) continue;
          const inWindow = loopedBeatsElapsed >= beatStart - earlyWindowBeats
            && loopedBeatsElapsed <= beatEnd + windowBeats;
          if (!inWindow) continue;

          for (const { note, noteKey } of notes) {
            if (note.isDead) continue;                       // no pitch to attribute
            if (!hasOwnAttack(note)) continue;               // legato / release: nothing picked
            if (hitNotesRef.current[noteKey] || processedNotesRef.current.has(noteKey)) continue;
            const { targetFreq } = targetFreqsFor(note);
            if (targetFreq <= 0) continue;
            expected.push({
              key: noteKey,
              // Expected attack time in the events' own timestamp domain: both
              // sides are latency-compensated by getLatencyMs() via
              // loopedBeatsElapsed, so they line up without a second correction.
              timeMs: now + (beatStart - loopedBeatsElapsed) * msPerBeat,
              targetFreq,
              toleranceCents: baseToleranceFor(targetFreq),
              volumeGate: getDetectionGates(targetFreq, volumeGateBase).volumeGate,
              ...(isContinuation[i] && { earliestDeltaMs: continuationAttackFloorMs((beatEnd - beatStart) * msPerBeat) }),
            });
          }
        }

        if (expected.length > 0) {
          const fresh = attacks.filter(a => !consumedAttacksRef.current.has(a.onsetMs));
          for (const assignment of assignAttacks(fresh, expected, windowMs)) {
            eventHits.set(assignment.key, assignment.deltaMs);
            consumedAttacksRef.current.add(fresh[assignment.eventIndex].onsetMs);
          }
        }
        // The attack buffer is bounded, so anything no longer in it can never be
        // offered again and its "consumed" marker is dead weight.
        if (consumedAttacksRef.current.size > 256) {
          const live = new Set(attacks.map(a => a.onsetMs));
          consumedAttacksRef.current = new Set(
            [...consumedAttacksRef.current].filter(t => live.has(t))
          );
        }
      }

      for (let i = startIdx; i < flatBeats.length; i++) {
        const { beat, beatStart, beatEnd, notes } = flatBeats[i];
        if (beatStart > loopedBeatsElapsed + earlyWindowBeats + 1) break;

        const isWithinWindow =
          (loopedBeatsElapsed >= beatStart - earlyWindowBeats && loopedBeatsElapsed <= beatEnd + windowBeats) ||
          (loopedBeatsElapsed < earlyWindowBeats && beatEnd + windowBeats >= totalExBeats);
        const isPassed = loopedBeatsElapsed > beatEnd + windowBeats;

        notes.forEach(({ note, noteKey }) => {
          const existingHit = hitNotesRef.current[noteKey];
          if (processedNotesRef.current.has(noteKey) && !existingHit) return;

          const requiresOnset = hasOwnAttack(note);

          // Expected pitch of this note (0 for dead/muted notes — no pitch).
          // Prefer the note's real MIDI pitch (carries the track's actual tuning:
          // Drop C/D, 7-string, capo). Falls back to standard-tuning fret math for
          // regular exercises, where midiNote is undefined.
          // (`preBendTargetFreq` is the unbent pitch of an in-progress, not
          // pre-bent, bend — see the bend branch below. 0 for every other note.)
          const { targetFreq, preBendTargetFreq } = targetFreqsFor(note);

          // High strings (≥ E4) ring quieter, so relax the volume gate there to
          // cut false negatives.
          const gates = getDetectionGates(targetFreq, volumeGateBase);

          // Is this note's correct pitch sounding *right now*? Shared by the initial
          // grade and the sustain tracking below (`sustaining`).
          const pitchIsSounding = (sustaining: boolean): boolean => {
            if (note.isDead) return hasRecentTick || hasRecentOnset;
            if (beat.notes.length > 1) {
              // A chord tone is looked for at its own frequency in the live
              // spectrum (chordTones.ts). A tone already hit only has to stay
              // there, which a decaying string does more faintly — an easier bar,
              // so the fill doesn't cut off the moment one string fades a little.
              const live = getSpectrum();
              return !!live && isChordToneSounding(live.heard, targetFreq, sustaining ? CHORD_TONE_SUSTAIN : CHORD_TONE_HIT, live.peak);
            }
            // Thicker strings (like E6) often drift sharp on attack and are harder to tune…
            const baseTolerance = baseToleranceFor(targetFreq);
            // …and a confidently-detected expected note earns a little extra, so tuning
            // drift on the intended note is forgiven (never a full semitone).
            const tolerance = getExpectationBiasedTolerance(baseTolerance, audioRefs.confidenceRef.current);

            // Only the actually-played fundamental counts. Octave/harmonic-ratio
            // aliases (½, ⅓, ¼, 2×) used to also score a hit, meant to forgive the
            // pitch detector misreading which harmonic it caught on the SAME string —
            // but on a guitar those exact ratios (octave, octave+fifth, two octaves…)
            // occur constantly between genuinely different notes on different
            // strings/frets, so any confidently-detected note within roughly a
            // harmonic ratio of the target scored a false hit. Confidence doesn't
            // distinguish "detector misread this string" from "a real different
            // note that happens to share a ratio" — so require the direct match.
            //
            // The one narrow exception: correctOctaveForLowStrings undoes a
            // *specific, already-known* 2nd-harmonic misdetection on low strings
            // (E2/A2/D3) — the same fix already shipped in the tuner
            // (useTuningFrequency.ts) and calibration wizard
            // (useCalibrationCapture.ts) for the exact same detector quirk,
            // just never ported to actual gameplay matching. Unlike the removed
            // broad harmonic-ratio matching above, this only ever applies when
            // the *target* is below 165 Hz, not to every note everywhere.
            const correctedFreq = correctOctaveForLowStrings(currentFreq, targetFreq);
            if (correctedFreq > 20 && Math.abs(getCentsDistance(correctedFreq, targetFreq)) <= tolerance) return true;

            // A bend-in-progress (isBend, not isPreBend) physically starts at the
            // unbent pitch and rises to the full target sometime during the
            // note's own span — grading only against the fully-bent target the
            // whole time would miss a correctly-executed bend that just hasn't
            // reached the top yet. Only while still within the note's own
            // duration (loopedBeatsElapsed < beatEnd); past that the bend should
            // be complete and only the full target counts, same as before.
            if (preBendTargetFreq > 0 && loopedBeatsElapsed < beatEnd) {
              const correctedPreBend = correctOctaveForLowStrings(currentFreq, preBendTargetFreq);
              return correctedPreBend > 20 && Math.abs(getCentsDistance(correctedPreBend, preBendTargetFreq)) <= tolerance;
            }
            return false;
          };

          // ── Already scored: grow the green fill for as long as the note is
          // actually held. Advance the stored beat only while the cursor is still
          // inside THIS note's own span and the correct pitch keeps ringing (no
          // re-attack needed). Stop playing → the beat freezes → the fill stops
          // exactly there. Never rewind. Score/combo were counted once, at the
          // attack below — this pass only moves the visual fill. ──
          if (existingHit) {
            if (typeof existingHit === "number"
                && loopedBeatsElapsed > existingHit
                && loopedBeatsElapsed <= beatEnd
                && currentVolume > gates.volumeGate
                && pitchIsSounding(true)) {
              hitNotesRef.current[noteKey] = Math.min(loopedBeatsElapsed, beatEnd);
              needsFlushRef.current = true;
            }
            return;
          }

          if (isWithinWindow) {
            let beatsUntilDue = beatStart - loopedBeatsElapsed;
            // The last note, graded late just after the loop wrapped.
            if (beatsUntilDue > totalExBeats / 2) beatsUntilDue -= totalExBeats;
            const dueMs = now + beatsUntilDue * beatDurationMs;
            const noteMs = (beatEnd - beatStart) * beatDurationMs;
            // Before this, an attack belongs to the note still ringing. For a
            // note whose pitch is already sounding that is most of the window,
            // since its pitch alone proves nothing (isSamePitchContinuation).
            const prevBeat = flatBeats[i > 0 ? i - 1 : flatBeats.length - 1];
            const attackFloorMs = isContinuation[i]
              ? continuationAttackFloorMs(noteMs)
              : -((prevBeat.beatEnd - prevBeat.beatStart) * beatDurationMs) / 2;

            // Two independent routes to a hit. The live check is unchanged; the
            // attack route only ever fires for a note the live check could not
            // credit, because the pitch proving it arrived too late. A
            // continuation needs an attack of its own, not one from the note
            // before that happens to sit inside the recency window.
            const hasOwnRecentAttack = isContinuation[i]
              ? Math.max(lastOnsetTime, lastTickTime) - dueMs >= attackFloorMs
              : hasRecentOnset || hasRecentTick;
            const mayHit = currentVolume > gates.volumeGate && (hasOwnRecentAttack || !requiresOnset);
            // A chord tone is read in every frame after the strum, not just at
            // the attack — the strum's last string lands tens of ms after its
            // first — and counts once it has held for a moment, so a pick's
            // transient can't pass for it.
            const liveHit = mayHit && (beat.notes.length > 1
              ? chordEvidenceRef.current.observe(noteKey, lastOnsetTime, now, pitchIsSounding(false))
              : pitchIsSounding(false));

            if (liveHit || eventHits.has(noteKey)) {
              // First (and only) grade of this note — the guards above guarantee
              // it was neither processed nor hit before.
              processedNotesRef.current.add(noteKey);

              // ── Timing: how far the attack landed from the note's due time ──
              // The attack route carries its own Δt. A live hit is timed by the
              // latest attack — the pitch that proved the hit arrives tens of ms
              // after it, so the moment of the hit itself would read as late.
              const liveAttackDeltaMs = (): number | null => {
                // Legato notes have no attack of their own, and a tick alone
                // (muted note) leaves no precise time — neither can be timed.
                const attackMs = audioRefs.lastAttackMsRef?.current ?? 0;
                if (!requiresOnset || !hasRecentOnset || attackMs <= 0) return null;
                const deltaMs = attackMs - dueMs;
                // An attack before the floor was the previous note's — a
                // repeated pitch still ringing, say. This note's own attack
                // wasn't seen, so there is nothing to time.
                return deltaMs < attackFloorMs ? null : deltaMs;
              };
              const attackDeltaMs = eventHits.get(noteKey) ?? liveAttackDeltaMs();
              const timingGrade = gradeTiming(attackDeltaMs, noteMs);

              s.hits++;
              const newCombo      = gs.combo + 1;
              if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
              const newMultiplier = Math.min(8, Math.floor(newCombo / 5) + 1);
              const logIndex = logRunNote({ hit: true, timingMs: attackDeltaMs === null ? null : Math.round(attackDeltaMs), cents: null });
              const intonationKind = pitchFocused && beat.notes.length === 1 ? intonationKindOf(note) : null;
              if (intonationKind) {
                // Scored once the note has played out — a bend is judged on
                // where it got to, a fretted note on where it sat, and the
                // attack knows neither yet. A picked note's first readings
                // are still the note before it.
                const settleMs = intonationKind === "note" ? noteSettleMs(noteMs) : INTONATION_SETTLE_MS;
                const trackFromMs = requiresOnset ? now + settleMs : now;
                const freq = correctOctaveForLowStrings(currentFreq, targetFreq);
                const centsNow = freq > 20 ? getCentsDistance(freq, targetFreq) : Number.NaN;
                pendingIntonation.set(noteKey, {
                  kind: intonationKind, beatEnd, multiplier: newMultiplier, tempoFactor, targetFreq, volumeGate: gates.volumeGate, trackFromMs,
                  best: !requiresOnset && intonationKind !== "note" ? closerIntonation(null, centsNow) : null,
                  readings: [],
                  atHit: isNearPitch(centsNow) ? centsNow : null,
                  logIndex,
                });
              } else {
                // Pitch-focused exercises don't charge for timing — it is still
                // measured and shown, just not scored.
                const scoredGrade: TimingGrade = pitchFocused ? 3 : timingGrade;
                gs.score += Math.round(100 * newMultiplier * tempoFactor * TIMING_GRADE_POINTS[scoredGrade]);
              }
              gs.combo  = newCombo;
              gs.multiplier = newMultiplier;
              if (minScoredBpmRef.current === null || scoredBpm < minScoredBpmRef.current) {
                minScoredBpmRef.current = scoredBpm;
              }

              const perfect = isPerfectTiming(attackDeltaMs);
              noteTimingsRef.current[noteKey] = {
                grade: timingGrade,
                hint: timingHintFor(attackDeltaMs),
                offsetBeats: attackDeltaMs === null ? null : attackDeltaMs / beatDurationMs,
              };
              onNoteJudgedRef.current?.({ noteKey, hit: true, grade: timingGrade, perfect, combo: newCombo });
              timingCountsRef.current[timingGrade]++;
              if (attackDeltaMs !== null && timingOffsetsRef.current.length < MAX_TIMED_NOTES) {
                timingOffsetsRef.current.push(attackDeltaMs);
              }

              hitNotesRef.current[noteKey] = loopedBeatsElapsed;
              needsFlushRef.current = true;
            }
          } else if (isPassed) {

            processedNotesRef.current.add(noteKey);
            missedNotesRef.current[noteKey] = true;
            needsFlushRef.current = true;
            s.misses++;
            logRunNote({ hit: false, timingMs: null, cents: null });
            // A miss breaks the streak, and the multiplier is the streak's — the
            // next hit scores at x1 — so the HUD drops to x1 right away too.
            gs.combo = 0;
            gs.multiplier = 1;
            onNoteJudgedRef.current?.({ noteKey, hit: false, grade: null, perfect: false, combo: 0 });
          }
        });
      }

      // ── The note under the cursor, for the tab to animate ────────────────
      // A bend or release always gets its gauge. A held note gets a tuner
      // only where intonation is scored, and only once it has been played and
      // its pitch has settled — before that the string still sounds the note
      // before it, and the needle would judge the wrong note.
      let livePitch: LivePitch | null = null;
      for (let i = startIdx; i < flatBeats.length; i++) {
        const { beatStart, beatEnd, notes } = flatBeats[i];
        if (beatStart > loopedBeatsElapsed) break;
        if (loopedBeatsElapsed >= beatEnd || notes.length !== 1) continue;
        const { note, noteKey } = notes[0];
        if (note.isDead) break;
        const kind = note.isRelease ? "release" : note.isBend && !note.isPreBend ? "bend" : "note";
        const { targetFreq, preBendTargetFreq } = targetFreqsFor(note);
        if (kind === "note") {
          const pending = pendingIntonation.get(noteKey);
          if (!pitchFocused || !pending || now < pending.trackFromMs) break;
          const freq = currentVolume > volumeGateBase ? correctOctaveForLowStrings(currentFreq, targetFreq) : 0;
          const cents = freq > 20 ? getCentsDistance(freq, targetFreq) : Number.NaN;
          livePitch = { noteKey, kind, amount: null, cents: isNearPitch(cents) ? Math.round(cents) : null };
          break;
        }
        const unbentFreq = kind === "bend" ? preBendTargetFreq : targetFreq;
        const freq = currentVolume > volumeGateBase ? correctOctaveForLowStrings(currentFreq, unbentFreq) : 0;
        livePitch = {
          noteKey, kind,
          amount: liveBendAmount(kind, freq, unbentFreq, note.bendSemitones ?? 2),
          cents: freq > 20 ? Math.round(getCentsDistance(freq, targetFreq)) : null,
        };
        break;
      }
      livePitchRef.current = livePitch;

      flushToReact();
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafIdRef.current);
      livePitchRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, startTime, audioContext, audioStartTime, beatClock, effectiveBpm, activeTablature, isMicEnabled, currentExerciseIndex, getLatencyMs, audioRefs, getAdjustedTargetFreq, tuningOffsets, speedMultiplier, rawBpm, calibratedLatencyMs, scoringFocus, settleIntonation]);

  return { hitNotes, missedNotes, sessionAccuracy, sessionStats, gameState, maxCombo, maxPossibleScore, currentBeatsElapsedRef, minScoredBpmRef, noteTimings, timingCountsRef, timingOffsetsRef, intonationCountsRef, intonationOffsetsRef, runLogRef, livePitchRef, settlePendingIntonation, resetGame };
}
