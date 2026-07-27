// Single shared RtAudio instance for the whole app.
//
// Why shared: ASIO is single-client. Two separate RtAudio instances both trying
// to grab ASIO causes the second to silently fall back to WASAPI — which then
// breaks duplex (input & output are separate devices on WASAPI) and makes device
// ids inconsistent between the device picker and the amp. One instance keeps the
// API and device-id space consistent, and guarantees only one stream is open.
const { RtAudio, RtAudioApi } = require("audify");

let rt = null;

// `new RtAudio()` (no api arg) lets RtAudio auto-probe APIs in its own compiled
// order and silently settle on the first one that reports >=1 device. On
// Windows that's normally ASIO — but it's a probe, not a guarantee: if ASIO's
// probe throws or reports zero devices at that exact moment (another app
// holding a device exclusively, a flaky driver, a previous instance that
// didn't release the device), RtAudio just moves on to WASAPI for the rest of
// the process, with nothing in the app surfacing that it happened. WASAPI is
// real audio latency (10s of ms, separate in/out devices), not a display bug,
// so this can't be left to chance — request ASIO explicitly and only fall
// back to auto-probe if ASIO genuinely has no devices on this machine.
function createRt() {
  try {
    const asio = new RtAudio(RtAudioApi.WINDOWS_ASIO);
    if (asio.getDevices().length > 0) return asio;
  } catch { /* ASIO API not compiled/available on this platform */ }
  console.warn("[audio] No ASIO devices found — falling back to auto-selected API (likely WASAPI, higher latency).");
  return new RtAudio();
}

function getRt() {
  if (!rt) rt = createRt();
  return rt;
}

function isStreamOpen() {
  return !!rt && rt.isStreamOpen && rt.isStreamOpen();
}

/** Close whatever stream is currently open (capture OR amp). Idempotent. */
function closeStream() {
  if (!isStreamOpen()) return;
  try { rt.stop(); } catch { /* ignore */ }
  try { if (rt.clearOutputQueue) rt.clearOutputQueue(); } catch { /* ignore */ }
  try { rt.closeStream(); } catch { /* ignore */ }
}

module.exports = { getRt, isStreamOpen, closeStream };
