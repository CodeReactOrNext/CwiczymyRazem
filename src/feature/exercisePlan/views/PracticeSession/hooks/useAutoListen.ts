import { useEffect, useRef } from "react";

/**
 * Plays the round once by itself: as it opens, or the moment the session starts
 * under the first one. Never again after that — a pause doesn't replay it.
 */
export function useAutoListen(shouldPlay: boolean, play: () => void) {
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; });

  useEffect(() => {
    if (shouldPlay) playRef.current();
  }, [shouldPlay]);
}
