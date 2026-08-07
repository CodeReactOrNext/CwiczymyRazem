// macOS microphone consent (TCC) for the native capture path.
//
// main.js grants every renderer permission request up front
// (setPermissionRequestHandler → cb(true)), but that is Chromium's own
// permission layer and it only governs getUserMedia inside the renderer. The
// native path does not go through it at all: nativeAudioEngine.js opens a
// CoreAudio stream from the main process via RtAudio, and macOS treats that as
// a separate ask that nobody has made.
//
// What makes this hard to notice is that unauthorized capture on macOS does not
// fail. CoreAudio opens the stream, reports the device, and delivers buffers of
// pure silence — so every layer above reports success and the app simply never
// detects a note. Hence: ask explicitly, before a stream is ever opened, and
// treat "not granted" as a hard error with an actionable message rather than
// letting it degrade into silence.
// Resolved lazily rather than destructured at import time: under Node/Vitest
// `require("electron")` returns a path string, not the API object (same
// constraint toneStore.js documents), so the electron APIs are reached through
// this indirection and swapped for fakes in the tests.
let electronApi = null;
let platformOverride = null;

function api() {
  if (!electronApi) electronApi = require("electron");
  return electronApi;
}

function isMac() {
  return (platformOverride || process.platform) === "darwin";
}

// Deep link to the exact pane; the generic Privacy & Security page would leave
// the user hunting for the microphone list.
const PRIVACY_PANE_URL =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone";

// Once denied, macOS never shows the system prompt again — askForMediaAccess
// resolves false immediately and the only way back is System Settings.
const DENIED_MESSAGE =
  "riff.quest can't hear your guitar because macOS is blocking microphone " +
  "access. Enable riff.quest under System Settings → Privacy & Security → " +
  "Microphone, then start the session again.";

// A session start can fan out into more than one stream request (capture and
// the amp sim). Sharing the in-flight promise keeps that to a single system
// prompt instead of stacking one dialog per request.
let pendingRequest = null;

function isDenied(status) {
  return status === "denied" || status === "restricted";
}

async function showDeniedDialog(parentWindow) {
  const { dialog, shell } = api();
  const options = {
    type: "warning",
    title: "Microphone access blocked",
    message: "Microphone access blocked",
    detail: DENIED_MESSAGE,
    buttons: ["Open System Settings", "Cancel"],
    defaultId: 0,
    cancelId: 1,
  };
  const { response } =
    parentWindow && !parentWindow.isDestroyed()
      ? await dialog.showMessageBox(parentWindow, options)
      : await dialog.showMessageBox(options);
  if (response === 0) shell.openExternal(PRIVACY_PANE_URL);
}

async function requestAccess(parentWindow) {
  const { systemPreferences } = api();
  const status = systemPreferences.getMediaAccessStatus("microphone");
  if (status === "granted") return true;

  if (isDenied(status)) {
    await showDeniedDialog(parentWindow);
    return false;
  }

  // "not-determined" (or "unknown"): this call is what actually surfaces the
  // system prompt — and it only works because Info.plist carries
  // NSMicrophoneUsageDescription (see mac.extendInfo in electron-builder.yml).
  const granted = await systemPreferences.askForMediaAccess("microphone");
  if (!granted) await showDeniedDialog(parentWindow);
  return granted;
}

/**
 * Resolve macOS microphone consent, prompting the user if they haven't been
 * asked yet. No-op returning true on Windows/Linux, where the OS has no
 * equivalent gate in front of the native audio APIs.
 * @param {import("electron").BrowserWindow} [parentWindow] parent for the
 *   "blocked" dialog, so it attaches as a sheet instead of a loose window.
 * @returns {Promise<boolean>}
 */
async function ensureMicrophoneAccess(parentWindow) {
  if (!isMac()) return true;
  if (api().systemPreferences.getMediaAccessStatus("microphone") === "granted") {
    return true;
  }
  if (!pendingRequest) {
    pendingRequest = requestAccess(parentWindow).finally(() => {
      pendingRequest = null;
    });
  }
  return pendingRequest;
}

/**
 * ensureMicrophoneAccess, but throws instead of returning false — for IPC
 * handlers, where the rejection travels back to the renderer and surfaces in
 * the same place any other audio-start failure does.
 */
async function requireMicrophoneAccess(parentWindow) {
  const granted = await ensureMicrophoneAccess(parentWindow);
  if (!granted) throw new Error(DENIED_MESSAGE);
}

/** Test-only: swap the electron API object and the reported platform. */
function _setEnvForTests({ electron, platform } = {}) {
  electronApi = electron || null;
  platformOverride = platform || null;
  pendingRequest = null;
}

module.exports = {
  ensureMicrophoneAccess,
  requireMicrophoneAccess,
  _setEnvForTests,
};
