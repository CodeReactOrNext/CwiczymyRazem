import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useEffect, useRef, useState } from "react";
import { correctOctaveForLowStrings, getCentsDistance } from "utils/audio/noteUtils";

/** Reads frequencyRef/volumeRef at ~20fps and returns live tuner state for one target note. */
export function useTuningFrequency(audioRefs: AudioRefs, targetHz: number) {
  const [cents,   setCents]   = useState(0);
  const [hasNote, setHasNote] = useState(false);
  const rafRef  = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now - lastRef.current >= 50) {
        lastRef.current = now;
        const freq = audioRefs.frequencyRef.current;
        const vol  = audioRefs.volumeRef.current;
        if (freq > 40 && vol > 0.005) {
          const corrected = correctOctaveForLowStrings(freq, targetHz);
          setCents(getCentsDistance(corrected, targetHz));
          setHasNote(true);
        } else {
          setHasNote(false);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); setHasNote(false); };
  }, [audioRefs, targetHz]);

  return { cents, hasNote };
}
