import type { TablatureMeasure } from "../../../types/exercise.types";

/** A named stretch of the song, as bar indices (both ends included). */
export interface TabSection {
  /** Absent for the bars before the song's first marker. */
  name?: string;
  lo: number;
  hi: number;
}

/**
 * The song cut into its sections, from the markers its bars carry. Every bar
 * belongs to exactly one, so the bars ahead of the first marker form a nameless
 * section of their own. A song with no markers has no sections at all.
 */
export function buildTabSections(measures: TablatureMeasure[]): TabSection[] {
  const sections: TabSection[] = [];
  measures.forEach((measure, i) => {
    if (measure.section) sections.push({ name: measure.section, lo: i, hi: i });
    else if (sections.length > 0) sections[sections.length - 1].hi = i;
  });
  if (sections.length === 0) return [];
  if (sections[0].lo > 0) sections.unshift({ lo: 0, hi: sections[0].lo - 1 });
  return sections;
}

/** Index of the section a bar is in, or -1 when the song has none. */
export function sectionIndexOfBar(sections: TabSection[], bar: number): number {
  for (let i = sections.length - 1; i >= 0; i--) {
    if (bar >= sections[i].lo) return i;
  }
  return sections.length > 0 ? 0 : -1;
}

/** "152–161", or just "152" for a section of one bar — bars as the player counts them. */
export const sectionBarRange = (section: TabSection): string =>
  section.hi > section.lo ? `${section.lo + 1}–${section.hi + 1}` : `${section.lo + 1}`;
