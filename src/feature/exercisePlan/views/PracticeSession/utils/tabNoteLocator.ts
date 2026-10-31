/** A tab note on the page: where it is, and the board it is on — to shake when something hits it. */
export interface TabNotePoint {
  x: number;
  y: number;
  board: HTMLElement | null;
  /** The spot aimed at, as a share of the note's length — hand it back to follow that spot. */
  along: number;
}

/**
 * Where a tab note is drawn on the page, `aheadSec` from now — at the spot
 * `along` its length when given — see useTablatureWorkerBridge's locateNote.
 */
export type TabNoteLocator = (
  noteKey: string,
  aheadSec?: number,
  along?: number,
) => TabNotePoint | null;

const locators = new Set<TabNoteLocator>();

/** A tab on the page offers its notes to aim at; returns the unregister. */
export const registerTabNoteLocator = (locator: TabNoteLocator) => {
  locators.add(locator);
  return () => {
    locators.delete(locator);
  };
};

/**
 * Where note `noteKey` is on whichever tab is on screen — the desktop and the
 * phone views are both mounted, and the hidden one finds nothing.
 */
export const locateTabNote: TabNoteLocator = (noteKey, aheadSec, along) => {
  for (const locator of locators) {
    const point = locator(noteKey, aheadSec, along);
    if (point) return point;
  }
  return null;
};
