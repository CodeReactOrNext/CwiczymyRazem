// Turns a song package (.psarc) into what the app plays: the tab of each
// guitar and bass arrangement, and the song's recording as an Ogg file.
//
// Desktop only, and everything it produces stays on this computer — the
// recording inside a package is the released song, so neither it nor the tab
// made from it is ever uploaded or shared (see feature/songPack on the renderer
// side, which enforces the same thing there).
const path = require("path");

const { readArchive } = require("./archive");
const { readChart } = require("./chart");

const TAB_FORMAT = 1;

// Lead first: it is the part most people open a song for.
const PART_ORDER = ["lead", "rhythm", "combo", "bass"];

// Arrangements with no fretted part to show: lyrics and stage lighting.
const NOT_A_PART = /vocals|showlights/i;

const baseName = (entryName) => path.posix.basename(entryName).replace(/\.[^.]+$/, "");

/** What each arrangement's manifest says about it, keyed by its chart's file name. */
function readManifests(archive) {
  const byChart = new Map();
  for (const name of archive.names) {
    if (!/^manifests\/.+\.json$/i.test(name)) continue;
    try {
      const manifest = JSON.parse(archive.read(name).toString("utf8"));
      for (const entry of Object.values(manifest?.Entries ?? {})) {
        const attributes = entry?.Attributes;
        if (!attributes) continue;
        // "urn:application:xml:<chart name>" — the one field that names the chart.
        const fromUrn = typeof attributes.SongXml === "string" ? attributes.SongXml.split(":").pop() : null;
        byChart.set((fromUrn || baseName(name)).toLowerCase(), attributes);
      }
    } catch { /* a manifest that does not parse only costs the names */ }
  }
  return byChart;
}

function partsOf(archive) {
  const manifests = readManifests(archive);
  const parts = [];

  for (const name of archive.names) {
    if (!/^songs\/bin\/[^/]+\/.+\.sng$/i.test(name)) continue;
    const chartName = baseName(name);
    const attributes = manifests.get(chartName.toLowerCase());
    const arrangement = String(attributes?.ArrangementName ?? chartName.split("_").pop() ?? "");
    if (NOT_A_PART.test(arrangement) || NOT_A_PART.test(chartName)) continue;

    let chart;
    try {
      chart = readChart(archive.read(name), /\/macos\//i.test(name) ? "mac" : "pc");
    } catch {
      continue; // one unreadable arrangement does not lose the others
    }
    if (chart.notes.length === 0 || chart.beats.length < 2) continue;

    const kind = /bass/i.test(arrangement) ? "bass" : "guitar";
    const stringCount = kind === "bass" ? 4 : 6;
    parts.push({
      name: arrangement || "Guitar",
      kind,
      stringCount,
      tuning: Array.from({ length: stringCount }, (_, s) => chart.tuning[s] ?? 0),
      capo: chart.capo,
      beats: chart.beats,
      sections: chart.sections,
      notes: chart.notes.filter((note) => note.string < stringCount),
      lengthSec: chart.lengthSec,
      title: attributes?.SongName,
      artist: attributes?.ArtistName,
    });
  }

  const rank = (part) => {
    const at = PART_ORDER.findIndex((key) => part.name.toLowerCase().startsWith(key));
    return at === -1 ? PART_ORDER.length : at;
  };
  parts.sort((a, b) => rank(a) - rank(b));

  // Two arrangements can share a name (a second lead) — the track picker needs them apart.
  const seen = new Map();
  for (const part of parts) {
    const count = (seen.get(part.name) ?? 0) + 1;
    seen.set(part.name, count);
    if (count > 1) part.name = `${part.name} ${count}`;
  }
  return parts;
}

/**
 * The song's recording, converted to Ogg Vorbis.
 *
 * A package carries the full song and a short preview clip; the song is the
 * bigger of the two. The audio is repackaged, not re-encoded — the Vorbis
 * frames inside are kept as they are.
 */
function recordingOf(archive) {
  let largest = null;
  for (const name of archive.names) {
    if (!/\.wem$/i.test(name)) continue;
    const data = archive.read(name);
    if (data && (!largest || data.length > largest.length)) largest = data;
  }
  if (!largest) return { ogg: null, error: "The package has no recording." };

  try {
    // Required here rather than at the top: the converter is only ever needed
    // for an import, and its codebook tables are a few hundred kilobytes.
    const { convertWwiseRiffToOgg, getPackedCodebooks } = require("ww2ogg-ts");
    const { ogg } = convertWwiseRiffToOgg(largest, { codebooks: getPackedCodebooks("aoTuV_603") });
    return { ogg, error: null };
  } catch (error) {
    return { ogg: null, error: error?.message || "The recording could not be converted." };
  }
}

/**
 * @param {Buffer} buffer a whole package
 * @returns {{ tab: object, ogg: Buffer | null, audioError: string | null }}
 */
function decodeSongPack(buffer) {
  const archive = readArchive(buffer);
  const parts = partsOf(archive);
  if (parts.length === 0) throw new Error("No guitar or bass part could be read from this package.");

  const { title, artist } = parts.find((part) => part.title) ?? {};
  const { ogg, error } = recordingOf(archive);

  return {
    tab: {
      format: TAB_FORMAT,
      title: typeof title === "string" ? title : "",
      artist: typeof artist === "string" ? artist : "",
      lengthSec: Math.max(...parts.map((part) => part.lengthSec || 0)),
      parts: parts.map(({ name, kind, stringCount, tuning, capo, beats, sections, notes }) => ({
        name, kind, stringCount, tuning, capo, beats, sections, notes,
      })),
    },
    ogg,
    audioError: error,
  };
}

module.exports = { decodeSongPack, TAB_FORMAT };
