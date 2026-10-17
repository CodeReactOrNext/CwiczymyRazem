import type { ElectronUpdaterState } from "types/electronApp";
import { isVersionBelow } from "utils/version";

/**
 * - restart: an update is downloaded and this shell can install it;
 * - download: this shell is behind and can't (or apparently didn't) update
 *   itself — offer the installer by hand;
 * - none: nothing to say (up to date, or the shell's updater is on it).
 */
export type DesktopUpdatePrompt = "none" | "restart" | "download";

/** How long a pre-0.2.0 Windows/Linux shell gets to download an update on its
 *  own before the web side assumes its updater is stuck and offers the
 *  installer. A 100 MB download normally finishes well inside this. */
export const LEGACY_UPDATER_GRACE_MS = 15 * 60 * 1000;

interface DecideInput {
  installedVersion: string;
  /** Latest published version for this platform (null while unknown). */
  latestVersion: string | null;
  platform: string | undefined;
  /** Full updater state — only shells from 0.2.0 on report it. */
  updaterState: ElectronUpdaterState | null;
  /** True once a pre-0.2.0 shell said it has an update downloaded. */
  legacyUpdateReady: boolean;
  /** Time since the app window opened, for the pre-0.2.0 grace period. */
  elapsedMs: number;
}

export const decideDesktopUpdatePrompt = ({
  installedVersion,
  latestVersion,
  platform,
  updaterState,
  legacyUpdateReady,
  elapsedMs,
}: DecideInput): DesktopUpdatePrompt => {
  const isBehind = latestVersion !== null && isVersionBelow(installedVersion, latestVersion);

  if (updaterState) {
    if (updaterState.status === "ready") return "restart";
    if (!isBehind) return "none";
    return updaterState.status === "error" || !updaterState.canAutoInstall ? "download" : "none";
  }

  // Shells before 0.2.0. Their macOS updater can never install (Squirrel.Mac
  // rejects every ad-hoc signed build), so "Restart now" there is a dead button.
  if (platform === "darwin") return isBehind || legacyUpdateReady ? "download" : "none";
  if (legacyUpdateReady) return "restart";
  return isBehind && elapsedMs >= LEGACY_UPDATER_GRACE_MS ? "download" : "none";
};
