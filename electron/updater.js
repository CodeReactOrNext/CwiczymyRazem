// Desktop auto-update: electron-updater on Windows/Linux, a self-contained
// replace-the-bundle installer on macOS, and a manual-download fallback that
// every failure path ends in.
//
// Why macOS can't use electron-updater's own installer: it hands the downloaded
// zip to Squirrel.Mac, which only installs a bundle whose code signature
// satisfies the *running* app's designated requirement. This app is ad-hoc
// signed (electron-builder.yml `identity: "-"`, no Apple Developer ID), and an
// ad-hoc designated requirement is just the cdhash of that one build — so every
// new build fails it ("Code signature at URL … did not pass validation"),
// quitAndInstall() waits forever for a Squirrel download that already failed,
// and the "Restart now" button does nothing. Once the app is signed with a real
// Developer ID, MAC_SELF_INSTALL can go and Squirrel will work as-is.
//
// Everything below the pure helpers is wired to injected Electron APIs, because
// under Node/Vitest `require("electron")` is a path string (see toneStore.js).
const fs = require("fs");
const fsp = fs.promises;
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFile, spawn } = require("child_process");
const { Readable, Transform } = require("stream");
const { pipeline } = require("stream/promises");

// Must match electron-builder.yml `publish` (and constants/desktopApp.ts).
const RELEASES_REPO = "Michaljapko/riff-quest-releases";
const RELEASES_PAGE_URL = `https://github.com/${RELEASES_REPO}/releases/latest`;
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const LOG_MAX_BYTES = 1024 * 1024;

// ── Pure helpers ─────────────────────────────────────────────────────────────

/** Public download URL of a release asset (electron-builder tags as v<version>). */
function releaseAssetUrl(version, fileName) {
  return `https://github.com/${RELEASES_REPO}/releases/download/v${version}/${encodeURIComponent(fileName)}`;
}

/** First entry of an UpdateInfo.files list whose url ends with `ext`. */
function pickFile(files, ext) {
  return (files || []).find((file) => typeof file.url === "string" && file.url.endsWith(ext)) || null;
}

/** Where a user should go to install `version` by hand on `platform`. */
function manualDownloadUrl(platform, info) {
  if (!info || !info.version) return RELEASES_PAGE_URL;
  const ext = platform === "darwin" ? ".dmg" : platform === "win32" ? ".exe" : ".AppImage";
  const file = pickFile(info.files, ext);
  return file ? releaseAssetUrl(info.version, file.url) : RELEASES_PAGE_URL;
}

/** `/Applications/riff.quest.app` from `…/riff.quest.app/Contents/MacOS/riff.quest`. */
function macAppBundlePath(exePath) {
  const bundle = path.posix.resolve(exePath, "..", "..", "..");
  return bundle.endsWith(".app") ? bundle : null;
}

/**
 * Why the running bundle can't be swapped in place, or null when it can.
 * - translocated: launched straight from Downloads with the quarantine flag —
 *   macOS runs a read-only copy from a random path, the real bundle is elsewhere;
 * - read-only-volume: launched from the mounted DMG;
 * - not-writable: e.g. a standard (non-admin) account and /Applications.
 */
function selfReplaceBlocker(bundlePath, access = fs.accessSync) {
  if (!bundlePath) return "not-a-bundle";
  if (bundlePath.includes("/AppTranslocation/")) return "translocated";
  if (bundlePath.startsWith("/Volumes/")) return "read-only-volume";
  try {
    access(path.posix.dirname(bundlePath), fs.constants.W_OK);
    access(bundlePath, fs.constants.W_OK);
  } catch {
    return "not-writable";
  }
  return null;
}

/**
 * Detached shell script that swaps the bundle once this process has exited:
 *   sh swap.sh <pid> <staged.app> <installed.app> <log>
 * Never leaves the user without an app: the old bundle is moved aside first
 * and moved back if the new one can't be put in place. If the app doesn't quit
 * within 60 s (quit cancelled), it does nothing at all.
 */
