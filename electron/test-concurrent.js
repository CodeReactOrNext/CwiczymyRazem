// Headless regression check for the capture+amp stream-sharing bug: turning on the
// amp used to permanently kill note-detection capture (both features independently
// closed the single shared ASIO stream on start()). Confirms capture and amp now run
// simultaneously on the unified engine (see ./nativeAudioEngine).
//
// Unlike its siblings (test-devices.js/test-capture.js/test-amp.js), this script does
// NOT wait on `require("electron").app.whenReady()` — nativeAudioEngine only touches
// audify/RtAudio, never Electron's app/window APIs, so it runs as plain Node under
// the electron binary (`electron.cmd test-concurrent.js`) with no window needed.
const engine = require("./nativeAudioEngine");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { devices } = engine.listDevices();
  const dev =
    devices.find((d) => d.inputChannels > 0 && d.outputChannels > 0) ||
    devices.find((d) => d.inputChannels > 0);
  if (!dev) { console.log("NO_INPUT_DEVICE"); return; }
  console.log("USING device=" + JSON.stringify(dev.name) + " id=" + dev.id);

  let frames = 0;
  const onFrame = () => { frames++; };

  // 1. Capture alone.
  engine.attachCapture({ deviceId: dev.id, channel: 0, frameSize: 256 }, onFrame);
  await wait(500);
  console.log(frames > 0 ? "CAPTURE_ALONE_OK frames=" + frames : "CAPTURE_ALONE_FAIL frames=" + frames);

  // 2. Amp alone (capture detached first).
  engine.detachCapture();
  engine.attachAmp({ deviceId: dev.id, channel: 0, frameSize: 256, params: { drive: 0.7, tone: 0.5, level: 0.6, cab: true } });
  await wait(500);
  console.log(engine.getAmpStatus().isOpen ? "AMP_ALONE_OK" : "AMP_ALONE_FAIL");

  // 3. THE REGRESSION CHECK: attach capture again while amp is still attached.
  // Before this fix, this combination was impossible — attaching either one always
  // killed the other's stream.
  frames = 0;
  engine.attachCapture({ deviceId: dev.id, channel: 0, frameSize: 256 }, onFrame);
  await wait(500);
  const bothStatus = { capture: engine.getCaptureStatus().isOpen, amp: engine.getAmpStatus().isOpen };
  const bothOk = frames > 0 && bothStatus.capture && bothStatus.amp;
  console.log("CONCURRENT_STATUS " + JSON.stringify(bothStatus) + " frames=" + frames);
  console.log(bothOk ? "CONCURRENT_OK" : "CONCURRENT_FAIL");

  // 4. Detach amp — capture must keep flowing uninterrupted.
  frames = 0;
  engine.detachAmp();
  await wait(500);
  console.log(!engine.getAmpStatus().isOpen && frames > 0 ? "AMP_DETACH_OK frames=" + frames : "AMP_DETACH_FAIL frames=" + frames);

  console.log(bothOk ? "ALL_OK" : "SOME_FAILED");
}

main()
  .catch((e) => console.log("TEST_ERROR " + (e && e.message)))
  .finally(() => {
    engine.detachCapture();
    engine.detachAmp();
    process.exit(0);
  });
