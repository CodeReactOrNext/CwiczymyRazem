// Diagnostic (not a pass/fail regression test): measures how evenly-spaced the
// JS-side capture callback actually fires. nativeAudioEngine's onInputBlock runs
// on whatever thread audify's native binding delivers it on and hands off to
// audioBridge's onFrame in the Electron MAIN process — the same process that
// also services all other IPC/window/timer work. If that hand-off is queued
// through Node's normal event loop (rather than serviced with hard real-time
// priority), any main-process business (GC, IPC, window events, ...) would
// show up here as occasional gaps much larger than the nominal block period —
// which would explain added/inconsistent latency independent of the ASIO
// buffer size the driver actually granted.
//
// Run: node_modules\.bin\electron.cmd electron\test-latency-jitter.js [frameSize] [seconds]
const { app } = require("electron");
const audioBridge = require("./audioBridge");

const REQUESTED_FRAME = parseInt(process.argv[2], 10) || 64;
const DURATION_S = parseFloat(process.argv[3]) || 8;
const NAME_FILTER = process.argv[4] || null;

app.whenReady().then(async () => {
  const { devices } = audioBridge.listDevices();
  devices.forEach((d) => console.log("  device id=" + d.id + " in=" + d.inputChannels + " out=" + d.outputChannels + " name=" + JSON.stringify(d.name)));
  const dev = NAME_FILTER
    ? devices.find((d) => d.inputChannels > 0 && d.name.toLowerCase().includes(NAME_FILTER.toLowerCase()))
    : devices.find((d) => d.inputChannels > 0 && d.outputChannels > 0) || devices.find((d) => d.inputChannels > 0);
  if (!dev) { console.log("NO_INPUT_DEVICE"); return app.quit(); }

  const gapsMs = [];
  let lastNs = null;

  let info;
  try {
    info = await audioBridge.start({ deviceId: dev.id, channel: 0, frameSize: REQUESTED_FRAME }, () => {
      const now = process.hrtime.bigint();
      if (lastNs !== null) gapsMs.push(Number(now - lastNs) / 1e6);
      lastNs = now;
    });
  } catch (e) {
    console.log("START_FAIL " + (e && e.message));
    return app.quit();
  }

  const nominalMs = (info.frameSize / info.sampleRate) * 1000;
  console.log(
    "DEVICE " + JSON.stringify(info.deviceName) +
    " sr=" + info.sampleRate + " actualFrame=" + info.frameSize +
    " nominalBlockMs=" + nominalMs.toFixed(3)
  );
  console.log("Sampling for " + DURATION_S + "s (play/strum something so blocks keep flowing)...");

  setTimeout(() => {
    audioBridge.stop();
    if (gapsMs.length < 10) {
      console.log("TOO_FEW_SAMPLES n=" + gapsMs.length);
      return app.quit();
    }
    const n = gapsMs.length;
    const mean = gapsMs.reduce((a, b) => a + b, 0) / n;
    const max = Math.max(...gapsMs);
    const min = Math.min(...gapsMs);
    const variance = gapsMs.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);
    const over2x = gapsMs.filter((g) => g > nominalMs * 2).length;
    const over5x = gapsMs.filter((g) => g > nominalMs * 5).length;
    const sorted = [...gapsMs].sort((a, b) => a - b);
    const p99 = sorted[Math.floor(n * 0.99)];

    console.log("--- RESULTS (n=" + n + " gaps) ---");
    console.log("nominal=" + nominalMs.toFixed(3) + "ms  mean=" + mean.toFixed(3) + "ms  min=" + min.toFixed(3) + "ms  max=" + max.toFixed(3) + "ms  stddev=" + stddev.toFixed(3) + "ms  p99=" + p99.toFixed(3) + "ms");
    console.log("gaps > 2x nominal: " + over2x + " (" + ((over2x / n) * 100).toFixed(2) + "%)");
    console.log("gaps > 5x nominal: " + over5x + " (" + ((over5x / n) * 100).toFixed(2) + "%)");
    console.log(max > nominalMs * 5 ? "JITTER_DETECTED" : "TIMING_CLEAN");
    app.quit();
  }, DURATION_S * 1000);
});
