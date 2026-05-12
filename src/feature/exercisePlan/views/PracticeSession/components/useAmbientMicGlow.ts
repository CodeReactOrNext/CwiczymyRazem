import type { MutableRefObject, RefObject } from "react";
import { useEffect } from "react";
import { getNoteFromFrequency, NOTES } from "utils/audio/noteUtils";

function interpolateHue(curr: number, target: number, step: number): number {
  let diff = target - curr;
  while (diff < -180) diff += 360;
  while (diff > 180)  diff -= 360;
  return curr + diff * step;
}

export function useAmbientMicGlow(
  ambientGlowRef: { current: HTMLDivElement | null },
  volumeRef:      MutableRefObject<number> | undefined,
  frequencyRef:   MutableRefObject<number> | undefined,
): void {
  useEffect(() => {
    if (!volumeRef) return;
    let rafId: number;
    let smoothedVolume = 0;
    let currentHue = 150;
    let targetHue  = 150;

    const updateGlow = () => {
      smoothedVolume += ((volumeRef.current || 0) - smoothedVolume) * 0.15;

      if (ambientGlowRef.current) {
        const intensity = Math.min(smoothedVolume * 8, 1);

        if (frequencyRef) {
          const freq = frequencyRef.current;
          if (freq > 50) {
            const noteData = getNoteFromFrequency(freq);
            if (noteData) {
              const noteIndex = NOTES.indexOf(noteData.note);
              if (noteIndex !== -1) targetHue = (noteIndex * 30 + 120) % 360;
            }
          }
        }

        currentHue = interpolateHue(currentHue, targetHue, 0.05);
        if (currentHue < 0) currentHue += 360;

        if (intensity > 0.01 || ambientGlowRef.current.style.opacity !== "0") {
          ambientGlowRef.current.style.opacity   = (intensity * 0.7).toFixed(3);
          const scale = 1 + intensity * 0.1;
          ambientGlowRef.current.style.transform = `scaleY(${scale.toFixed(3)}) translateZ(0)`;
          ambientGlowRef.current.style.filter    = `hue-rotate(${currentHue - 120}deg)`;
        }
      }
      rafId = requestAnimationFrame(updateGlow);
    };
    rafId = requestAnimationFrame(updateGlow);
    return () => cancelAnimationFrame(rafId);
  }, [volumeRef, ambientGlowRef, frequencyRef]);
}
