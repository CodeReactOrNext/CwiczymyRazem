/**
 * One hue per role, so a colour on the alignment timeline always means the
 * same thing wherever it appears.
 *
 * The screen used to paint the bar grid, the tablature and the second stem all
 * in cyan, which put the two marks you are actually comparing — where the app
 * says the beat is, and where the recording says it is — in the same colour.
 * Worse, the grid changed colour as the eye travelled down: neutral on the
 * ruler, cyan on the lanes under it, for lines that are the same lines.
 *
 * The roles, and nothing outside them:
 *
 * - **grid** — zinc. The time structure is a backdrop, never the subject.
 * - **tab** — cyan. What you play, and the only cyan left on the timeline.
 * - **anchor** — orange. Bars pinned to a tempo of their own.
 * - **start** — amber. Where the recording begins against the grid.
 * - **playhead** — near-white. The one thing that moves on its own.
 * - **stems** — everything else, carrying no meaning but "a different track".
 */
export const TIMELINE_COLORS = {
  /** Bar starts: the reference you drag a transient onto. */
  barLine: "rgba(212, 212, 216, 0.5)",
  /** The same line where notes have to stay the subject — the tab lane. */
  barLineFaint: "rgba(212, 212, 216, 0.32)",
  /** Plain beats: texture, read only out of the corner of the eye. */
  beatLine: "rgba(113, 113, 122, 0.35)",
  /** Tablature string rails. */
  string: "rgba(82, 82, 91, 0.55)",
  /** A note's struck edge, at full strength — alignment is judged on this. */
  tab: "rgb(34, 211, 238)",
  /** The body of a note, which shows its length rather than its attack. */
  tabBlock: "rgba(34, 211, 238, 0.32)",
  /** Fret digits, light enough to read off a lit block. */
  tabLabel: "rgb(224, 252, 255)",
  /** The band of the recording the tab actually covers, on the overview. */
  tabSpan: "rgba(34, 211, 238, 0.12)",
  tabSpanEdge: "rgba(34, 211, 238, 0.5)",
  /** A bar pinned to its own tempo. */
  anchor: "rgb(251, 146, 60)",
  /** The same pin, on a bar the pointer is not over. */
  anchorQuiet: "rgba(251, 146, 60, 0.7)",
  /** Where the recording starts — the offset every other bar is measured from. */
  start: "rgb(251, 191, 36)",
  playhead: "rgba(244, 244, 245, 0.9)",
  /**
   * The overview's viewport box.
   *
   * Neutral on purpose: it says where you are *looking*, which is not a fact
   * about the music. Painted cyan it read as a second tab span sliding around
   * on top of the real one.
   */
  viewport: "rgba(244, 244, 245, 0.32)",
  viewportFill: "rgba(244, 244, 245, 0.07)",
  /** The whole-recording map, and any lane with no track colour of its own. */
  wave: "rgba(212, 212, 216, 0.62)",
  waveMap: "rgba(113, 113, 122, 0.75)",
} as const;

/**
 * One colour per stem, in the order they were added — identity, nothing more.
 *
 * Drawn from hues no other mark on the timeline uses. Cyan is the tab, orange a
 * pinned bar, amber the start, zinc the grid: a stem painted in any of those
 * would read as one of them, and the first stem used to be painted exactly the
 * grey of the grid lines running through it.
 *
 * Violet leads because it is the furthest thing from cyan on a dark lane, and
 * one stem against the tab is by far the commonest way this screen is used.
 */
const STEM_COLORS = [
  "rgba(167, 139, 250, 0.68)",
  "rgba(52, 211, 153, 0.68)",
  "rgba(251, 113, 133, 0.68)",
  "rgba(96, 165, 250, 0.68)",
  "rgba(232, 121, 249, 0.68)",
  "rgba(163, 230, 53, 0.68)",
] as const;

/** Muted stems keep their colour — you still need to know which track it is —
 *  but drop out of the foreground, the way a muted track should. */
const MUTED_ALPHA = 0.2;

export const stemColor = (index: number, isMuted = false) => {
  const color = STEM_COLORS[index % STEM_COLORS.length];
  return isMuted ? color.replace(/[\d.]+\)$/, `${MUTED_ALPHA})`) : color;
};
