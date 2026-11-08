import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useEffect, useRef } from "react";

import { CLIP_PEAK, volumeToMeter } from "../inputLevel";

/** One bar per this long — about 3 s of history across the strip. */
const SAMPLE_MS = 35;
const BARS = 90;
const BAR = "#a1a1aa";
const BAR_CLIP = "#f87171";

/**
 * The input's recent loudness as a rolling waveform: one mirrored bar per
 * moment, as tall as the gained level on the meter's dB scale, red where the
 * input clipped. Drawn on a canvas by its own frame loop, so it never
 * re-renders the step around it.
 */
export function LevelWave({
  audioRefs, gain, active, className,
}: {
  audioRefs: AudioRefs;
  gain: number;
  active: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gainRef = useRef(gain);
  useEffect(() => { gainRef.current = gain; }, [gain]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !active) return undefined;
    const levels: { meter: number; clip: boolean }[] = [];
    let raf = 0;
    let lastSample = 0;
    let peak = 0;
    let clip = false;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const step = w / BARS;
      const barW = Math.max(1, step * 0.6);
      const mid = h / 2;
      // Newest on the right; the strip fills in from the right as it starts.
      levels.forEach((level, i) => {
        const x = w - (levels.length - i) * step + (step - barW) / 2;
        const half = Math.max(1, level.meter * mid);
        ctx.fillStyle = level.clip ? BAR_CLIP : BAR;
        ctx.globalAlpha = 0.35 + 0.65 * (i / BARS);
        ctx.fillRect(x, mid - half, barW, half * 2);
      });
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      // Hold the loudest reading between bars, so a short attack isn't missed.
      peak = Math.max(peak, volumeToMeter(audioRefs.rawVolumeRef.current * gainRef.current));
      clip ||= (audioRefs.inputPeakRef?.current ?? 0) >= CLIP_PEAK;
      if (now - lastSample >= SAMPLE_MS) {
        lastSample = now;
        levels.push({ meter: peak, clip });
        if (levels.length > BARS) levels.shift();
        peak = 0;
        clip = false;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, audioRefs]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