function buildSwapScript() {
  return [
    "#!/bin/sh",
    'PID="$1"; NEW_APP="$2"; TARGET="$3"; LOG="$4"',
    'exec >>"$LOG" 2>&1',
    'echo "[swap] $(date) waiting for pid $PID"',
    "i=0",
    'while kill -0 "$PID" 2>/dev/null; do',
    "  i=$((i+1))",
    '  if [ "$i" -gt 600 ]; then echo "[swap] app did not quit, aborting"; exit 1; fi',
    "  sleep 0.1",
    "done",
    'BACKUP="$TARGET.update-backup"',
    'rm -rf "$BACKUP"',
    'if ! mv "$TARGET" "$BACKUP"; then echo "[swap] cannot move old app aside"; open "$TARGET"; exit 1; fi',
    'if ! mv "$NEW_APP" "$TARGET"; then',
    '  echo "[swap] cannot move new app in, restoring"',
    '  rm -rf "$TARGET"; mv "$BACKUP" "$TARGET"; open "$TARGET"; exit 1',
    "fi",
    'rm -rf "$BACKUP"',
    'xattr -dr com.apple.quarantine "$TARGET" 2>/dev/null',
    'echo "[swap] installed, relaunching"',
    'open "$TARGET"',
    "",
  ].join("\n");
}

/** sha512 of a file, base64 — the format electron-builder writes into latest*.yml. */
function sha512Base64(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha512");
    fs.createReadStream(filePath)
      .on("error", reject)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("base64")));
  });
}

/** `{ info, warn, error, debug }` appending to a file — electron-updater's logger
 *  interface. Users can send this file when an update misbehaves. */
function createFileLogger(filePath) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > LOG_MAX_BYTES) {
      fs.renameSync(filePath, filePath.replace(/\.log$/, ".old.log"));
    }
  } catch {
    // Logging must never be the reason updates break.
  }
  const write = (level) => (...args) => {
    const line = args
      .map((arg) => (arg instanceof Error ? arg.stack || arg.message : typeof arg === "string" ? arg : JSON.stringify(arg)))
      .join(" ");
    try {
      fs.appendFileSync(filePath, `${new Date().toISOString()} [${level}] ${line}\n`);
    } catch {
      // ignore
    }
    if (level === "error") console.error("[updater]", line);
  };
  return { info: write("info"), warn: write("warn"), error: write("error"), debug: write("debug") };
}

function execFileAsync(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, (err, stdout, stderr) => {
      if (err) reject(new Error(`${path.basename(file)} failed: ${stderr || err.message}`));
      else resolve(stdout);
    });
  });
}

// ── Controller ───────────────────────────────────────────────────────────────

/**
 * @param deps.electron  { app, net, shell, dialog, Notification }
 * @param deps.autoUpdater  electron-updater's autoUpdater
 * @param deps.getMainWindow  () => BrowserWindow | null
 */
