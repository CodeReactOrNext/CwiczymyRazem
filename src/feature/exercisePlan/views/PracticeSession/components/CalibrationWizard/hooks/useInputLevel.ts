import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useEffect, useRef, useState } from "react";

import { classifyLevel, type LevelStatus, volumeToMeter } from "../inputLevel";

/** How long the loudest moment stays on the meter and in the status. */
const HOLD_MS = 1500;
/** A clip stays reported this long, so a single one can't flash by unseen. */
const CLIP_HOLD_MS = 2500;
/** The bar falls from full scale to nothing in this long. */
const FALL_MS = 600;
const UI_INTERVAL_MS = 33;

export interface InputLevel {
  /** Current bar, 0–1 on the meter's dB scale. */
  meter: number;
  /** Peak-hold marker, same scale. */
  peak: number;
  status: LevelStatus;
  /** The guitar has been heard at least once since the input opened. */
  heard: boolean;
}

const IDLE: InputLevel = { meter: 0, peak: 0, status: "silent", heard: false };

/** Live input level for the setup meter — dB scale, fast rise, slow fall, peak hold. */
export function useInputLevel(audioRefs: AudioRefs, isListening: boolean, gain: number): InputLevel {
  const [level, setLevel] = useState<InputLevel>(IDLE);
  const gainRef = useRef(gain);
  useEffect(() => { gainRef.current = gain; }, [gain]);

  useEffect(() => {
    if (!isListening) return undefined;
    let raf = 0;
    let last = performance.now();
    let lastUi = 0;
    let meter = 0;
    let peak = 0, peakAt = 0;
    let rawHold = 0, rawHoldAt = 0;
    let clipPeak = 0, clipAt = 0;
    let heard = false;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const raw = audioRefs.rawVolumeRef.current;
      const rawPeak = audioRefs.inputPeakRef?.current ?? 0;
      const g = gainRef.current;

      const target = volumeToMeter(raw * g);
      meter = target >= meter ? target : Math.max(target, meter - dt / FALL_MS);
      if (meter >= peak || now - peakAt > HOLD_MS) { peak = meter; peakAt = now; }
      if (raw >= rawHold || now - rawHoldAt > HOLD_MS) { rawHold = raw; rawHoldAt = now; }
      if (rawPeak >= clipPeak || now - clipAt > CLIP_HOLD_MS) { clipPeak = rawPeak; clipAt = now; }

      if (now - lastUi >= UI_INTERVAL_MS) {
        lastUi = now;
        const status = classifyLevel({ rawHold, rawPeakHold: clipPeak, gain: g, noiseFloor: audioRefs.noiseFloorRef.current });
        if (status !== "silent") heard = true;
        setLevel({ meter, peak, status, heard });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isListening, audioRefs]);

  return isListening ? level : IDLE;
}
