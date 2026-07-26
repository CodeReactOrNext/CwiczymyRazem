// Diagnostic (not pass/fail): measures the ONE thing getStreamLatency() can't see —
// how long a block sits in audify's internal `_outputData` queue between us calling
// write() and the native ASIO callback thread actually consuming/playing it (see
// node_modules/audify/src/rt_audio.cpp: input arrives via a NonBlockingCall
// ThreadSafeFunction, output is popped from a separate queue on the *next* hardware
// callback — that hand-off isn't reflected in RtAudio's own latency reporting).
// Bypasses nativeAudioEngine on purpose: talks to audify's RtAudio directly with a
// trivial passthrough "DSP" (silence out, real timing only) so the number reflects
// audify's own architecture, not our AmpChain processing time.
//
// Run: node_modules\.bin\electron.cmd electron\test-output-queue-latency.js [deviceNameFilter] [frameSize] [seconds]
const { app } = require("electron");
const { RtAudio, RtAudioFormat } = require("audify");

const NAME_FILTER = process.argv[2] || "Audient";
const FRAME_SIZE = parseInt(process.argv[3], 10) || 64;
const DURATION_S = parseFloat(process.argv[4]) || 8;

app.whenReady().then(() => {
  const rt = new RtAudio();
  const devices = rt.getDevices();
  devices.forEach((d) => console.log("  device id=" + d.id + " in=" + d.inputChannels + " out=" + d.outputChannels + " name=" + JSON.stringify(d.name)));
  const dev = devices.find((d) => d.inputChannels > 0 && d.name.toLowerCase().includes(NAME_FILTER.toLowerCase()));
  if (!dev) { console.log("NO_DEVICE matching " + NAME_FILTER); return app.quit(); }

  const sampleRate = dev.preferredSampleRate || 48000;
  const outChannels = Math.min(2, dev.outputChannels || 2) || 1;
  console.log("Using " + JSON.stringify(dev.name) + " sr=" + sampleRate + " requestedFrame=" + FRAME_SIZE + " outCh=" + outChannels);

  const pendingWriteTimes = []; // FIFO: one hrtime per write(), shifted off as frameOutputCallback confirms consumption
  const queueDelaysMs = [];
  const inputToWriteDelaysMs = [];
  let inputBlocks = 0;
  let consumedBlocks = 0;

  const onInput = (inputBuffer) => {
    const tRecv = process.hrtime.bigint();
    inputBlocks++;
    const n = Math.floor(inputBuffer.byteLength / 4); // float32 mono in
    const out = Buffer.alloc(n * outChannels * 4); // silence — timing only, no real DSP
    const tWrite = process.hrtime.bigint();
    inputToWriteDelaysMs.push(Number(tWrite - tRecv) / 1e6);
    pendingWriteTimes.push(tWrite);
    try { rt.write(out); } catch { /* stream closing */ }
  };

  const onFrameOutput = () => {
    const tConsumed = process.hrtime.bigint();
    const tWrite = pendingWriteTimes.shift();
    if (tWrite !== undefined) {
      consumedBlocks++;
      queueDelaysMs.push(Number(tConsumed - tWrite) / 1e6);
    }
  };

  let actualFrame;
  try {
    actualFrame = rt.openStream(
      { deviceId: dev.id, nChannels: outChannels, firstChannel: 0 },
      { deviceId: dev.id, nChannels: 1, firstChannel: 0 },
      RtAudioFormat.RTAUDIO_FLOAT32,
      sampleRate,
      FRAME_SIZE,
      "latency-probe",
      onInput,
      onFrameOutput
    );
    rt.start();
  } catch (e) {
    console.log("OPEN_FAIL " + (e && e.message));
    return app.quit();
  }

  const nominalMs = (actualFrame / sampleRate) * 1000;
  console.log("actualFrame=" + actualFrame + " nominalBlockMs=" + nominalMs.toFixed(3) + " streamLatencyFrames=" + (rt.getStreamLatency ? rt.getStreamLatency() : "n/a"));
  console.log("Sampling for " + DURATION_S + "s (play/strum something so blocks keep flowing)...");

  setTimeout(() => {
    try { rt.stop(); rt.closeStream(); } catch { /* ignore */ }

    function stats(arr, label) {
      if (arr.length < 10) { console.log(label + ": TOO_FEW_SAMPLES n=" + arr.length); return; }
      const n = arr.length;
      const mean = arr.reduce((a, b) => a + b, 0) / n;
      const max = Math.max(...arr);
      const min = Math.min(...arr);
      const sorted = [...arr].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(n * 0.5)];
      const p99 = sorted[Math.floor(n * 0.99)];
      console.log(label + " (n=" + n + "): mean=" + mean.toFixed(3) + "ms  min=" + min.toFixed(3) + "ms  p50=" + p50.toFixed(3) + "ms  p99=" + p99.toFixed(3) + "ms  max=" + max.toFixed(3) + "ms");
    }

    console.log("--- RESULTS --- inputBlocks=" + inputBlocks + " consumedBlocks=" + consumedBlocks);
    stats(inputToWriteDelaysMs, "input->write (JS handling)");
    stats(queueDelaysMs, "write->consumed (audify output-queue hand-off)");
    console.log(
      "Interpretation: getStreamLatency() only reports the ASIO driver's own hardware " +
      "latency. 'write->consumed' above is the EXTRA round-trip cost of audify's " +
      "async input/output hand-off that getStreamLatency() can't see — add its mean " +
      "to (streamLatencyFrames + actualFrame*2)/sampleRate*1000 for the true round trip."
    );
    app.quit();
  }, DURATION_S * 1000);
});
