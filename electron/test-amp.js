// Headless duplex test: open the amp-sim stream and confirm the input→DSP→output
// loop runs without crashing. Silence in = silence out, but the callback must fire.
const { app } = require("electron");
const audioBridge = require("./audioBridge");
const ampSim = require("./ampSim");

app.whenReady().then(async () => {
  const { devices } = await audioBridge.listDevices();
  // Prefer a real interface that has both inputs and outputs.
  const candidates = devices.filter((d) => d.inputChannels > 0 && d.outputChannels > 0);
  if (candidates.length === 0) { console.log("NO_DUPLEX_DEVICE"); return app.quit(); }

  let lastErr = null;
  let started = null;
  for (const dev of candidates) {
    try {
      started = await ampSim.start({ deviceId: dev.id, channel: 0, frameSize: 256, params: { drive: 0.7, bass: 0.5, mid: 0.5, treble: 0.5, level: 0.6, cab: true, gate: true } });
      console.log("AMP_OPEN device=" + JSON.stringify(started.deviceName) +
        " sr=" + started.sampleRate + " frame=" + started.frameSize +
        " outCh=" + started.outChannels + " roundTripMs=" + started.roundTripMs.toFixed(2));
      break;
    } catch (e) { lastErr = (e && e.message) || String(e); await ampSim.stop(); }
  }
  if (!started) { console.log("AMP_OPEN_FAIL " + lastErr); return app.quit(); }

  setTimeout(async () => {
    // live param change must not crash
    try { await ampSim.setParams({ drive: 0.3 }); console.log("AMP_SETPARAMS_OK"); } catch (e) { console.log("AMP_SETPARAMS_FAIL " + e.message); }
  }, 500);

  setTimeout(async () => {
    const st = await ampSim.getStatus();
    const diag = await ampSim.getDiagnostics();
    await ampSim.stop();
    console.log("AMP_RESULT isOpenDuringRun=" + st.isOpen + " diagnostics=" + JSON.stringify(diag));
    console.log(st.isOpen ? "AMP_OK" : "AMP_FAIL");
    app.quit();
  }, 1500);
});
