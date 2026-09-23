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

  it("splits headings that start their paragraph, as the generator writes them", () => {
    expect(
      parseDescriptionSections(
        "[What it is] Finding a phrase by ear.\n\n[Why it matters] Ear and fingers.\n\n[How to practice] Hum it, then find the root.",
      ),
    ).toEqual([
      { heading: "What it is", lines: ["Finding a phrase by ear."] },
      { heading: "Why it matters", lines: ["Ear and fingers."] },
      { heading: "How to practice", lines: ["Hum it, then find the root."] },
    ]);
  });

  it("splits headings run together on one line", () => {
    expect(
      parseDescriptionSections("[What it is] A. [Why it matters] B."),
    ).toEqual([
      { heading: "What it is", lines: ["A."] },
      { heading: "Why it matters", lines: ["B."] },
    ]);
  });

  it("leaves a lowercase bracketed aside inside a sentence alone", () => {
    expect(
      parseDescriptionSections("Play the root [on the low E] first."),
    ).toEqual([
      { heading: null, lines: ["Play the root [on the low E] first."] },
    ]);
  });

  it("trims indentation around lines and headings", () => {
    expect(
      parseDescriptionSections("  [What it is]  \n   indented line  "),
    ).toEqual([{ heading: "What it is", lines: ["indented line"] }]);
  });
});
