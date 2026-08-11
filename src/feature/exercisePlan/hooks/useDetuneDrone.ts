import { useCallback, useEffect, useRef, useState } from "react";
import { midiToFrequency } from "utils/audio/noteUtils";

import { centsToRatio } from "../logic/earQuiz/questions";

/** Harmonics stacked on each voice — a bare sine beats cleanly but sounds like a
 *  hearing test; a couple of overtones make it read as a string without muddying
 *  the beating the exercise is about. */
const HARMONICS: { multiple: number; gain: number }[] = [
  { multiple: 1, gain: 1 },
  { multiple: 2, gain: 0.32 },
  { multiple: 3, gain: 0.14 },
  { multiple: 4, gain: 0.06 },
];

const VOICE_LEVEL = 0.16;
const FADE_SECONDS = 0.08;
/** Glide time when the slider moves — long enough to kill zipper noise, short
 *  enough that the beating responds while the player is still dragging. */
const GLIDE_SECONDS = 0.03;

interface Voice {
  oscillators: OscillatorNode[];
  gain: GainNode;
}

function createVoice(
  ctx: AudioContext,
  frequency: number,
  destination: AudioNode,
): Voice {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(destination);

  const oscillators = HARMONICS.map(({ multiple, gain: level }) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency * multiple;

    const partial = ctx.createGain();
    partial.gain.value = level;

    osc.connect(partial);
    partial.connect(gain);
    osc.start();
    return osc;
  });

  return { oscillators, gain };
}

function retune(ctx: AudioContext, voice: Voice, frequency: number): void {
  voice.oscillators.forEach((osc, index) => {
    osc.frequency.setTargetAtTime(
      frequency * HARMONICS[index].multiple,
      ctx.currentTime,
      GLIDE_SECONDS,
    );
  });
}

/**
 * Two sustained tones a hair apart — the reference and the one the player is
 * tuning — so the beating between them is the whole interface. Retuning happens
 * on the live oscillators rather than by restarting them, which is what lets the
 * slider be dragged while listening.
 */
export function useDetuneDrone(referenceMidi: number, offsetCents: number) {
  const [isPlaying, setIsPlaying] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const referenceVoiceRef = useRef<Voice | null>(null);
  const tunedVoiceRef = useRef<Voice | null>(null);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      [referenceVoiceRef.current, tunedVoiceRef.current].forEach((voice) => {
        if (!voice) return;
        voice.gain.gain.cancelScheduledValues(ctx.currentTime);
        voice.gain.gain.setTargetAtTime(0, ctx.currentTime, FADE_SECONDS / 3);
      });
    }
    setIsPlaying(false);
  }, []);

  const start = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;

      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioContextClass();
        referenceVoiceRef.current = null;
        tunedVoiceRef.current = null;
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});

      const referenceFrequency = midiToFrequency(referenceMidi);
      if (!referenceVoiceRef.current)
        referenceVoiceRef.current = createVoice(
          ctx,
          referenceFrequency,
          ctx.destination,
        );
      if (!tunedVoiceRef.current)
        tunedVoiceRef.current = createVoice(
          ctx,
          referenceFrequency,
          ctx.destination,
        );

      retune(ctx, referenceVoiceRef.current, referenceFrequency);
      retune(
        ctx,
        tunedVoiceRef.current,
        referenceFrequency * centsToRatio(offsetCents),
      );

      [referenceVoiceRef.current, tunedVoiceRef.current].forEach((voice) => {
        voice.gain.gain.cancelScheduledValues(ctx.currentTime);
        voice.gain.gain.setTargetAtTime(
          VOICE_LEVEL,
          ctx.currentTime,
          FADE_SECONDS / 3,
        );
      });

      setIsPlaying(true);
    } catch {
      /* Web Audio unavailable — the panel stays usable, just silent */
    }
  }, [referenceMidi, offsetCents]);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else start();
  }, [isPlaying, start, stop]);

  // Follow the slider (and a fresh question) without restarting the voices.
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !referenceVoiceRef.current || !tunedVoiceRef.current) return;
    const referenceFrequency = midiToFrequency(referenceMidi);
    retune(ctx, referenceVoiceRef.current, referenceFrequency);
    retune(
      ctx,
      tunedVoiceRef.current,
      referenceFrequency * centsToRatio(offsetCents),
    );
  }, [referenceMidi, offsetCents]);

  useEffect(
    () => () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      [referenceVoiceRef.current, tunedVoiceRef.current].forEach((voice) => {
        voice?.oscillators.forEach((osc) => {
          try {
            osc.stop();
          } catch {
            /* already stopped */
          }
        });
      });
      void ctx.close().catch(() => {});
      ctxRef.current = null;
    },
    [],
  );

  return { isPlaying, start, stop, toggle };
}