function createUpdater({ electron, autoUpdater, getMainWindow, platform = process.platform }) {
  const { app, net, shell, dialog, Notification } = electron;
  const isMac = platform === "darwin";
  const logPath = path.join(app.getPath("logs"), "updater.log");
  const log = createFileLogger(logPath);

  const bundlePath = isMac ? macAppBundlePath(app.getPath("exe")) : null;
  // Replacing the bundle needs a writable, non-translocated location; anywhere
  // else the only honest option is pointing the user at the download.
  const macBlocker = isMac ? selfReplaceBlocker(bundlePath) : null;

  let state = {
    status: "idle", // idle | checking | downloading | ready | up-to-date | error
    currentVersion: app.getVersion(),
    version: null,
    percent: null,
    error: null,
    canAutoInstall: !macBlocker,
    manualDownloadUrl: RELEASES_PAGE_URL,
  };
  let pending = null; // { version, readyAt } — legacy app:get-update-status shape
  let latestInfo = null;
  let macStagedApp = null;
  let macDownloading = null; // version being downloaded

  function send(channel, payload) {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
  }

  function setState(patch) {
    state = { ...state, ...patch };
    send("app:updater-state", state);
  }

  function fail(err, context) {
    const message = (err && err.message) || String(err);
    log.error(`${context}:`, err);
    // A finished download stays installable even if a later re-check fails.
    if (state.status !== "ready") setState({ status: "error", error: message, percent: null });
  }

  function markReady(version) {
    pending = { version, readyAt: Date.now() };
    log.info(`update ${version} ready to install`);
    setState({ status: "ready", version, percent: null, error: null });
    send("app:update-ready", { version });
    notify(`Click to restart riff.quest and install version ${version}.`, () => install());
  }

  function notify(body, onClick) {
    if (!Notification.isSupported()) return;
    const notification = new Notification({ title: "riff.quest update", body });
    notification.on("click", onClick);
    notification.show();
  }

  async function offerManualDownload(detail) {
    const win = getMainWindow();
    const options = {
      type: "info",
      title: "Update riff.quest",
      message: latestInfo ? `riff.quest ${latestInfo.version} is available` : "Update riff.quest",
      detail: `${detail}\n\nDownload the new version and install it over this one — your settings and progress are kept.`,
      buttons: ["Download", "Later"],
      defaultId: 0,
      cancelId: 1,
    };
    const { response } = win && !win.isDestroyed() ? await dialog.showMessageBox(win, options) : await dialog.showMessageBox(options);
    if (response === 0) openManualDownload();
  }

  function openManualDownload() {
    shell.openExternal(state.manualDownloadUrl || RELEASES_PAGE_URL);
  }

  // ── macOS: download the zip ourselves and stage the .app ──
  async function downloadDarwin(info) {
    const { version } = info;
    if ((pending && pending.version === version) || macDownloading === version) return;
    const zip = pickFile(info.files, ".zip");
    if (!zip) throw new Error(`no .zip in latest-mac.yml for ${version}`);
    macDownloading = version;
    try {
      const dir = path.join(app.getPath("temp"), "riff-quest-update");
      await fsp.rm(dir, { recursive: true, force: true });
      await fsp.mkdir(dir, { recursive: true });
      const zipPath = path.join(dir, "update.zip");
      const url = releaseAssetUrl(version, zip.url);
      log.info(`downloading ${url}`);

      const res = await net.fetch(url);
      if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status}`);
      const total = zip.size || Number(res.headers.get("content-length")) || 0;
      let received = 0;
      let lastSent = 0;
      const progress = new Transform({
        transform(chunk, _enc, cb) {
          received += chunk.length;
          const percent = total ? Math.min(100, (received / total) * 100) : null;
          if (percent !== null && percent - lastSent >= 2) {
            lastSent = percent;
            setState({ percent });
          }
          cb(null, chunk);
        },
      });
      await pipeline(Readable.fromWeb(res.body), progress, fs.createWriteStream(zipPath));

      const actual = await sha512Base64(zipPath);
      if (zip.sha512 && actual !== zip.sha512) throw new Error("downloaded update failed its checksum");

      const extractDir = path.join(dir, "extracted");
      await execFileAsync("/usr/bin/ditto", ["-x", "-k", zipPath, extractDir]);
      const appName = (await fsp.readdir(extractDir)).find((name) => name.endsWith(".app"));
      if (!appName) throw new Error("update archive contains no .app");
      const staged = path.join(extractDir, appName);
      // Integrity only (ad-hoc signatures have no identity to check): a bundle
      // whose seal is broken would be killed by the kernel on launch.
      await execFileAsync("/usr/bin/codesign", ["--verify", "--deep", "--strict", staged]);
      await fsp.rm(zipPath, { force: true });

      macStagedApp = staged;
      markReady(version);
    } finally {
      macDownloading = null;
    }
  }

  function installDarwin() {
    if (!macStagedApp || !fs.existsSync(macStagedApp)) {
      return offerManualDownload("The downloaded update is missing.").then(() => ({ ok: false, reason: "missing" }));
    }
    const blocker = selfReplaceBlocker(bundlePath);
    if (blocker) {
      log.warn(`cannot replace ${bundlePath}: ${blocker}`);
      return offerManualDownload(
        blocker === "not-writable"
          ? "riff.quest can't update itself in its current folder."
          : "riff.quest is running from a temporary location, so it can't update itself. Move it to Applications after installing.",
      ).then(() => ({ ok: false, reason: blocker }));
    }
    const scriptPath = path.join(os.tmpdir(), `riff-quest-swap-${Date.now()}.sh`);
    fs.writeFileSync(scriptPath, buildSwapScript(), { mode: 0o755 });
    log.info(`swapping ${bundlePath} with ${macStagedApp}`);
    const child = spawn("/bin/sh", [scriptPath, String(process.pid), macStagedApp, bundlePath, logPath], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    app.quit();
    return Promise.resolve({ ok: true });
  }

  function install() {
    if (!pending) return Promise.resolve({ ok: false, reason: "no-update" });
    if (isMac) return installDarwin();
    try {
      autoUpdater.quitAndInstall();
      return Promise.resolve({ ok: true });
    } catch (err) {
      fail(err, "quitAndInstall");
      return offerManualDownload("The update couldn't be installed automatically.").then(() => ({ ok: false, reason: "error" }));
    }
  }

  // ── electron-updater wiring ──
  autoUpdater.logger = log;
  // On macOS electron-updater only checks; the download/install is ours.
  autoUpdater.autoDownload = !isMac;
  autoUpdater.autoInstallOnAppQuit = !isMac;

  autoUpdater.on("checking-for-update", () => {
    if (state.status !== "ready" && state.status !== "downloading") setState({ status: "checking", error: null });
  });
  autoUpdater.on("update-not-available", () => {
    if (state.status !== "ready") setState({ status: "up-to-date", error: null });
  });
  autoUpdater.on("update-available", (info) => {
    latestInfo = info;
    const manual = manualDownloadUrl(platform, info);
    if (pending && pending.version === info.version) {
      setState({ manualDownloadUrl: manual });
      return;
    }
    if (isMac && macBlocker) {
      // Can't self-install from here: surface it instead of downloading for nothing.
      setState({ status: "error", version: info.version, manualDownloadUrl: manual, error: macBlocker });
      notify(`riff.quest ${info.version} is available. Click to download it.`, openManualDownload);
      return;
    }
    setState({ status: "downloading", version: info.version, percent: 0, error: null, manualDownloadUrl: manual });
    if (isMac) downloadDarwin(info).catch((err) => fail(err, "mac download"));
  });
  autoUpdater.on("download-progress", (progress) => {
    if (state.status === "downloading") setState({ percent: progress.percent });
  });
  autoUpdater.on("update-downloaded", (info) => {
    if (!isMac) markReady(info.version);
  });
  autoUpdater.on("error", (err) => fail(err, "autoUpdater"));

  // NOT checkForUpdatesAndNotify(): its OS notification has no click handler
  // and promises an install "on exit", which a tray app may not see for weeks.
  function check() {
    return autoUpdater.checkForUpdates().catch((err) => {
      fail(err, "check");
      return null;
    });
  }

  /** Menu → "Check for Updates…": the same check, but always answers. */
  async function checkInteractive() {
    if (pending) {
      const { response } = await dialog.showMessageBox({
        type: "info",
        message: `riff.quest ${pending.version} is ready to install`,
        buttons: ["Restart now", "Later"],
        defaultId: 0,
        cancelId: 1,
      });
      if (response === 0) await install();
      return;
    }
    const result = await check();
    if (!result) {
      await offerManualDownload(`Couldn't check for updates${state.error ? ` (${state.error})` : ""}.`);
    } else if (!result.isUpdateAvailable) {
      await dialog.showMessageBox({ type: "info", message: "You're up to date", detail: `riff.quest ${state.currentVersion} is the latest version.` });
    } else if (state.status === "error") {
      await offerManualDownload("This copy of riff.quest can't update itself.");
    } else {
      await dialog.showMessageBox({
        type: "info",
        message: `Downloading riff.quest ${result.updateInfo.version}`,
        detail: "You'll be asked to restart when it's ready.",
      });
    }
  }

  function start() {
    log.info(`start v${state.currentVersion} on ${platform}${macBlocker ? ` (self-install blocked: ${macBlocker})` : ""}`);
    check();
    setInterval(check, CHECK_INTERVAL_MS);
  }

  return {
    start,
    check,
    checkInteractive,
    install,
    openManualDownload,
    getState: () => state,
    getPending: () => pending,
    logPath,
  };
}

module.exports = {
  createUpdater,
  RELEASES_PAGE_URL,
  // exported for tests
  releaseAssetUrl,
  pickFile,
  manualDownloadUrl,
  macAppBundlePath,
  selfReplaceBlocker,
  buildSwapScript,
  sha512Base64,
};
