/**
 * The standing board: instead of the tab sliding under a fixed cursor, it holds
 * still a page at a time while the cursor crosses it, then turns to the next.
 * Notes that do not move cannot smear, whatever the screen.
 *
 * Pages are cut at barlines, the same way for every pass of the tab, so the
 * worker and the main thread (which aims game effects at notes) agree on where
 * the board stands without talking to each other.
 */

/** Room kept left of a page's first barline, so it does not sit on the board's edge (world px). */
export const PAGE_LEAD = 24;
/** How much of the board's width a page's own bars may take. The rest shows
 *  the start of the next page, so the player can read ahead before the turn. */
const PAGE_FILL = 0.85;
/** The least a page moves on by, however narrow the board (world px). */
const PAGE_MIN_STEP = 40;

/**
 * Where each page of one pass starts (world px), the first always at 0.
 *
 * @param measureEndPx where each bar ends, ascending
 * @param totalW       length of one pass
 * @param visibleW     width of the board the music can use
 */
export function pageStarts(measureEndPx: readonly number[], totalW: number, visibleW: number): number[] {
  const starts = [0];
  if (!(totalW > 0) || !(visibleW > 0)) return starts;
  const reach = Math.max(PAGE_MIN_STEP, visibleW * PAGE_FILL - PAGE_LEAD);
  const whole = Math.max(reach, visibleW - PAGE_LEAD);
  let start = 0;
  let bar = 0;
  while (start < totalW) {
    while (bar < measureEndPx.length && measureEndPx[bar] <= start) bar++;
    // The last barline that still leaves the next page showing…
    let next = -1;
    for (let i = bar; i < measureEndPx.length && measureEndPx[i] <= start + reach; i++) next = measureEndPx[i];
    // …or the one bar there is, if it fits the board at all; a bar wider than
    // the board is cut where the page runs out.
    if (next < 0) next = bar < measureEndPx.length && measureEndPx[bar] <= start + whole ? measureEndPx[bar] : start + reach;
    if (next >= totalW) break;
    starts.push(next);
    start = next;
  }
  return starts;
}

/** The start of the page `x` is on. */
export function pageStartAt(starts: readonly number[], x: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= x) lo = mid;
    else hi = mid - 1;
  }
  return starts[lo] ?? 0;
}

/**
 * Where the board stands while the cursor is at `xInPass` of a pass that
 * begins at `passStart` (0, or a whole number of passes on a looping tab).
 */
export function pagedScrollX(starts: readonly number[], passStart: number, xInPass: number): number {
  return Math.max(0, passStart + pageStartAt(starts, xInPass) - PAGE_LEAD);
}
