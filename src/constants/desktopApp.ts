// Desktop shells older than this are refused entirely (see
// components/DesktopUpdateRequired) — independent of whether this specific
// install's own electron-updater has ever successfully checked in. Bump this
// only when an older shell is genuinely broken (e.g. missing a bridge method
// the current web bundle relies on), not on every release.
export const MIN_DESKTOP_APP_VERSION = "0.1.4";
