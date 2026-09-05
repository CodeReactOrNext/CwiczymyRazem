import { describe, expect, it } from "vitest";

import { parseDescriptionSections } from "./parseDescriptionSections";

describe("parseDescriptionSections", () => {
  it("splits the description on [Heading] lines and drops blank lines", () => {
    const sections = parseDescriptionSections(
      "[What it is]\nA short intro.\n\n[How to practice]\n- Slowly\n- With a metronome\n",
    );
    expect(sections).toEqual([
      { heading: "What it is", lines: ["A short intro."] },
      { heading: "How to practice", lines: ["- Slowly", "- With a metronome"] },
    ]);
  });

  it("keeps text before the first heading in a heading-less section", () => {
    expect(
      parseDescriptionSections("Plain paragraph.\n[Why it matters]\nBecause."),
    ).toEqual([
      { heading: null, lines: ["Plain paragraph."] },
      { heading: "Why it matters", lines: ["Because."] },
    ]);
  });

  it("handles a description with no headings at all", () => {
    expect(parseDescriptionSections("One.\nTwo.")).toEqual([
      { heading: null, lines: ["One.", "Two."] },
    ]);
  });

  it("returns nothing for an empty description", () => {
    expect(parseDescriptionSections("")).toEqual([]);
    expect(parseDescriptionSections("\n\n")).toEqual([]);
  });

  it("trims indentation around lines and headings", () => {
    expect(
      parseDescriptionSections("  [What it is]  \n   indented line  "),
    ).toEqual([{ heading: "What it is", lines: ["indented line"] }]);
  });
});
