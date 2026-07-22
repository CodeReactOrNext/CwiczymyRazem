import type { useTimerInterface } from "hooks/useTimer";
import { useEffect } from "react";

interface UseDesktopSessionIntegrationParams {
  timer: useTimerInterface;
  /** Planned exercise duration in seconds; 0/undefined → no progress to report. */
  durationInSeconds: number;
  freeMode?: boolean;
}

/**
 * Desktop-shell (Electron) niceties for a running practice session — no-op on
 * the web build, where `window.electronApp` is undefined:
 * - keeps the display awake for the whole session (playing guitar means long
 *   stretches without keyboard/mouse input, which normally triggers sleep),
 * - mirrors the exercise's time progress on the Windows taskbar icon.
 */
export const useDesktopSessionIntegration = ({
  timer,
  durationInSeconds,
  freeMode,
}: UseDesktopSessionIntegrationParams) => {
  useEffect(() => {
    const api = window.electronApp;
    if (!api) return undefined;
    api.setKeepAwake(true);
    return () => {
      api.setKeepAwake(false);
    };
  }, []);

  useEffect(() => {
    const api = window.electronApp;
    if (!api) return undefined;
    if (freeMode || !durationInSeconds) {
      api.setProgress(null);
      return undefined;
    }

    // The timer ticks often; only forward whole-percent changes over IPC.
    let lastPercent = -1;
    const unsubscribe = timer.subscribe((timeMs) => {
      const percent = Math.min(
        100,
        Math.floor(timeMs / 10 / durationInSeconds)
      );
      if (percent === lastPercent) return;
      lastPercent = percent;
      api.setProgress(percent / 100);
    });

    return () => {
      unsubscribe();
      api.setProgress(null);
    };
  }, [timer, durationInSeconds, freeMode]);
};
