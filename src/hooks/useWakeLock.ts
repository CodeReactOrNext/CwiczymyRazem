import { useEffect } from "react";

/**
 * Keeps the screen from dimming while `active` — a player's hands are on the guitar, not on the
 * phone. Best effort: a browser without the API, or one that refuses (low battery), just dims
 * as it always did.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.wakeLock) {
      return undefined;
    }
    let sentinel: WakeLockSentinel | null = null;
    let done = false;

    const request = () => {
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          if (done) void lock.release().catch(() => undefined);
          else sentinel = lock;
        })
        .catch(() => undefined);
    };
    // The browser drops the lock whenever the page is hidden; take it back on return.
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };

    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      done = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
