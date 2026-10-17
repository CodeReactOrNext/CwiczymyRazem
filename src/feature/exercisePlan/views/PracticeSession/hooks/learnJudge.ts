import type { Spectrum, ToneCriteria } from "utils/audio/chordTones";
import { createChordToneEvidence, isChordToneSounding, spectrumPeak } from "utils/audio/chordTones";
import { correctOctaveForLowStrings, getCentsDistance, getDetectionGates } from "utils/audio/noteUtils";

import type { LearnTarget } from "../utils/learnSteps";
import { requiredChordTones } from "../utils/learnSteps";

/** How long the right pitch has to stay up before a note counts — a pick's
 *  transient or a stray detector reading is gone by then, a string is not. */
export const LEARN_HOLD_MS = 60;

/** One reading of the mic, everything the judge needs to know about it. */
export interface LearnFrame {
  /** Date.now() — the same clock the detector stamps its onsets with. */
  now: number;
  freq: number;
  volume: number;
  /** The noise-floor gate before the high-string allowance (see getDetectionGates). */
  volumeGateBase: number;
  lastOnsetMs: number;
  lastTickMs: number;
  readSpectrum?: () => Spectrum | null;
}

/**
 * How far off its written pitch the detector's reading may sit (cents).
 *
 * Tighter than the timed matcher's 45 / 60 / 70, and with none of its
 * confidence bonus: a lesson that waits has no clock to be fair against, so it
 * can ask for a clean note. The low strings keep a wide window only because
 * the detector reads them sharp (E2 by ~50 cents) — which is also why this
 * check alone cannot tell E2 from the Eb2 a half step below it (that one reads
 * ~46 cents under E2). The spectrum below is what does.
 */
const toleranceFor = (freq: number) => (freq < 100 ? 65 : freq < 165 ? 50 : 35);

/**
 * What a note has to show in the live spectrum: a peak of its own, clearly above
 * the semitones on either side. The timed matcher asks for 0.6 of them; a
 * lesson asks for more, so a note a half step away — whose neighbour is the
 * one actually ringing — never passes for the written one.
 */
const LEARN_TONE: ToneCriteria = { ratio: 0.75, floor: 0.05 };

/**
 * Decides when the player has played the beat the lesson is waiting on.
 *
 * Nothing here knows about tempo. A beat counts once its notes are heard — and,
 * for a picked note, once a new attack has been heard since the last beat was
 * accepted, so a note still ringing from the beat before (or the same pitch
 * played twice) can never answer for the next one.
 */
export function createLearnJudge() {
  /** Attacks at or before these were spent on earlier beats. */
  let spentOnset = 0;
  let spentTick = 0;
  /** When the current beat started to wait — a note that only changes pitch
   *  (hammer-on, pull-off) has to be heard after this. */
  let armedAt = 0;
  /** Since when the right pitch has been up without a break. */
  let rightSince: number | null = null;
  const chordEvidence = createChordToneEvidence();

  const judgeMuted = (f: LearnFrame): boolean =>
    f.volume > f.volumeGateBase && Math.max(f.lastOnsetMs, f.lastTickMs) > Math.max(spentOnset, spentTick);

  const judgeNote = (target: LearnTarget, f: LearnFrame): boolean => {
    const gate = getDetectionGates(target.freq, f.volumeGateBase).volumeGate;
    const heard = correctOctaveForLowStrings(f.freq, target.freq);
    let isRight = f.volume > gate && heard > 20 && Math.abs(getCentsDistance(heard, target.freq)) <= toleranceFor(target.freq);
    // The pitch detector alone is not trusted with the last word: the spectrum
    // must show this very note too. Read only once the pitch looks right.
    if (isRight && f.readSpectrum) {
      const live = f.readSpectrum();
      isRight = !!live && isChordToneSounding(live, target.freq, LEARN_TONE, spectrumPeak(live));
    }
    if (!isRight) {
      rightSince = null;
      return false;
    }
    rightSince ??= f.now;
    if (!target.hasAttack) return f.now - Math.max(rightSince, armedAt) >= LEARN_HOLD_MS;
    if (f.lastOnsetMs <= spentOnset) return false;
    // Held since the new attack, not since the pitch happened to be right:
    // a repeated note was "right" the whole time.
    return f.now - Math.max(rightSince, f.lastOnsetMs) >= LEARN_HOLD_MS;
  };

  const judgeChord = (tones: LearnTarget[], f: LearnFrame): boolean => {
    if (f.lastOnsetMs <= spentOnset || f.volume <= f.volumeGateBase) return false;
    const heard = f.readSpectrum?.() ?? null;
    if (!heard) return false;
    const peak = spectrumPeak(heard);
    let ringing = 0;
    for (const tone of tones) {
      const isSounding = isChordToneSounding(heard, tone.freq, LEARN_TONE, peak);
      if (chordEvidence.observe(tone.noteKey, f.lastOnsetMs, f.now, isSounding)) ringing++;
    }
    return ringing >= requiredChordTones(tones.length);
  };

  return {
    /** Starts waiting on a new beat: attacks heard so far are not its own. */
    arm(f: LearnFrame) {
      spentOnset = f.lastOnsetMs;
      spentTick = f.lastTickMs;
      armedAt = f.now;
      rightSince = null;
      chordEvidence.clear();
    },
    /** True once the beat has been played. */
    judge(targets: readonly LearnTarget[], f: LearnFrame): boolean {
      const pitched = targets.filter((target) => !target.isDead && target.freq > 0);
      if (pitched.length === 0) return targets.length > 0 && judgeMuted(f);
      return pitched.length === 1 ? judgeNote(pitched[0], f) : judgeChord(pitched, f);
    },
  };
}
