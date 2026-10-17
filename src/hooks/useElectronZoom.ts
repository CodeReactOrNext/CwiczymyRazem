import { useEffect, useState } from "react";

/**
 * Page zoom of the desktop window (electron/zoom.js): the current factor and
 * the steps in and out. `canZoom` is false on the web and on desktop builds
 * older than the zoom bridge, where the title bar leaves the controls out.
 */
export const useElectronZoom = () => {
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    const api = window.electronWindow;
    if (!api?.getZoom || !api.onZoomChange) return undefined;

    let cancelled = false;
    api.getZoom().then((factor) => {
      if (!cancelled) setZoom(factor);
    });
    const unsubscribe = api.onZoomChange(setZoom);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const api = typeof window !== "undefined" ? window.electronWindow : undefined;

  return {
    canZoom: zoom !== null,
    zoom: zoom ?? 1,
    zoomIn: () => api?.zoomIn?.().then(setZoom),
    zoomOut: () => api?.zoomOut?.().then(setZoom),
    resetZoom: () => api?.resetZoom?.().then(setZoom),
  };
};
