import { cn } from "assets/lib/utils";
import { useEffect, useRef } from "react";

interface DetectionWaveProps {
  /** Live mic volume (0..1). */
  volumeRef: React.MutableRefObject<number>;
  /** Whether the mic is actively listening. */
  active: boolean;
  /** Tint the wave green while the player is on a correct note. */
  isMatch: boolean;
}

const BARS = 28;
const MIN_H = 5;

/**
 * A smooth, sound-reactive equaliser. It animates entirely via requestAnimationFrame
 * + direct DOM writes (no React re-renders), and eases the volume toward its target,
 * so it glides instead of jumping the way a per-frame text readout does.
 */
export function DetectionWave({ volumeRef, active, isMatch }: DetectionWaveProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const levelRef = useRef(0);
  const phaseRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return () => { /* nothing to clean up */ };
    const tick = () => {
      const raw = Math.min(1, (volumeRef?.current ?? 0) * 6); // boost quiet guitar levels
      levelRef.current += (raw - levelRef.current) * 0.18;     // ease toward target
      phaseRef.current += 0.16;
      const lvl = levelRef.current;
      for (let i = 0; i < BARS; i++) {
        const el = barsRef.current[i];
        if (!el) continue;
        const env = Math.sin((i / (BARS - 1)) * Math.PI);                 // bell shape: tall centre
        const wob = 0.5 + 0.5 * Math.sin(phaseRef.current + i * 0.45);    // travelling ripple
        const h = MIN_H + env * (4 * wob + lvl * 50 * (0.5 + 0.5 * wob));
        el.style.height = `${h}px`;
        el.style.opacity = `${0.3 + 0.7 * env}`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, volumeRef]);

  return (
    <div className="flex h-14 w-full items-center justify-center gap-[3px]">
      {Array.from({ length: BARS }, (_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className={cn("w-[3px] rounded-full transition-colors duration-300", isMatch ? "bg-emerald-400" : "bg-cyan-400/70")}
          style={{ height: MIN_H }}
        />
      ))}
    </div>
  );
}
