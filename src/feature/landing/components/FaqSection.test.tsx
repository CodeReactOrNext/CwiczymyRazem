// @vitest-environment jsdom

import { FaqSection } from "feature/landing/components/FaqSection";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const groups = [
  {
    section: "Getting started",
    questions: [
      { title: "Is it free?", message: "Yes, free forever." },
      { title: "Do I need to download anything?", message: "No." },
    ],
  },
  {
    section: "Practicing",
    questions: [{ title: "Every day?", message: "Not required." }],
  },
];

describe("FaqSection", () => {
  it("numbers questions continuously across groups and opens only the first", () => {
    const html = renderToString(<FaqSection groups={groups} />);

    expect(html).toContain("Getting started");
    expect(html).toContain("Practicing");
    ["01", "02", "03"].forEach((n) => expect(html).toContain(`>${n}<`));
    // `open=""` is the boolean attribute; class lists also contain `open:` variants.
    expect(html.match(/<details[^>]* open=""/g)).toHaveLength(1);
    // Every answer ships in the server HTML, closed panels included.
    expect(html).toContain("Not required.");
  });

  it("still accepts a flat list without a group heading", () => {
    const html = renderToString(<FaqSection questions={groups[0].questions} />);

    expect(html).toContain("Is it free?");
    expect(html).not.toContain("<h3");
  });
});
