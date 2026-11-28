// Imports one song package into the two local libraries: its tab next to the
// Guitar Pro files (gpFileStore), its recording next to the backing tracks
// (backingTrackStore). The tab remembers which recording came with it, so
// attaching it to a song can line the two up without asking.
const path = require("path");

const backingTrackStore = require("../backingTrackStore");
const gpFileStore = require("../gpFileStore");
const { decodeSongPack } = require("./decodeSongPack");

const SOURCE_EXTENSION = ".psarc";

// A guard against picking the wrong file, not a quota: a package is one song.
const MAX_PACK_BYTES = 200 * 1024 * 1024;

/** A file name both Windows and macOS accept. */
const fileLabel = (text) => String(text).replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);

/**
 * @param {string} fileName the package's own file name
 * @param {ArrayBuffer | Uint8Array | Buffer} data its bytes
 * @returns {{ file: object, audioError: string | null }} the stored tab's
 *   library entry, and why there is no recording when there is none
 */
function importSongPack(fileName, data) {
  const name = path.basename(String(fileName ?? ""));
  if (!name.toLowerCase().endsWith(SOURCE_EXTENSION)) {
    throw new Error(`"${name || "(no name)"}" is not a song package — use a ${SOURCE_EXTENSION} file.`);
  }

  const bytes = Buffer.from(data ?? []);
  if (bytes.length === 0) throw new Error(`"${name}" is empty.`);
  if (bytes.length > MAX_PACK_BYTES) {
    throw new Error(`"${name}" is ${Math.round(bytes.length / 1024 / 1024)} MB — the limit is ${MAX_PACK_BYTES / 1024 / 1024} MB.`);
  }

  const { tab, ogg, audioError } = decodeSongPack(bytes);
  const label = fileLabel(tab.artist && tab.title ? `${tab.artist} - ${tab.title}` : tab.title)
    || fileLabel(name.slice(0, -SOURCE_EXTENSION.length))
    || "Song";

  let track = null;
  let recordingError = audioError;
  if (ogg) {
    try {
      track = backingTrackStore.importTrackData(`${label}.ogg`, ogg);
    } catch (error) {
      recordingError = error?.message || "The recording could not be saved.";
    }
  }

  try {
    const stored = { ...tab, audioTrackId: track?.id ?? null };
    const file = gpFileStore.saveFile(
      `${label}${gpFileStore.SONG_PACK_TAB_EXTENSION}`,
      Buffer.from(JSON.stringify(stored), "utf8"),
    );
    return { file, audioError: track ? null : recordingError };
  } catch (error) {
    // No tab, so nothing would ever play this recording.
    if (track) backingTrackStore.deleteTrack(track.id);
    throw error;
  }
}

module.exports = { importSongPack, SOURCE_EXTENSION, MAX_PACK_BYTES };
