import type { MutableRefObject } from "react";

import type { ScoreClock } from "../utils/backingSync";
import type { RecordingTempoMap, TempoAnchor } from "../utils/tempoMap";

/** One audio file in the desktop backing-track library (electron/backingTrackStore.js). */
export interface BackingTrackMeta {
  id: string;
  /** File name without its extension — what the picker shows. */
  name: string;
  fileName: string;
  ext: string;
  mimeType: string;
  size: number;
  importedAt: number;
}

/** One layer of a recording: the backing, the guitar, the vocals. */
export interface BackingStem {
  trackId: string;
  volume: number;
  muted: boolean;
  /** This stem's own shift, in ms, on top of the assignment's offset. Zero for
   *  stems that were exported together; non-zero when one was sourced
   *  separately and starts at a different point. */
  offsetMs: number;
}

/**
 * How a recording lines up with one song's tab. Per machine — the audio lives here.
 *
 * The assignment's offset and tempo place the recording as a whole against the
 * tab. Stems exported together need nothing more; one that came from elsewhere
 * can carry its own extra shift (see BackingStem.offsetMs).
 */
export interface BackingTrackAssignment {
  stems: BackingStem[];
  /** Where the tab's beat 0 sits inside the recording. */
  offsetMs: number;
  /** Tempo the recording itself runs at. */
  sourceBpm: number;
  /**
   * Bars pinned to the moments they actually happen in the recording, for a
   * band that didn't play to a click. Empty or absent means `sourceBpm` holds
   * for the whole song, which is how every existing assignment reads.
   */
  tempoAnchors?: TempoAnchor[];
  volume: number;
  muted: boolean;
  updatedAt?: number;
}

/** The same alignment for a YouTube video — device independent, so it lives in Firestore. */
export interface YouTubeBackingConfig {
  videoId: string | null;
  offsetMs: number;
  sourceBpm: number;
  /** See BackingTrackAssignment.tempoAnchors. */
  tempoAnchors?: TempoAnchor[];
  volume: number;
  muted: boolean;
}

/** Everything a source-agnostic control (offset slider, tempo field…) can change. */
export type BackingAlignment = Pick<
  BackingTrackAssignment,
  "offsetMs" | "sourceBpm" | "tempoAnchors" | "volume" | "muted"
>;

export const DEFAULT_STEM: Omit<BackingStem, "trackId"> = { volume: 1, muted: false, offsetMs: 0 };

export const DEFAULT_ALIGNMENT: BackingAlignment = {
  offsetMs: 0,
  sourceBpm: 120,
  tempoAnchors: [],
  volume: 0.8,
  muted: false,
};

/** The clock and the view every timeline lane in the editor reads. */
export interface TimelineWindow {
  startTime: number | null;
  effectiveBpm: number;
  /**
   * The session clock, so every lane reads the bar the session is actually
   * playing rather than the one an even beat count would suggest.
   *
   * A ref because it is rebuilt whenever a bar is pinned, and threading a fresh
   * object into every canvas would tear down their frame loops mid-drag.
   */
  scoreClockRef: MutableRefObject<ScoreClock | null>;
  /** Where the next Play begins, for when the transport is stopped — without it
   *  a stopped lane drew its playhead at bar 1. */
  getResumeBeat?: () => number;
  sourceBpm: number;
  /** Where the tab's beat 0 falls in the recording. */
  offsetMs: number;
  /** Where the tab's bars actually fall in the recording, pinned bars included. */
  tempoMap: RecordingTempoMap;
  beatsPerBar: number;
  /** Seconds of recording across the lane — the zoom. */
  windowSec: number;
  /** Where to look while parked. Null follows the playhead. */
  centreSecOverride: number | null;
}
