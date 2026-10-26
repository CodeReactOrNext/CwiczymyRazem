import { memo, useEffect, useState } from "react";

import type { LoadingStep } from "./SessionLoadingSteps";
import { SessionLoadingSteps } from "./SessionLoadingSteps";

/** Gives up covering the session after this, so a file that never finishes
 *  loading doesn't lock the player out of it. */
const MAX_WAIT_MS = 45_000;

interface GpLoadingOverlayProps {
  /** What is still being loaded. Mount this only while something is. */
  steps: readonly LoadingStep[];
}

/**
 * Covers the session while a Guitar Pro exercise is still loading — the file,
 * its tracks, the player's sounds and song — so nothing is played half-ready.
 */
export const GpLoadingOverlay = memo(function GpLoadingOverlay({ steps }: GpLoadingOverlayProps) {
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGaveUp(true), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, []);
  if (gaveUp) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
      <div className="rounded-lg bg-zinc-900/80 px-6 py-5">
        <SessionLoadingSteps steps={steps} />
      </div>
    </div>
  );
});
