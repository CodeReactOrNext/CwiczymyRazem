import type { SongPart } from "feature/songs/types/songs.type";

export const SONG_PART_ORDER: SongPart[] = ["riff", "solo", "wholeSong"];

/** Riff and solo are covered (grayed out) while the whole song is marked. */
export const isPartCovered = (parts: SongPart[], part: SongPart): boolean =>
  part !== "wholeSong" && parts.includes("wholeSong");

/**
 * Selection after tapping `part`. Covered parts (riff/solo under an active
 * "whole song" mark) don't toggle — the tap is a no-op and returns the same array.
 */
export const toggleSongPart = (parts: SongPart[], part: SongPart): SongPart[] => {
  if (isPartCovered(parts, part)) return parts;
  return parts.includes(part)
    ? parts.filter((p) => p !== part)
    : [...parts, part];
};
