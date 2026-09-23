export interface DescriptionSection {
  /** The `[Heading]` line that opened the block, or null for text before the first one. */
  heading: string | null;
  /** Non-empty lines, trimmed. Bullet lines keep their leading "- ". */
  lines: string[];
}

/**
 * A `[Heading]` as the generator writes it: a capitalised label of a few
 * words, on its own line or running straight into its text. Short and
 * capitalised so a bracketed aside inside a sentence is not taken for one.
 */
const INLINE_HEADING = /\[([A-Z][^[\]\n]{1,40})\]/g;

/**
 * Puts every heading on a line of its own. The older descriptions were written
 * that way; the current generator starts each paragraph with its heading —
 * "[What it is] Listening to…" — and sometimes runs all of them into one line.
 */
const headingsOnOwnLines = (description: string) =>
  description.replace(INLINE_HEADING, "\n[$1]\n");

/**
 * Splits a step description into its `[What it is]` / `[Why it matters]` /
 * `[How to practice]` blocks, whether each heading sits on its own line or at
 * the start of its paragraph. Blank lines are dropped; text before the first
 * heading lands in a heading-less section so nothing is lost.
 */
export const parseDescriptionSections = (
  description: string,
): DescriptionSection[] => {
  const sections: DescriptionSection[] = [];
  let current: DescriptionSection | null = null;

  headingsOnOwnLines(description)
    .split("\n")
    .forEach((raw) => {
      const line = raw.trim();
      const heading = line.match(/^\[(.+)\]$/);
      if (heading) {
        current = { heading: heading[1], lines: [] };
        sections.push(current);
        return;
      }
      if (line === "") return;
      if (!current) {
        current = { heading: null, lines: [] };
        sections.push(current);
      }
      current.lines.push(line);
    });

  return sections.filter((section) => section.heading || section.lines.length);
};
