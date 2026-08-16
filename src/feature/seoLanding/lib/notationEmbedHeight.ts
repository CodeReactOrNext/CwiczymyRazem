/**
 * Fixed height for the box an embedded AlphaTab score renders into.
 *
 * AlphaTab only knows its engraved height once it has rendered — dynamic
 * import, then font load, then layout — and that height swings between one
 * system and eight depending on measure count and container width. A box that
 * grows to fit therefore changes the document height mid-scroll: the article
 * shifts under the reader and the reading-progress bar jumps, which is what
 * made the guide pages feel like they scrolled themselves.
 *
 * So the box gets a fixed height up front and scrolls internally when the
 * score is taller — the same bounded-viewport pattern PracticeSession's
 * AlphaTabScoreViewer already uses. The height comes from the measure count
 * alone, never from the viewport, so the server and the client reserve exactly
 * the same space and hydration doesn't shift either.
 */

/** One ScoreTab system: 5-line staff, 6-line tab below it, and the gap under both. */
const SYSTEM_PX = 190;
/** Roughly what AlphaTab fits per system in a reading-width column. */
const MEASURES_PER_SYSTEM = 4;
/** Padding around the engraved sheet inside its container. */
const BOX_PADDING_PX = 24;
const MIN_HEIGHT_PX = 220;
const MAX_HEIGHT_PX = 560;

/**
 * Height in px to reserve for `measureCount` measures of notation. Longer
 * drills get a taller window up to a cap, past which the score scrolls inside
 * the box rather than pushing the rest of the page around.
 */
export const notationEmbedHeightPx = (measureCount: number): number => {
  const systems = Math.max(1, Math.ceil(measureCount / MEASURES_PER_SYSTEM));
  const wanted = systems * SYSTEM_PX + BOX_PADDING_PX;
  return Math.min(MAX_HEIGHT_PX, Math.max(MIN_HEIGHT_PX, wanted));
};
