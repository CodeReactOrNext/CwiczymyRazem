import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => window.electronApp?.appVersion ?? null;
const getServerSnapshot = () => null;

/**
 * Installed desktop app version (electron/preload.js), or null on the web
 * build / during SSR. Set once by preload and never changes for the life of
 * the process, so there's nothing to subscribe to — useSyncExternalStore just
 * needs a stable server snapshot to avoid a hydration mismatch on the real
 * client-only value.
 */
export const useDesktopAppVersion = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
