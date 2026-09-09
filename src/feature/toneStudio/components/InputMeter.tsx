import { cn } from "assets/lib/utils";
import {
  CLIP_PEAK,
  meterZone,
  peakToDb,
  peakToMeterFraction,
} from "feature/toneStudio/utils/meter";
import { useEffect, useRef } from "react";

const ZONE_HEX = {
  quiet: "#52525b", // zinc-600
  ok: "#22d3ee", // cyan-400
  hot: "#fbbf24", // amber-400
  clip: "#f87171", // red-400
} as const;

/** Bar drop per animation frame once the signal falls, as a fraction of the
 *  full scale — fast enough to follow palm mutes, slow enough to read. */
const DECAY_PER_FRAME = 0.03;
const CLIP_HOLD_MS = 1200;

interface InputMeterProps {
  className?: string;
}

/**
 * Live input level of the running amp stream. Subscribes to the native meter
 * event itself and paints straight into the DOM from a rAF loop — ~20
 * readings/s through React state would re-render the whole toolbar for a bar
 * that only needs a width and a colour. Renders an empty bar (never crashes)
 * on desktop shells too old to send meter events.
 */
export const InputMeter = ({ className }: InputMeterProps) => {
  const fillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onMeter = window.nativeAmp?.onMeter;
    if (typeof onMeter !== "function") return undefined;

    let latest = 0; // last peak reported by the engine
    let shown = 0; // bar fraction currently painted (with decay)
    let clipUntil = 0;
    let raf = 0;

    const unsubscribe = onMeter(({ inPeak }) => {
      latest = inPeak;
      if (inPeak >= CLIP_PEAK) clipUntil = performance.now() + CLIP_HOLD_MS;
    });

    const paint = () => {
      const target = peakToMeterFraction(latest);
      shown =
        target >= shown ? target : Math.max(target, shown - DECAY_PER_FRAME);
      const clipping = performance.now() < clipUntil;
      const zone = clipping ? "clip" : meterZone(latest);
      if (fillRef.current) {
        fillRef.current.style.width = `${(shown * 100).toFixed(1)}%`;
        fillRef.current.style.backgroundColor = ZONE_HEX[zone];
      }
      if (labelRef.current) {
        labelRef.current.textContent = clipping
          ? "CLIP"
          : latest > 0.001
            ? `${peakToDb(latest).toFixed(0)} dB`
            : "—";
        labelRef.current.style.color = clipping ? ZONE_HEX.clip : "";
      }
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);

    return () => {
      unsubscribe();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className='w-10 shrink-0 text-[11px] text-zinc-400'>Input</span>
      <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800'>
        <div
          ref={fillRef}
          className='h-full w-0 rounded-full transition-[background-color] duration-150'
        />
      </div>
      <span
        ref={labelRef}
        className='font-mono w-12 shrink-0 text-right text-[11px] tabular-nums text-zinc-400'>
        —
      </span>
    </div>
  );
};
