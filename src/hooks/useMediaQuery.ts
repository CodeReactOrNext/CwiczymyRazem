import { useCallback, useSyncExternalStore } from "react";

/**
 * A media query as React state.
 *
 * The match is read during render rather than in an effect, so a component
 * that picks a layout from it renders the right one on its first client pass
 * instead of painting the desktop version and swapping a frame later. On the
 * server, where there is no viewport to measure, it reports `false`.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

/**
 * Below the app's `lg` breakpoint — the same line the sidebar collapses and the
 * bottom navigation appears on. Views that need a pointer, a hover or a lot of
 * width switch to their touch layout here.
 */
export const useIsCompactViewport = (): boolean =>
  useMediaQuery("(max-width: 1023px)");
