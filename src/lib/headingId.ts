/**
 * One slug rule for every in-page anchor on the site.
 *
 * Before the 2026-09-05 audit each surface derived its own: the blog's table of
 * contents slugged the raw markdown line while the rendered `<h2>` slugged its
 * React children, so any heading containing a link or bold text produced two
 * different ids and the anchor went nowhere. Both sides now go through
 * `headingText` -> `headingId`, with `createHeadingIdFactory` handling repeats.
 */

/** Strips markdown inline syntax so `## A [b](/c) **d**` reads as `A b d`. */
export const headingText = (markdown: string): string =>
  markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();

export const headingId = (text: string): string =>
  headingText(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

/**
 * Ids for one document, in reading order. Two headings with the same words get
 * `-2`, `-3`… so neither anchor swallows the other's clicks. Callers on both
 * sides of a page (the table of contents and the headings themselves) must walk
 * the document in the same order for the suffixes to line up.
 */
export const createHeadingIdFactory = () => {
  const seen = new Map<string, number>();

  return (text: string): string => {
    const base = headingId(text);
    if (!base) return base;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
};
