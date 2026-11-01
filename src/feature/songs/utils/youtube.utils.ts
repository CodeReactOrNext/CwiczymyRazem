export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

export const buildSongSectionMapId = (songId: string, videoId: string): string =>
  `${songId}__${videoId}`;

/** Faster than this is no use for practising a song. */
const MAX_SONG_SPEED = 1.25;

/** What the player offers before it says otherwise — the IFrame API's usual set. */
export const SONG_SPEED_FALLBACK = [0.25, 0.5, 0.75, 1, MAX_SONG_SPEED];

/**
 * The speed buttons for a video. The IFrame API rounds any rate the video
 * doesn't list to a listed one, so the buttons come from the player itself
 * rather than a hard-coded 0.6 or 0.9 that would quietly play at 0.75.
 */
export const pickSongSpeeds = (available: readonly number[] | undefined): number[] => {
  const speeds = (available ?? [])
    .filter((rate) => Number.isFinite(rate) && rate > 0 && rate <= MAX_SONG_SPEED)
    .sort((a, b) => a - b);
  return speeds.includes(1) ? speeds : SONG_SPEED_FALLBACK;
};
