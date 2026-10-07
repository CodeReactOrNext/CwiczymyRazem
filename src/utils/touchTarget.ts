/**
 * Grows an element's tap area to at least 44×44px without moving anything: an
 * invisible pseudo-element centred on it catches the taps. For targets that
 * sit inside text or tight rows (feed links, chips), where `min-h-11` would
 * push the layout apart.
 *
 * Uses `after:`, so the element must not already draw its own `::after`, and
 * an ancestor with `overflow-hidden` clips the extra area.
 */
export const TOUCH_TARGET =
  "relative after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-[max(100%,2.75rem)] after:-translate-x-1/2 after:-translate-y-1/2";
