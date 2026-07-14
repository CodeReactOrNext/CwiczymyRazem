import { describe, expect, it } from "vitest";

import { hasRecentChanges, isEntryUnread, parseChangelog } from "./Changelog";

describe("parseChangelog", () => {
  it("groups items by their category label and strips emoji", () => {
    const markdown = `# Changelog

## 13.07.2026
- 🎵 Practice Session — Fixed a lag in the correct-note detection
- 🔧 UI — Numerous fixes
- 🥁 Practice Session — Added keyboard shortcuts
`;

    const { entries } = parseChangelog(markdown);

    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe("13.07.2026");
    expect(entries[0].groups).toEqual([
      {
        category: "Practice Session",
        items: [
          "Fixed a lag in the correct-note detection",
          "Added keyboard shortcuts",
        ],
      },
      { category: "UI", items: ["Numerous fixes"] },
    ]);
  });

  it("falls back to an uncategorized group when there is no short category prefix", () => {
    const markdown = `## 21.05.2026
- Scale Tree - New Practice Mode
- 🔧 Fixed a mismatch where rating a song briefly showed +25 but only saved +5 — it now consistently awards +3 everywhere
`;

    const { entries } = parseChangelog(markdown);

    expect(entries[0].groups).toEqual([
      {
        category: null,
        items: [
          "Scale Tree - New Practice Mode",
          "Fixed a mismatch where rating a song briefly showed +25 but only saved +5 — it now consistently awards +3 everywhere",
        ],
      },
    ]);
  });

  it("parses multiple dates into separate entries, most recent first", () => {
    const markdown = `## 13.07.2026
- 🎵 Practice Session — First

## 09.07.2026
- 🔧 UI — Second
`;

    const { entries } = parseChangelog(markdown);

    expect(entries.map((entry) => entry.date)).toEqual([
      "13.07.2026",
      "09.07.2026",
    ]);
  });
});

describe("isEntryUnread", () => {
  it("is unread when the entry date is newer than the last viewed date", () => {
    expect(isEntryUnread("13.07.2026", "09.07.2026")).toBe(true);
  });

  it("is read when the entry date is older than or equal to the last viewed date", () => {
    expect(isEntryUnread("09.07.2026", "13.07.2026")).toBe(false);
    expect(isEntryUnread("13.07.2026", "13.07.2026")).toBe(false);
  });
});

describe("hasRecentChanges", () => {
  it("returns false for an empty changelog", () => {
    expect(hasRecentChanges([])).toBe(false);
  });
});
