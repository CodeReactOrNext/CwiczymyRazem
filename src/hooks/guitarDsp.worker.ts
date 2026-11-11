/// <reference lib="webworker" />
// The guitar DSP's worker: aubio and the shared processor, fed the windows the
// input worklet captured. Everything it does is in guitarDspSession.ts.
// @ts-ignore — aubiojs has no types
import aubioModule from "aubiojs";

import type { DspRequest, DspResponse } from "./guitarDspSession";
import { createDspSession } from "./guitarDspSession";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (message: DspResponse, transfer: Transferable[] = []) => scope.postMessage(message, transfer);

let session: ReturnType<typeof createDspSession> | null = null;

scope.onmessage = (event: MessageEvent<DspRequest>) => {
  const message = event.data;
  if (message.type === "samples") {
    // Windows that arrive before the detectors are built are dropped, as the
    // main-thread path drops them.
    if (session) {
      const readings = session.push(message.samples, message.timeMs);
      // The spectrum is a fresh array every window: it goes over, not a copy of it.
      post(readings, readings.spectrum ? [readings.spectrum.magnitudes.buffer] : []);
    }
    return;
  }
  if (message.type === "config") {
    session?.configure(message);
    return;
  }
  const { sampleRate, gain, bass, strum, spectrum } = message;
  const loadAubio = (aubioModule as { default?: unknown }).default ?? aubioModule;
  (loadAubio as () => Promise<unknown>)()
    .then((aubio) => {
      session = createDspSession(aubio, sampleRate, { gain, bass, strum, spectrum });
      post({ type: "ready" });
    })
    .catch((error: unknown) => {
      post({ type: "failed", message: error instanceof Error ? error.message : String(error) });
    });
};
