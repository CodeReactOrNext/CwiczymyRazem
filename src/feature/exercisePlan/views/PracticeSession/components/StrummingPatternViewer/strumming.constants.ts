export const SLOT_W       = 64;
export const ARROW_AREA_H = 88;
export const LABEL_H      = 26;
/** The chord box / chips, the pattern name and the rep counter. */
export const HEADER_ROW_H = 36;
/** Room between that row and the arrows for the idle cursor's "▶ PLAY" label. Without it the
 *  label and the cursor's top ran into the chord box — on a phone "Em" sat over the marker. */
export const CURSOR_LABEL_H = 16;
export const HEADER_H     = HEADER_ROW_H + CURSOR_LABEL_H;
export const PAD          = 16;
export const DOTS_H       = 22;

export const CURSOR_COLOR = "rgba(250,204,21,0.90)";
export const BG_COLOR     = "#0a0a0a";
export const DOWN_COLOR   = "#60a5fa";
export const UP_COLOR     = "#c084fc";
export const MUTED_COLOR  = "#fb923c";
export const MISS_COLOR   = "rgba(255,255,255,0.10)";
export const ACCENT_DOT   = "#facc15";
export const LABEL_BEAT   = "rgba(255,255,255,0.75)";
export const LABEL_SUB    = "rgba(255,255,255,0.28)";
export const BEAT_LINE    = "rgba(255,255,255,0.06)";
export const BAR_LINE     = "rgba(255,255,255,0.18)";

/** Narrowest a slot may get while shrinking to fit. Below this the bar scrolls
 *  horizontally instead of being clipped. 16 slots (funk 16ths) still fit on a
 *  320px phone: 16 * 16 + 2 * PAD = 288. */
export const MIN_SLOT_W = 16;
