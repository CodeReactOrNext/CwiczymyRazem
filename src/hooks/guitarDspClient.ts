// The main thread's handle on the guitar DSP worker (guitarDsp.worker.ts).
import type { DspRequest, DspResponse, DspSettings, DspStart, DspTargets } from "./guitarDspSession";
import { applyDspReadings } from "./guitarDspSession";

/** A worker that hasn't built its detectors by now is given up on. */
const READY_TIMEOUT_MS = 8000;

export interface GuitarDspHandle {
  /** Hands a captured window over (the buffer goes with it) with the time its last sample arrived. */
  push(samples: Float32Array, timeMs: number): void;
  configure(patch: Partial<DspSettings>): void;
  close(): void;
}

interface StartGuitarDspOptions extends DspStart {
  sampleRate: number;
  /** The refs the readings are written to, after every window. */
  targets: DspTargets;
  /** Signal is flowing — throttled by the processor to ~10 Hz. */
  onActive?: () => void;
  /** The worker died after it had started; nothing more will come from it. */
  onLost?: () => void;
}

/**
 * Starts the DSP worker and waits for its detectors. Resolves null where it
 * can't run — no Worker here, it failed to load, or it never answered — and
 * the caller then runs the processor on its own thread, as it always did.
 */
export function startGuitarDsp({ sampleRate, gain, bass, strum, spectrum, targets, onActive, onLost }: StartGuitarDspOptions): Promise<GuitarDspHandle | null> {
  if (typeof Worker === "undefined") return Promise.resolve(null);
  let worker: Worker;
  try {
    worker = new Worker(new URL("./guitarDsp.worker.ts", import.meta.url));
  } catch {
    return Promise.resolve(null);
  }
  const send = (message: DspRequest, transfer: Transferable[] = []) => worker.postMessage(message, transfer);

  return new Promise((resolve) => {
    let closed = false;
    let ready = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const close = () => {
      if (closed) return;
      closed = true;
      clearTimeout(timeout);
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };
    const fail = () => {
      const wasReady = ready;
      close();
      if (wasReady) onLost?.();
      else resolve(null);
    };
    timeout = setTimeout(fail, READY_TIMEOUT_MS);

    worker.onerror = fail;
    worker.onmessage = (event: MessageEvent<DspResponse>) => {
      const message = event.data;
      if (message.type === "readings") {
        applyDspReadings(targets, message);
        if (message.readings.active) onActive?.();
        return;
      }
      if (message.type === "failed") { fail(); return; }
      ready = true;
      clearTimeout(timeout);
      resolve({
        push: (samples, timeMs) => { if (!closed) send({ type: "samples", samples, timeMs }, [samples.buffer]); },
        configure: (patch) => { if (!closed) send({ type: "config", ...patch }); },
        close,
      });
    };
    send({ type: "init", sampleRate, gain, bass, strum, spectrum });
  });
}
