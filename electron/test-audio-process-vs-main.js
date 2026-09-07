// Diagnostic (not pass/fail): the measurement behind moving the audio engine out of
// the Electron main process. Runs the SAME nativeAudioEngine + AmpChain (with a real
// NAM model from the user's Tone Studio library when one is imported) twice on the
// same device and buffer size, under the same synthetic main-process load:
//
//   A) in-process — nativeAudioEngine required straight into the main process, the
//      way the app ran before audioEngineHost.js existed;
//   B) in the dedicated audio process, through audioEngineHost.js (how it runs now);
//
// and prints each run's engine diagnostics side by side. The load generator stands
// in for what the real app's main process does while the amp is on: a renderer
// hammering ipcMain.handle() (knob drags, status polls), main relaying capture
// blocks to the renderer with webContents.send(), IPC handlers doing synchronous fs
// work (tone:list-presets, backing:list-tracks), and the occasional multi-ms stall
// (a heavier handler, a main-isolate GC).
//
// Run: node_modules\.bin\electron.cmd electron\test-audio-process-vs-main.js [deviceNameFilter] [frameSize] [seconds] [nam|classic] [load|quiet] [ab|a|b]
// (RQ_AUDIO_PRIORITY=normal|above|high picks the audio process's OS priority for B.)
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const NAME_FILTER = process.argv[2] || "Audient";
const FRAME = parseInt(process.argv[3], 10) || 128;
const SECONDS = parseFloat(process.argv[4]) || 10;
const MODEL_MODE = process.argv[5] || "nam";
const LOAD = (process.argv[6] || "load") !== "quiet";
// "ab" (default) runs both; "a" / "b" runs just one side (e.g. to compare
// RQ_AUDIO_PRIORITY settings for the audio process without re-measuring A).
const MODES = process.argv[7] || "ab";

// Same userData dir as the real desktop app, so the user's imported NAM models resolve.
app.setName("riff.quest");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickNamModel(userDataDir) {
  const dir = path.join(userDataDir, "tone-nam");
  try {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        if (meta && meta.id && fs.existsSync(path.join(dir, `${meta.id}.nam`))) return meta;
      } catch { /* skip */ }
    }
  } catch { /* no library */ }
  return null;
}

