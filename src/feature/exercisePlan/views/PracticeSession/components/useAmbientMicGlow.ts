import type { MutableRefObject } from "react";
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
  /** False while the glow is switched off or the board is covered — the loop
   *  then does not run at all, rather than painting where nobody looks. */
  enabled = true,
): void {
  useEffect(() => {
    if (!volumeRef || !enabled) return;
    let rafId: number;
    let smoothedVolume = 0;
    let currentHue = 150;
    let targetHue  = 150;
    // What the element was last given. The glow is a large blended layer:
    // every write to it is work for the compositor, so a value that would
    // look the same as the one already there is not written again.
    let shownOpacity = "";
    let shownScale = "";
    let shownHue = Number.NaN;

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

        // Steps too small to see: 1/100 of the opacity, 1/1000 of the height, 1°.
        const opacity = intensity > 0.01 ? (intensity * 0.7).toFixed(2) : "0";
        const scale = (1 + intensity * 0.1).toFixed(3);
        const hue = Math.round(currentHue - 120);
        const style = ambientGlowRef.current.style;
        if (opacity !== shownOpacity) { style.opacity = opacity; shownOpacity = opacity; }
        // Nothing to see while it is dark: its shape and colour can wait.
        if (opacity !== "0") {
          if (scale !== shownScale) { style.transform = `scaleY(${scale}) translateZ(0)`; shownScale = scale; }
          if (hue !== shownHue) { style.filter = `hue-rotate(${hue}deg)`; shownHue = hue; }
        }
      }
      rafId = requestAnimationFrame(updateGlow);
    };
    rafId = requestAnimationFrame(updateGlow);
    return () => cancelAnimationFrame(rafId);
  }, [volumeRef, ambientGlowRef, frequencyRef, enabled]);
}
