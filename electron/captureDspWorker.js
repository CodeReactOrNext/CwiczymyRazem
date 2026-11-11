// The thread the capture's note detection runs in (see captureDspHost.js):
// aubio and the shared guitar processor, bundled from the web app's own source
// into ./generated/guitarDspEngine.js.
const { parentPort } = require("worker_threads");

const { createEngineDsp } = require("./generated/guitarDspEngine");

let engine = null;

parentPort.on("message", (message) => {
  if (message.type === "block") {
    // Blocks that arrive before the detectors are built are dropped.
    if (!engine) return;
    for (const readings of engine.push(message.bytes, message.at)) {
      const transfer = [readings.samples.buffer];
      if (readings.spectrum) transfer.push(readings.spectrum.magnitudes.buffer);
      parentPort.postMessage(readings, transfer);
    }
    return;
  }
  if (message.type === "config") {
    if (engine) engine.configure(message.patch);
    return;
  }
  if (message.type !== "init") return;
  createEngineDsp(message.init)
    .then((created) => {
      engine = created;
      parentPort.postMessage({ type: "ready" });
    })
    .catch((error) => {
      parentPort.postMessage({ type: "failed", message: error && error.message ? error.message : String(error) });
    });
});
