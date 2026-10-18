import type { BackingAlignment } from "../types/backingTrack.types";

/**
 * Where the backing track stands, as far as the session's entry point cares:
 * no recording yet, a recording never placed against the tab, or placed.
 *
 * Only the audio counts. The video is a picture laid over the tab, so a song
 * with a video and no files still has no backing track.
 */
export type BackingTrackStatus = "empty" | "unaligned" | "aligned";

export interface BackingTrackStatusInput {
  /** Files playing under the tab — always 0 off the desktop. */
  stemCount: number;
  alignment: Pick<BackingAlignment, "offsetMs" | "tempoAnchors">;
}

/**
 * Nothing pinned and the start never moved means the recording plays wherever
 * it happened to begin, which is almost never on the tab's first beat.
 */
export const isLinedUp = (alignment: BackingTrackStatusInput["alignment"]) =>
  Math.round(alignment.offsetMs) !== 0 || (alignment.tempoAnchors?.length ?? 0) > 0;

export function getBackingTrackStatus({ stemCount, alignment }: BackingTrackStatusInput): BackingTrackStatus {
  if (stemCount === 0) return "empty";
  return isLinedUp(alignment) ? "aligned" : "unaligned";
}
