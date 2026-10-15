import { useEffect } from "react";

import { useUiSoundsStore } from "./uiSoundsStore";

/**
 * The app's own UI sounds — a handful of short, quiet cues for the moments worth
 * marking: a reward claimed, a level gained, a session finished.
 *
 * Synthesised with Web Audio rather than shipped as files: a few sine/triangle
 * partials with a fast attack and an exponential decay read as a soft chime, cost
 * nothing to load, and stay in one consistent voice.
 *
 * Never while you play: anything that listens to the guitar (a practice session)
 * holds a suppression via `useSuppressUiSounds`, so a cue can neither distract nor
 * leak into the microphone and get scored as a note.
 */
export type UiSound = "reward" | "levelUp" | "sessionComplete";

type Note = { freq: number; at: number; length: number };

// Pitches in Hz: G5 D6 / C5 E5 G5 C6 / G4 D5 — open fifths and a major arpeggio,
// bright but not shrill, and out of the way of the guitar's low register.
const CUES: Record<UiSound, { gain: number; notes: Note[] }> = {
  reward: {
    gain: 0.07,
    notes: [
      { freq: 783.99, at: 0, length: 0.22 },
      { freq: 1174.66, at: 0.08, length: 0.34 },
    ],
  },
  levelUp: {
    gain: 0.07,
    notes: [
      { freq: 523.25, at: 0, length: 0.2 },
      { freq: 659.25, at: 0.09, length: 0.2 },
      { freq: 783.99, at: 0.18, length: 0.24 },
      { freq: 1046.5, at: 0.27, length: 0.6 },
    ],
  },
  sessionComplete: {
    gain: 0.06,
    notes: [
      { freq: 392.0, at: 0, length: 0.4 },
      { freq: 587.33, at: 0.11, length: 0.55 },
    ],
  },
};

/** The same cue twice inside this window plays once (views mounted side by side). */
const DEDUPE_MS = 800;

const suppressions = new Set<symbol>();
const lastPlayed = new Map<UiSound, number>();
let context: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
};

export const isUiSoundSuppressed = () => suppressions.size > 0;

/** Plays a cue unless sounds are off, something is listening, or it just played. */
export const playUiSound = (sound: UiSound) => {
  if (!useUiSoundsStore.getState().enabled || isUiSoundSuppressed()) return;

  const now = Date.now();
  if (now - (lastPlayed.get(sound) ?? 0) < DEDUPE_MS) return;
  lastPlayed.set(sound, now);

  const ctx = getContext();
  if (!ctx) return;
  // Cues follow a click, so the context may start — but never block on it.
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});

  const cue = CUES[sound];
  const start = ctx.currentTime + 0.01;
  for (const { freq, at, length } of cue.notes) {
    const t = start + at;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, t);
    envelope.gain.exponentialRampToValueAtTime(cue.gain, t + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + length);
    envelope.connect(ctx.destination);

    // Fundamental plus a quiet octave: a soft bell rather than a beep.
    for (const [type, mult, level] of [
      ["sine", 1, 1],
      ["triangle", 2, 0.18],
    ] as const) {
      const osc = ctx.createOscillator();
      const partial = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * mult, t);
      partial.gain.setValueAtTime(level, t);
      osc.connect(partial).connect(envelope);
      osc.start(t);
      osc.stop(t + length + 0.05);
    }
  }
};

/** Silences UI sounds while `active` — for anything that listens to the guitar. */
export const useSuppressUiSounds = (active: boolean) => {
  useEffect(() => {
    if (!active) return undefined;
    const token = Symbol("ui-sound-suppression");
    suppressions.add(token);
    return () => {
      suppressions.delete(token);
    };
  }, [active]);
};

/** Test hook: forget dedupe history and suppressions. */
export const resetUiSoundsForTests = () => {
  lastPlayed.clear();
  suppressions.clear();
  context = null;
};
