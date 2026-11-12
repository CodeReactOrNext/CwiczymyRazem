import { useEffect, useRef, useSyncExternalStore } from "react";

import type { TabPerfStats } from "./useTablatureWorkerBridge";

const STORAGE_KEY = "tab-perf";

/**
 * Whether the frame readout is on for this device. `?tabperf=1` on any page
 * switches it on and it stays on (localStorage) until `?tabperf=0` — a phone
 * has no console to set a flag from.
 */
function readTabPerfFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const asked = new URLSearchParams(window.location.search).get("tabperf");
    if (asked === "1") window.localStorage.setItem(STORAGE_KEY, "1");
    else if (asked === "0") window.localStorage.removeItem(STORAGE_KEY);
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => undefined;

export function useTabPerfFlag(): boolean {
  return useSyncExternalStore(noopSubscribe, readTabPerfFlag, () => false);
}

/**
 * A diagnostic readout over the tab, for finding out where a slow device loses
 * its frames. First line: the board's worker — frames painted of frames
 * offered, the cost of a paint on its thread, the canvas size. Second line:
 * the page's own thread — its frame rate and its longest gap in the last second.
 *
 * Reading it: few frames with a cheap paint → the GPU; an expensive paint →
 * the drawing code; a page line with long gaps → React or the matching loop.
 */
export function TabPerfOverlay({ stats }: { stats: TabPerfStats | null }) {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let last = 0;
    let since = 0;
    let frames = 0;
    let worst = 0;
    const tick = (stamp: number) => {
      if (last > 0) {
        frames++;
        worst = Math.max(worst, stamp - last);
      }
      last = stamp;
      if (since === 0) since = stamp;
      if (stamp - since >= 1000) {
        if (pageRef.current) {
          pageRef.current.textContent = `page ${Math.round((frames * 1000) / (stamp - since))} fps · worst ${Math.round(worst)} ms`;
        }
        since = stamp;
        frames = 0;
        worst = 0;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className='pointer-events-none absolute left-1 top-1 z-30 rounded bg-black/80 px-1.5 py-1 font-mono text-[10px] leading-tight text-zinc-100'>
      <div>
        {stats
          ? `board ${Math.round(stats.paintFps)}/${Math.round(stats.screenFps)} fps · paint ${stats.paintAvgMs.toFixed(1)}/${stats.paintMaxMs.toFixed(1)} ms · ${stats.width}×${stats.height} @${stats.dpr}${stats.lite ? " lite" : ""}`
          : "board …"}
      </div>
      <div ref={pageRef}>page …</div>
    </div>
  );
}
