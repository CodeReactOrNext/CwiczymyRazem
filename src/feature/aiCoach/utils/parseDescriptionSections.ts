export interface DescriptionSection {
  /** The `[Heading]` line that opened the block, or null for text before the first one. */
  heading: string | null;
  /** Non-empty lines, trimmed. Bullet lines keep their leading "- ". */
  lines: string[];
}

/**
 * Splits a step description into its `[What it is]` / `[Why it matters]` /
 * `[How to practice]` blocks. Blank lines are dropped; text before the first
 * heading lands in a heading-less section so nothing is lost.
 */
export const parseDescriptionSections = (
  description: string,
): DescriptionSection[] => {
  const sections: DescriptionSection[] = [];
  let current: DescriptionSection | null = null;

  description.split("\n").forEach((raw) => {
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
