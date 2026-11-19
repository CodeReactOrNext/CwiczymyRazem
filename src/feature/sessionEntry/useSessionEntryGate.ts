import { useEffect, useId, useState } from "react";

import { coverForSessionEntry } from "./sessionEntryStore";

/**
 * For screens that put a session in place of themselves without changing the
 * route (a plan picked from a list, a calendar item): pass whether a session
 * was asked for, render it only once this returns true.
 *
 * In between, the cut wipes in over the screen as it is, so the list is still
 * there under the bands and the session appears only behind them — instead of
 * the list vanishing the moment the button is pressed.
 */
export const useSessionEntryGate = (wanted: boolean): boolean => {
  const id = useId();
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    if (!wanted) return undefined;
    const cancel = coverForSessionEntry(id, () => setCovered(true));
    return () => {
      cancel();
      setCovered(false);
    };
  }, [wanted, id]);

  return wanted && covered;
};
