import { cn } from "assets/lib/utils";
import type { MutableRefObject } from "react";
import { useEffect, useState } from "react";

const POLL_MS = 200;

/** Below this the correction loop is simply idling — nothing worth reporting. */
const IN_SYNC_MS = 15;

interface SyncDriftReadoutProps {
  driftMsRef: MutableRefObject<number>;
  active: boolean;
  className?: string;
}

/**
 * Live "how far off is it right now" figure.
 *
 * Reads the drift ref on its own interval instead of taking it as a prop: the
 * correction loop updates 5×/s, and routing that through session state would
 * re-render the whole practice view at the same rate.
 */
export function SyncDriftReadout({ driftMsRef, active, className }: SyncDriftReadoutProps) {
  const [driftMs, setDriftMs] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setDriftMs(Math.round(driftMsRef.current)), POLL_MS);
    return () => window.clearInterval(id);
  }, [active, driftMsRef]);

  if (!active) return null;

  const inSync = Math.abs(driftMs) <= IN_SYNC_MS;

  return (
    <span
      className={cn(
        "tabular-nums text-xs font-medium",
        inSync ? "text-emerald-400" : "text-zinc-400",
        className,
      )}>
      {inSync ? "in sync" : `${driftMs > 0 ? "+" : ""}${driftMs} ms`}
    </span>
  );
}
