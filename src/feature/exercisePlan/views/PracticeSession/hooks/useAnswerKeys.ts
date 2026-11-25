import { useEffect, useRef } from "react";

/** Number keys 1–9 pick the matching answer while the round is open. */
export function useAnswerKeys(count: number, onPick: (index: number) => void, enabled: boolean) {
  const pickRef = useRef(onPick);
  useEffect(() => { pickRef.current = onPick; });

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < count) pickRef.current(index);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count, enabled]);
}
