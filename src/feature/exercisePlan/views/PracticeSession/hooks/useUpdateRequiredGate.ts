import { useEffect, useState } from "react";

// How long a downloaded-but-unapplied update is allowed to sit before a new
// session refuses to start. Generous on purpose — this only exists to bound
// the worst case (a stale desktop shell drifting from the instantly-updated
// web bundle for weeks via the tray), not to nag on every launch.
const GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * True once an Electron update has been downloaded and sitting unapplied
 * longer than GRACE_MS. Checked once per mount (i.e. once per session start)
 * via window.electronApp.getUpdateStatus — never re-checked mid-session, so
 * an update landing while the user is practicing can't interrupt them. No-op
 * (always false) on the web build, where window.electronApp is undefined.
 */
export const useUpdateRequiredGate = () => {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const api = window.electronApp;
    if (!api || typeof api.getUpdateStatus !== "function") return undefined;
    let cancelled = false;
    api.getUpdateStatus().then((status) => {
      if (!cancelled && status && Date.now() - status.readyAt > GRACE_MS) {
        setBlocked(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return blocked;
};
