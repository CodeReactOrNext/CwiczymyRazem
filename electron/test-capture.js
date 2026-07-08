// Headless end-to-end check: open a real input stream and confirm FLOAT32
// PCM frames flow from the driver through the bridge (silence is fine).
const { app } = require("electron");
const audioBridge = require("./audioBridge");

app.whenReady().then(() => {
  let frames = 0;
  let samples = 0;
  let peak = 0;
  try {
    const { devices } = audioBridge.listDevices();
    const dev = devices.find((d) => d.inputChannels > 0);
    if (!dev) { console.log("NO_INPUT_DEVICE"); return app.quit(); }

    const info = audioBridge.start(
      { deviceId: dev.id, channel: 0, frameSize: 256 },
      (buf) => {
        frames++;
        const f = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
        samples += f.length;
        for (let i = 0; i < f.length; i++) { const a = Math.abs(f[i]); if (a > peak) peak = a; }
      }
    );
    console.log("STREAM_OPEN device=" + JSON.stringify(info.deviceName) +
      " sr=" + info.sampleRate + " frameSize=" + info.frameSize +
      " latencyMs=" + info.latencyMs.toFixed(2));

    setTimeout(() => {
      audioBridge.stop();
      console.log("CAPTURE_RESULT frames=" + frames + " samples=" + samples + " peak=" + peak.toFixed(4));
      console.log(frames > 0 ? "CAPTURE_OK" : "CAPTURE_FAIL_NO_FRAMES");
      app.quit();
    }, 1500);
  } catch (e) {
    console.error("CAPTURE_ERROR", e && e.message);
    app.quit();
  }
});
