/**
 * The one take that can be running, and the only thing that starts or ends it.
 *
 * Kept outside React: a take belongs to the session on screen rather than to
 * whichever button happens to be mounted, and ending it has to work from an
 * unmount as well as from a click.
 */
import { useTakeStore } from "../store/takeStore";
import type { RunningTake } from "./audioTake";
import { startAudioTake } from "./audioTake";
import { NoBoardError, startVideoTake } from "./videoTake";

let running: RunningTake | null = null;
/** A stop that arrived while the take was still starting: `true` keeps it, "discard" does not. */
let stopWhenStarted: boolean | "discard" = false;

export function isTakeRecordingAvailable(): boolean {
  return typeof window !== "undefined" && !!window.takes?.isAvailable;
}

/** Ends the running take and saves it — or throws it away. */
export async function stopTake(discard = false): Promise<void> {
  const take = running;
  if (!take) {
    if (useTakeStore.getState().status === "starting") stopWhenStarted = discard ? "discard" : true;
    return;
  }
  running = null;
  useTakeStore.getState().setLive({ status: "saving" });
  try {
    const saved = await take.stop(discard);
    useTakeStore.getState().setLive({
      status: "idle",
      activeMode: null,
      startedAt: null,
      lastSaved: saved,
      // Nothing came back from a take that was meant to be kept: nothing was recorded.
      failure: !saved && !discard ? "failed" : null,
    });
  } catch {
    useTakeStore.getState().setLive({ status: "idle", activeMode: null, startedAt: null, failure: "failed" });
  }
}

/** Starts a take in the mode the player has chosen. Does nothing while one is running. */
export async function startTake(title: string): Promise<void> {
  const store = useTakeStore.getState();
  if (store.status !== "idle" || !isTakeRecordingAvailable()) return;
  const { mode, split, trimMs } = store;
  stopWhenStarted = false;
  store.setLive({ status: "starting", activeMode: mode, failure: null, lastSaved: null, guitar: null });

  try {
    const take =
      mode === "video"
        ? await startVideoTake({ title, split, guitarTrimMs: trimMs })
        : await startAudioTake({ title, split, guitarTrimMs: trimMs });
    running = take;
    useTakeStore.getState().setLive({
      status: "recording",
      startedAt: Date.now(),
      guitar: !take.guitar ? "none" : take.guitar.wet ? "amp" : "direct",
    });
    if (stopWhenStarted) {
      const discard = stopWhenStarted === "discard";
      stopWhenStarted = false;
      await stopTake(discard);
    }
  } catch (error) {
    running = null;
    stopWhenStarted = false;
    useTakeStore.getState().setLive({
      status: "idle",
      activeMode: null,
      startedAt: null,
      failure: error instanceof NoBoardError ? "no_board" : "failed",
    });
  }
}
