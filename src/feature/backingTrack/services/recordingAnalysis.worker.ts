/// <reference lib="webworker" />

import type { EngineRequest } from "./analysisEngine";
import { handleRequest } from "./analysisEngine";

/**
 * Off the main thread: decoded audio, its outline, tens of thousands of FFTs
 * and the sync search. The session behind the editor is still keeping a
 * metronome and a tab in time, and every one of those would stall it.
 */
self.onmessage = (event: MessageEvent<EngineRequest & { id: number }>) => {
  const { id, ...request } = event.data;
  try {
    const { result, transfer } = handleRequest(request as EngineRequest);
    (self as unknown as Worker).postMessage({ id, ok: true, result }, transfer);
  } catch (error) {
    (self as unknown as Worker).postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
