import { useWakeLock } from "hooks/useWakeLock";
import { useCallback, useEffect, useState } from "react";

/** Remembered once the "add to home screen" tip has been shown, so it isn't shown again. */
export const INSTALL_HINT_SEEN_KEY = "practice-tab-fullscreen-install-hint-seen";

/** How long the controls stay over a playing tab after the last touch. */
export const CONTROLS_LINGER_MS = 3000;

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * The phone session's "like a film" mode: the tab alone on the whole screen.
 *
 * The session screen hiding everything but the board is the part that always works. The
 * browser's own full screen and the landscape lock are a bonus the platform may refuse — an
 * iPhone puts nothing but video full screen for real — so neither is waited on and neither can
 * fail the tap. Where the browser can't hide its own bars, the player is told once that the app
 * on the home screen has none.
 */
export function useTabFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);

  useWakeLock(isFullscreen);

  const enter = useCallback(() => {
    setIsFullscreen(true);
    const root = document.documentElement;
    if (root.requestFullscreen) {
      void root
        .requestFullscreen()
        .then(() => window.screen?.orientation?.lock?.("landscape"))
        .catch(() => undefined);
      return;
    }
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(INSTALL_HINT_SEEN_KEY)) return;
      localStorage.setItem(INSTALL_HINT_SEEN_KEY, "1");
    } catch {
      // Private mode: the tip is still worth showing.
    }
    setShowInstallHint(true);
  }, []);

  const exit = useCallback(() => {
    setIsFullscreen(false);
    setShowInstallHint(false);
    window.screen?.orientation?.unlock?.();
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
  }, []);

  // Escape gets out, and letting go of the browser's full screen (the system back gesture)
  // puts the session's own chrome back rather than leaving a bare board behind.
  useEffect(() => {
    if (!isFullscreen) return undefined;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    const changed = () => {
      if (!document.fullscreenElement) exit();
    };
    window.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", changed);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("fullscreenchange", changed);
    };
  }, [isFullscreen, exit]);

  // Leaving the session altogether must not leave the browser in full screen.
  useEffect(
    () => () => {
      window.screen?.orientation?.unlock?.();
      if (document.fullscreenElement) {
        void document.exitFullscreen?.().catch(() => undefined);
      }
    },
    [],
  );

  return { isFullscreen, showInstallHint, enter, exit };
}

/**
 * Controls that get out of the way like a video player's: there while paused, and for a few
 * seconds after each touch while playing. `wake` is what a touch calls.
 */
export function useLingeringControls(active: boolean, isPlaying: boolean) {
  const [touch, setTouch] = useState(0);
  const [lapsed, setLapsed] = useState(false);

  const wake = useCallback(() => {
    setLapsed(false);
    setTouch((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!active || !isPlaying) return undefined;
    const id = window.setTimeout(() => setLapsed(true), CONTROLS_LINGER_MS);
    return () => window.clearTimeout(id);
  }, [active, isPlaying, touch]);

  return { visible: !isPlaying || !lapsed, wake };
}