function startLoadGenerator(userDataDir) {
  // 1. renderer → main: ~250 invokes/s with a ~40KB payload; main answers with a
  //    deep clone (a JSON round trip is about what a real handler costs).
  ipcMain.handle("bench:ping", (_e, p) => JSON.parse(JSON.stringify(p)));
  const win = new BrowserWindow({
    width: 640, height: 400, show: true, title: "audio load generator",
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  const html = `<!doctype html><body style="font:14px monospace;color:#ddd"><script>
    const { ipcRenderer } = require("electron");
    const payload = { rows: Array.from({ length: 400 }, (_, i) => ({ i, name: "preset " + i, params: { a: 0.1, b: 0.2, c: [1, 2, 3, 4, 5] } })) };
    setInterval(() => { ipcRenderer.invoke("bench:ping", payload).catch(() => {}); }, 4);
    ipcRenderer.on("bench:tick", () => {});
    let t = 0;
    function frame() { t++; document.body.style.background = "hsl(" + (t % 360) + ",50%,20%)"; document.body.textContent = "main-process load generator · frame " + t; requestAnimationFrame(frame); }
    frame();
  </script></body>`;
  win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

  // 2. main → renderer at capture-relay rate (a 1KB block every 3ms, like native-audio:frame).
  const block = Buffer.alloc(1024);
  const sendTimer = setInterval(() => {
    if (!win.isDestroyed()) win.webContents.send("bench:tick", block, Date.now());
  }, 3);
  // 3. synchronous fs work every 250ms (what the tone/backing list handlers do).
  const fsTimer = setInterval(() => {
    try {
      for (const f of fs.readdirSync(userDataDir)) {
        try { fs.statSync(path.join(userDataDir, f)); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }, 250);
  // 4. once a second, a 6ms synchronous stall (a heavier handler or a main-isolate GC).
  const stallTimer = setInterval(() => {
    const t = Date.now();
    while (Date.now() - t < 6) { /* spin */ }
  }, 1000);

  return () => {
    clearInterval(sendTimer);
    clearInterval(fsTimer);
    clearInterval(stallTimer);
    ipcMain.removeHandler("bench:ping");
    if (!win.isDestroyed()) win.destroy();
  };
}

async function runInProcess(dev, params, userDataDir) {
  require("./toneStore").setUserDataDir(userDataDir);
  const engine = require("./nativeAudioEngine");
  const info = await engine.attachAmp({ deviceId: dev.id, channel: 0, frameSize: FRAME, params });
  await wait(SECONDS * 1000);
  const diag = engine.getDiagnostics();
  await engine.detachAmp();
  return { info, diag };
}

async function runInAudioProcess(dev, params) {
  const host = require("./audioEngineHost");
  await host.warmUp();
  const info = await host.attachAmp({ deviceId: dev.id, channel: 0, frameSize: FRAME, params });
  await wait(SECONDS * 1000);
  const diag = await host.getDiagnostics();
  await host.detachAmp();
  await host.shutdown();
  return { info, diag };
}

function row(label, a, b) {
  console.log(`  ${label.padEnd(34)} ${String(a).padStart(14)} ${String(b).padStart(14)}`);
}

app.whenReady().then(async () => {
  const userDataDir = app.getPath("userData");
  const engine = require("./nativeAudioEngine");
  const { api, devices } = engine.listDevices();
  devices.forEach((d) => console.log("  device id=" + d.id + " in=" + d.inputChannels + " out=" + d.outputChannels + " name=" + JSON.stringify(d.name)));
  const dev = devices.find((d) => d.inputChannels > 0 && d.outputChannels > 0 && d.name.toLowerCase().includes(NAME_FILTER.toLowerCase()));
  if (!dev) { console.log("NO_DEVICE matching " + NAME_FILTER + " with both inputs and outputs"); return app.quit(); }

  const model = MODEL_MODE === "nam" ? pickNamModel(userDataDir) : null;
  if (MODEL_MODE === "nam" && !model) console.log("(no imported NAM model found under " + userDataDir + " — running the classic chain)");
  const params = {
    drive: 0.5, preampGain: 0.3, bass: 0.5, mid: 0.5, treble: 0.5, level: 0.6, cab: true, gate: true,
    namEnabled: !!model, namModelId: model ? model.id : null,
  };
  console.log(`api=${api} device=${JSON.stringify(dev.name)} frame=${FRAME} seconds=${SECONDS} chain=${model ? "NAM (" + model.name + ")" : "classic"} load=${LOAD ? "on" : "off"}`);

  const stopLoad = LOAD ? startLoadGenerator(userDataDir) : () => {};
  await wait(1500); // let the load generator settle before measuring

  const skipped = { info: null, diag: null };
  let a = skipped; let b = skipped;
  try {
    if (MODES.includes("a")) {
      console.log("A) engine in the main process ...");
      a = await runInProcess(dev, params, userDataDir);
      await wait(700); // let the driver fully release before the other process opens it
    }
    if (MODES.includes("b")) {
      console.log(`B) engine in the dedicated audio process (priority ${process.env.RQ_AUDIO_PRIORITY || "above"}) ...`);
      b = await runInAudioProcess(dev, params);
    }
  } catch (e) {
    console.log("RUN_FAIL " + (e && e.message));
    stopLoad();
    return app.quit();
  }
  stopLoad();

  const ref = a.info ? a : b;
  const blockMs = (ref.info.frameSize / ref.info.sampleRate) * 1000;
  const v = (side, fn) => (side.diag ? fn(side.diag) : "-");
  console.log(`\n--- RESULTS (actualFrame=${ref.info.frameSize}, blockMs=${blockMs.toFixed(2)}, estimated round trip ${ref.info.roundTripMs.toFixed(1)}ms) ---`);
  row("", "A) main process", "B) audio proc");
  row("blocks", v(a, (d) => d.blocks), v(b, (d) => d.blocks));
  row("underruns (audible gaps)", v(a, (d) => d.underruns), v(b, (d) => d.underruns));
  row("blocks dropped to shed latency", v(a, (d) => d.drops), v(b, (d) => d.drops));
  row("stall / hard / soft events", v(a, (d) => `${d.stallEvents}/${d.hardEvents}/${d.softEvents}`), v(b, (d) => `${d.stallEvents}/${d.hardEvents}/${d.softEvents}`));
  row("worst backlog (blocks)", v(a, (d) => d.maxExcess), v(b, (d) => d.maxExcess));
  row("safety margin added (blocks)", v(a, (d) => d.safetyBlocks), v(b, (d) => d.safetyBlocks));
  row("late deliveries (>1.5x block)", v(a, (d) => d.lateBlocks), v(b, (d) => d.lateBlocks));
  row("max gap between blocks (ms)", v(a, (d) => d.maxGapMs.toFixed(2)), v(b, (d) => d.maxGapMs.toFixed(2)));
  row("DSP over budget (blocks)", v(a, (d) => d.overruns), v(b, (d) => d.overruns));
  row("DSP avg / max (ms)", v(a, (d) => `${d.dspAvgMs.toFixed(3)}/${d.dspMaxMs.toFixed(2)}`), v(b, (d) => `${d.dspAvgMs.toFixed(3)}/${d.dspMaxMs.toFixed(2)}`));
  row("DSP load (% of block)", v(a, (d) => ((d.dspAvgMs / blockMs) * 100).toFixed(1)), v(b, (d) => ((d.dspAvgMs / blockMs) * 100).toFixed(1)));
  app.quit();
});
