export const SLOT_W       = 64;
/** The part of a slot's tile the arrow lives in. */
export const ARROW_AREA_H = 84;
/** The count ("1", "&") at the foot of the tile. */
export const LABEL_H      = 30;
export const TILE_H       = ARROW_AREA_H + LABEL_H;
/** The chord box / chips, the pattern name and the rep counter. */
export const HEADER_ROW_H = 48;
/** Breathing room between that row and the tiles. */
export const HEADER_GAP   = 14;
export const HEADER_H     = HEADER_ROW_H + HEADER_GAP;
export const PAD          = 16;
/** The rep bar under the tiles: its gap plus its height. */
export const REP_BAR_GAP  = 12;
export const REP_BAR_H    = 6;
export const DOTS_H       = REP_BAR_GAP + REP_BAR_H;

export const BG_COLOR     = "#0a0a0a";
/** Tiles separate the slots by background alone: counted beats sit a step
 *  brighter than the subdivisions between them. */
export const TILE_BEAT    = "#232328";
export const TILE_SUB     = "#17171a";
export const TILE_ACTIVE  = "#123840";
export const PANEL_COLOR  = "#1a1a1e";

/** Colour carries state, never direction — the arrow's shape already says
 *  down or up. */
export const INK_COLOR    = "#f4f4f5";
export const MUTED_COLOR  = "#a1a1aa";
/** The hand passing the strings without hitting them. */
export const GHOST_COLOR  = "#52525b";
export const ACTIVE_COLOR = "#67e8f9";
export const HIT_COLOR    = "#34d399";
export const WRONG_COLOR  = "#fbbf24";
export const MISS_COLOR   = "#f87171";
export const TEXT_DIM     = "#a1a1aa";
export const REP_DONE     = "#a1a1aa";
export const REP_CURRENT  = "#22d3ee";
export const REP_TODO     = "#27272a";

/** Half the width of an arrow head at full scale. */
export const HEAD_HALF_W  = 10;

/** Narrowest a slot may get while shrinking to fit. Below this the bar scrolls
 *  horizontally instead of being clipped. 16 slots (funk 16ths) still fit on a
 *  320px phone: 16 * 16 + 2 * PAD = 288. */
export const MIN_SLOT_W = 16;
/** The chord diagram is only drawn once the header has room to spare for it. */
export const DIAGRAM_MIN_W = 480;
