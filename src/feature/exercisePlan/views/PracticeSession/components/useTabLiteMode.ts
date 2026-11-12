import { useSyncExternalStore } from "react";

import { isWeakDevice, resolveTabLite, useTablatureSettings } from "./tablatureSettings";

// Kept out of tablatureSettings.ts: that module is also read on the server (the
// MCP tab preview), where a module that so much as imports useSyncExternalStore
// fails the build.

const noopSubscribe = () => () => undefined;
const readWeakDevice = () => typeof navigator !== "undefined" && isWeakDevice(navigator as { deviceMemory?: number });

/**
 * Whether this board should run lite. `isPhone` is true for the phone session's
 * board only: `auto` never touches a desktop board, where nothing changes how
 * the tab looks unless the player asks for it.
 */
export function useTabLiteMode(isPhone: boolean): boolean {
  const mode = useTablatureSettings((s) => s.performanceMode);
  const slowBoardSeen = useTablatureSettings((s) => s.slowBoardSeen);
  // The server has no device to ask; the client's answer never changes.
  const weakDevice = useSyncExternalStore(noopSubscribe, readWeakDevice, () => false);
  return resolveTabLite(mode, isPhone, slowBoardSeen, weakDevice);
}
