// Single shared RtAudio instance for the whole app.
//
// Why shared: ASIO is single-client. Two separate RtAudio instances both trying
// to grab ASIO causes the second to silently fall back to WASAPI — which then
// breaks duplex (input & output are separate devices on WASAPI) and makes device
// ids inconsistent between the device picker and the amp. One instance keeps the
// API and device-id space consistent, and guarantees only one stream is open.
const { RtAudio } = require("audify");

let rt = null;

function getRt() {
  if (!rt) rt = new RtAudio();
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
