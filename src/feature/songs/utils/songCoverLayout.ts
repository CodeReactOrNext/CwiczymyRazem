/**
 * Shared-element id for a song's cover: the square in a board row or library card
 * and the big one at the top of the detail view carry the same id, so opening a
 * song morphs the cover into place (and back on close) instead of swapping screens.
 * Square everywhere on purpose — the morph scales, so a different aspect would
 * stretch the picture.
 */
export const songCoverLayoutId = (songId: string) => `song-cover-${songId}`;

/**
 * Corner radius set through `style`, not a class: framer-motion only corrects a
 * radius it can read, otherwise the corners would scale along with the cover.
 */
export const SONG_COVER_STYLE = { borderRadius: 8 } as const;
