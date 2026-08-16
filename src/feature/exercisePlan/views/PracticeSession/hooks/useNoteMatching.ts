import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useEffect, useMemo, useRef } from "react";
import { computeChromagram, correctOctaveForLowStrings, freqToPitchClass, getAdaptiveVolumeGate, getCentsDistance, getDetectionGates, getExpectationBiasedTolerance, getFrequencyFromTab, midiToFrequency } from "utils/audio/noteUtils";

import type { TablatureMeasure } from "../../../types/exercise.types";
import type { ExpectedAttack } from "./noteEventGrader";
import { assignAttacks } from "./noteEventGrader";
import { buildTempoMap, createBeatClock } from "./tempoBeatClock";
import { useGameState } from "./useGameState";

const CENTS_TOLERANCE      = 45;
const CHORD_CHROMA_THRESHOLD = 0.55;
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
  /** raw metronome BPM — used for score bonus calculation */
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
}

export function useNoteMatching({
  isPlaying, startTime, audioContext, audioStartTime, effectiveBpm, rawBpm,
  activeTablature, isMicEnabled, currentExerciseIndex,
  speedMultiplier, getLatencyMs, audioRefs, getAdjustedTargetFreq, tuningOffsets, onReset,
}: UseNoteMatchingOptions) {
  const {
    hitNotes, missedNotes, sessionAccuracy, sessionStats, maxCombo, gameState,
    hitNotesRef, missedNotesRef, gameStateRef, statsRef,
    maxComboRef, consecutiveMissesRef, needsFlushRef,
    flushToReact, reset: resetGame,
  } = useGameState(currentExerciseIndex, onReset);

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
    const halfPenalty = speedMultiplier;
    const bpmB        = 1 + (rawBpm - 100) * 0.001;
    let total = 0;
    for (let i = 0; i < totalNotes; i++) {
      total += Math.round(100 * Math.min(8, Math.floor(i / 5) + 1) * halfPenalty * bpmB);
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

    const halfSpeedPenalty = speedMultiplier;
    const bpmBonus         = 1 + (rawBpm - 100) * 0.001;

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

      // Lazy chromagram — computed at most once per tick, only for chord beats
      let chromagram: Float32Array | null | undefined = undefined;
      const getChromagram = (): Float32Array | null => {
        if (chromagram === undefined) chromagram = audioRefs.analyserRef.current ? computeChromagram(audioRefs.analyserRef.current) : null;
        return chromagram;
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
      const elapsedSec = rawElapsedSec - getLatencyMs() / 1000;
      const beatsTotal = beatClock
        ? beatClock.toBeats(elapsedSec)
        : elapsedSec * beatsPerSec;
      const loopedBeatsElapsed = beatsTotal % totalExBeats;
      const hasRecentOnset     = (now - lastOnsetTime) < onsetRecencyMs;
      const hasRecentTick      = (now - lastTickTime)  < onsetRecencyMs;

      // Detect loop restart — reset note tracking
      if (loopedBeatsElapsed < lastLoopedBeatsRef.current - 0.1) {
        hitNotesRef.current   = {};
        missedNotesRef.current = {};
        processedNotesRef.current.clear();
        consumedAttacksRef.current.clear();
        needsFlushRef.current = true;
      }
      lastLoopedBeatsRef.current = loopedBeatsElapsed;

      const gs = gameStateRef.current;
      const s  = statsRef.current;

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
          // Chords are graded on the chromagram, not on a single pitch.
          if (beat.notes.length !== 1) continue;
          const inWindow = loopedBeatsElapsed >= beatStart - earlyWindowBeats
            && loopedBeatsElapsed <= beatEnd + windowBeats;
          if (!inWindow) continue;

          for (const { note, noteKey } of notes) {
            if (note.isDead) continue;                       // no pitch to attribute
            if (note.isHammerOn || note.isPullOff) continue;  // no attack of their own
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
              volumeGate: getDetectionGates(targetFreq, volumeGateBase, CHORD_CHROMA_THRESHOLD).volumeGate,
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

          const requiresOnset = !note.isHammerOn && !note.isPullOff;

          // Expected pitch of this note (0 for dead/muted notes — no pitch).
          // Prefer the note's real MIDI pitch (carries the track's actual tuning:
          // Drop C/D, 7-string, capo). Falls back to standard-tuning fret math for
          // regular exercises, where midiNote is undefined.
          // (`preBendTargetFreq` is the unbent pitch of an in-progress, not
          // pre-bent, bend — see the bend branch below. 0 for every other note.)
          const { targetFreq, preBendTargetFreq } = targetFreqsFor(note);

          // High strings (≥ E4) ring quieter and carry weaker chroma energy, so
          // relax the volume/chroma gates there to cut false negatives.
          const gates = getDetectionGates(targetFreq, volumeGateBase, CHORD_CHROMA_THRESHOLD);

          // Is this note's correct pitch sounding *right now*? Shared by the initial
          // grade and the sustain tracking below. `liveChroma` forces the live FFT
          // (used while holding) over the onset snapshot (used at the attack).
          const pitchIsSounding = (liveChroma: boolean): boolean => {
            if (note.isDead) return hasRecentTick || hasRecentOnset;
            if (beat.notes.length > 1) {
              const chroma = (liveChroma || !requiresOnset) ? getChromagram() : audioRefs.onsetChromaRef.current;
              // liveChroma is only ever true from the sustain-tracking call below
              // (never the initial-hit grade) — use the lower hysteresis threshold
              // there so a naturally decaying chord's fill doesn't cut off the
              // instant one note's energy dips slightly below the (stricter)
              // threshold that was needed to register the hit in the first place.
              const threshold = liveChroma ? gates.sustainChromaThreshold : gates.chordChromaThreshold;
              return !!chroma && chroma[freqToPitchClass(targetFreq)] >= threshold;
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
            // Two independent routes to a hit. The live check is unchanged; the
            // attack route only ever fires for a note the live check could not
            // credit, because the pitch proving it arrived too late.
            const liveHit = currentVolume > gates.volumeGate
              && (hasRecentOnset || hasRecentTick || !requiresOnset)
              && pitchIsSounding(false);

            if (liveHit || eventHits.has(noteKey)) {
              // First (and only) grade of this note — the guards above guarantee
              // it was neither processed nor hit before.
              processedNotesRef.current.add(noteKey);

              s.hits++;
              consecutiveMissesRef.current = 0;
              const newCombo      = gs.combo + 1;
              if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
              const newMultiplier = Math.min(8, Math.floor(newCombo / 5) + 1);
              gs.score += Math.round(100 * newMultiplier * halfSpeedPenalty * bpmBonus);
              gs.combo  = newCombo;
              gs.multiplier = newMultiplier;

              hitNotesRef.current[noteKey] = loopedBeatsElapsed;
              needsFlushRef.current = true;
            }
          } else if (isPassed) {

            processedNotesRef.current.add(noteKey);
            missedNotesRef.current[noteKey] = true;
            needsFlushRef.current = true;
            s.misses++;
            consecutiveMissesRef.current++;
            gs.combo = 0;
            if (consecutiveMissesRef.current >= 3) gs.multiplier = 1;
          }
        });
      }

      flushToReact();
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafIdRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, startTime, audioContext, audioStartTime, beatClock, effectiveBpm, activeTablature, isMicEnabled, currentExerciseIndex, getLatencyMs, audioRefs, getAdjustedTargetFreq, tuningOffsets, speedMultiplier, rawBpm]);

  return { hitNotes, missedNotes, sessionAccuracy, sessionStats, gameState, maxCombo, maxPossibleScore, currentBeatsElapsedRef, resetGame };
}
