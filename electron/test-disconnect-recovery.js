// Headless regression check for the connection-loss recovery added to
// nativeAudioEngine.js: when ASIO closes the stream out from under us (a physical
// disconnect, or a driver control-panel buffer/rate change — see RtAudio.cpp's
// asioMessages/sampleRateChanged), the engine's health poll should notice within a
// couple of seconds and reopen on its own, without the attached consumer ever
// calling attachCapture again.
//
// Doesn't require physically unplugging anything: `shared.closeStream()` closes the
// real stream exactly like RtAudio's own internal ASIO-reset thread does (see
// rtaudio.js) — from here the engine has no way to tell the difference, which is
// the point (see nativeAudioEngine.js's health poll comment).
//
// Like test-concurrent.js, this never touches Electron's app/window APIs, so it
// runs as plain Node under the electron binary (`electron.cmd test-disconnect-recovery.js`).
const engine = require("./nativeAudioEngine");
const shared = require("./rtaudio");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { devices } = engine.listDevices();
  const dev = devices.find((d) => d.inputChannels > 0);
  if (!dev) { console.log("NO_INPUT_DEVICE"); return; }
  console.log("USING device=" + JSON.stringify(dev.name) + " id=" + dev.id);

  const events = [];
  engine.onConnectionIssue((info) => {
    events.push(info);
    console.log("CONNECTION_ISSUE " + JSON.stringify(info));
  });

  let frames = 0;
  await engine.attachCapture({ deviceId: dev.id, channel: 0, frameSize: 256 }, () => { frames++; });
  await wait(500);
  console.log(frames > 0 ? "CAPTURE_ALONE_OK frames=" + frames : "CAPTURE_ALONE_FAIL frames=" + frames);

  console.log("SIMULATING_LOSS (closing the real stream directly, consumer stays attached)");
  shared.closeStream();
  console.log("isStreamOpen right after simulated loss: " + shared.isStreamOpen());

  // Health poll runs every 2s; give it a few ticks plus the first recovery delay
  // (300ms) to notice and reopen.
  let recovered = false;
  for (let i = 0; i < 8; i++) {
    await wait(1000);
    if (shared.isStreamOpen()) { recovered = true; break; }
  }
  console.log(recovered ? "STREAM_REOPENED_OK" : "STREAM_REOPENED_FAIL (gave up waiting after 8s)");

  frames = 0;
  await wait(500);
  console.log(frames > 0 ? "FRAMES_RESUMED_OK frames=" + frames : "FRAMES_RESUMED_FAIL frames=" + frames);

  const sawLost = events.some((e) => e.status === "lost");
  const sawRecovered = events.some((e) => e.status === "recovered");
  console.log(sawLost && sawRecovered ? "EVENTS_OK" : "EVENTS_FAIL saw=" + JSON.stringify(events.map((e) => e.status)));

  const allOk = recovered && frames > 0 && sawLost && sawRecovered;
  console.log(allOk ? "ALL_OK" : "SOME_FAILED");
}

main()
  .catch((e) => console.log("TEST_ERROR " + (e && e.message)))
  .finally(() => {
    engine.detachCapture();
    process.exit(0);
  });
