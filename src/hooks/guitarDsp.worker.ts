/// <reference lib="webworker" />
// The guitar DSP's worker: aubio and the shared processor, fed the windows the
// input worklet captured. Everything it does is in guitarDspSession.ts.
// @ts-ignore — aubiojs has no types
import aubioModule from "aubiojs";

import type { DspRequest, DspResponse } from "./guitarDspSession";
import { createDspSession } from "./guitarDspSession";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (message: DspResponse) => scope.postMessage(message);

let session: ReturnType<typeof createDspSession> | null = null;

scope.onmessage = (event: MessageEvent<DspRequest>) => {
  const message = event.data;
  if (message.type === "samples") {
    // Windows that arrive before the detectors are built are dropped, as the
    // main-thread path drops them.
    if (session) post(session.push(message.samples, message.timeMs));
    return;
  }
  if (message.type === "config") {
    session?.configure(message);
    return;
  }
  const { sampleRate, gain, bass, strum } = message;
  const loadAubio = (aubioModule as { default?: unknown }).default ?? aubioModule;
  (loadAubio as () => Promise<unknown>)()
    .then((aubio) => {
      session = createDspSession(aubio, sampleRate, { gain, bass, strum });
      post({ type: "ready" });
    })
    .catch((error: unknown) => {
      post({ type: "failed", message: error instanceof Error ? error.message : String(error) });
    });
};
