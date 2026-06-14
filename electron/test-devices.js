// Headless check: does audify load under Electron's runtime and see devices?
const { app } = require("electron");
const audioBridge = require("./audioBridge");

app.whenReady().then(() => {
  try {
    const result = audioBridge.listDevices();
    console.log("ELECTRON_AUDIO_OK api=" + result.api + " devices=" + result.devices.length);
    result.devices.forEach((d) =>
      console.log(`  #${d.id} ${d.name} | in:${d.inputChannels} out:${d.outputChannels}${d.isDefaultInput ? " [DEFAULT IN]" : ""}`)
    );
  } catch (e) {
    console.error("ELECTRON_AUDIO_FAIL", e && e.message);
  }
  app.quit();
});
