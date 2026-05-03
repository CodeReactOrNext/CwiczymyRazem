import { useEffect, useRef, useState } from "react";
import { getNoteFromFrequency } from "utils/audio/noteUtils";

interface LiveTunerState {
  cents:    number;
  hasNote:  boolean;
  noteName: string;
  octave:   number;
}

export function useLiveTuner(
  frequencyRef: React.MutableRefObject<number>,
  volumeRef:    React.MutableRefObject<number>,
) {
  const [state, setState] = useState<LiveTunerState>({ cents: 0, hasNote: false, noteName: "A", octave: 4 });
  const rafRef  = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (now - lastRef.current >= 50) {
        lastRef.current = now;
        const freq = frequencyRef.current;
        const vol  = volumeRef.current;
        if (freq > 40 && vol > 0.005) {
          const data = getNoteFromFrequency(freq);
          if (data) {
            setState({ cents: data.cents, hasNote: true, noteName: data.note, octave: data.octave });
          }
        } else {
          setState(s => ({ ...s, hasNote: false }));
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [frequencyRef, volumeRef]);

  return state;
}
