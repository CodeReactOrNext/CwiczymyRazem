/**
 * Flags for work that lives in the tree but isn't ready to be seen yet.
 *
 * Read from `process.env.NEXT_PUBLIC_*`, which Next inlines at build time: a
 * flag that is off costs nothing at runtime, while the code behind it still
 * type-checks, lints and runs in tests like any other code.
 */

/**
 * Backing tracks in a practice session (feature/backingTrack): stem playback,
 * the YouTube layer, cinema mode and the whole alignment editor.
 *
 * Off unless `NEXT_PUBLIC_BACKING_TRACK=1` is set. With it off the session's
 * backing controller behaves exactly as it does for a plan that isn't a song —
 * no bar, no players, no stored config read or written, and the tablature keeps
 * its own tempo instead of a recording's curve.
 */
export const IS_BACKING_TRACK_ENABLED = process.env.NEXT_PUBLIC_BACKING_TRACK === "1";
