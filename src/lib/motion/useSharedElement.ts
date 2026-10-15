import { useCallback, useState } from "react";
import { flushSync } from "react-dom";

/**
 * Makes a `layoutId` shared-element transition start from where the element is
 * *now*, for elements that are unmounted by the very action that opens the next
 * screen (a list row replaced by the detail view).
 *
 * framer-motion measures a layout element only when it re-renders, and nothing is
 * measured on unmount — so the "from" box was whatever the row looked like at its
 * last render, wrong after any scroll or reflow since. `runAfterSnapshot` re-renders
 * the element once, synchronously, with a new `layoutDependency` (which makes
 * framer snapshot it), then runs the action in the same event.
 *
 * Between those moments `layoutDependency` stays constant, so ordinary reflows
 * (filtering, paging) do not animate the element on its own.
 */
export const useSharedElement = () => {
  const [layoutDependency, setLayoutDependency] = useState(0);

  const runAfterSnapshot = useCallback((action: () => void) => {
    flushSync(() => setLayoutDependency((v) => v + 1));
    action();
  }, []);

  return { layoutDependency, runAfterSnapshot };
};
