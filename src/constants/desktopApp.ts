// Desktop shells older than this are refused entirely (see
// components/DesktopUpdateRequired) — independent of whether this specific
// install's own electron-updater has ever successfully checked in. Bump this
// only when an older shell is genuinely broken (e.g. missing a bridge method
// the current web bundle relies on), not on every release.
export const MIN_DESKTOP_APP_VERSION = "0.1.4";

// Public repo the desktop installers and electron-updater feeds are published
// to (electron-builder.yml `publish`, electron/updater.js RELEASES_REPO).
export const DESKTOP_RELEASES_REPO = "Michaljapko/riff-quest-releases";

export const DESKTOP_APP_RELEASES_URL = `https://github.com/${DESKTOP_RELEASES_REPO}/releases/latest`;
