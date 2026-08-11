import type { PreviewEvent } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";
import { playGuitarSequence, preloadGuitarNotePreview } from "feature/exercisePlan/hooks/useTablatureAudio/notePreview";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Plays one scheduled sequence at a time and tracks whether it is still
 * sounding, so a quiz's play button can turn into a stop button and a new
 * question never starts on top of the previous one.
 */
export function useEarQuizPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Warm the sampled guitar while the player is still reading the question.
  useEffect(() => { preloadGuitarNotePreview(); }, []);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    endTimerRef.current = null;
    setIsPlaying(false);
  }, []);

  /** `durationSeconds` is how long the whole sequence rings for, including tails. */
  const play = useCallback((events: PreviewEvent[], durationSeconds: number, volume?: number) => {
    stop();
    stopRef.current = playGuitarSequence(events, volume);
    setIsPlaying(true);
    endTimerRef.current = setTimeout(() => setIsPlaying(false), durationSeconds * 1000);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { isPlaying, play, stop };
}
