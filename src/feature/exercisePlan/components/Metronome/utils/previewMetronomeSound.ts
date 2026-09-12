import { readPersistedOutputDeviceId } from "hooks/useNativeOutputDevice";
import { applySinkId } from "utils/applyAudioSinkId";

import { type MetronomeSoundKey, scheduleClick } from "./clickTones";

// One lazily-created context for the settings picker. Only ever built on a
// click, so browser autoplay policies are satisfied, and kept around so
// repeated previews do not pile up contexts.
let previewContext: AudioContext | null = null;

function getPreviewContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (previewContext && previewContext.state !== "closed")
    return previewContext;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  previewContext = new Ctor();
  applySinkId(previewContext, readPersistedOutputDeviceId());
  return previewContext;
}

/** Gap between the two preview clicks — a quick "one, two" at 120 BPM. */
const PREVIEW_GAP_SEC = 0.5;

/**
 * Plays an accent followed by a plain beat of the given sound, so the picker
 * lets you hear both the downbeat and the ordinary click before committing.
 * Volume is the metronome's default (0.5) — the in-session slider is separate.
 */
export function previewMetronomeSound(
  sound: MetronomeSoundKey,
  volume = 0.5,
): void {
  const context = getPreviewContext();
  if (!context) return;
  const play = () => {
    const now = context.currentTime + 0.02;
    scheduleClick(context, context.destination, now, "accent", volume, sound);
    scheduleClick(
      context,
      context.destination,
      now + PREVIEW_GAP_SEC,
      "beat",
      volume,
      sound,
    );
  };
  if (context.state === "suspended") {
    context
      .resume()
      .then(play)
      .catch(() => {
        /* the browser refused to start audio outside a gesture — nothing to preview */
      });
    return;
  }
  play();
}
