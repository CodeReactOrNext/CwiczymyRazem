import { ClipboardList, Guitar, Sparkles, Target } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  getCategoryIcon,
  hasRecentChanges,
  isBugFixItem,
  isEntryUnread,
  parseChangelog,
  parseVideoLink,
} from "./Changelog";

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

  it("attaches a video link to the category of the item above it", () => {
    const markdown = `## 30.10.2026
- ☕ Rest Day — One missed day a week no longer breaks your streak
- https://youtube.com/shorts/dQw4w9WgXcQ?si=abc
- 🔧 UI — Numerous fixes
- https://youtu.be/GJAaMEuS6bc
`;

    const { entries } = parseChangelog(markdown);

    expect(entries[0].groups).toEqual([
      {
        category: "Rest Day",
        items: ["One missed day a week no longer breaks your streak"],
        videos: [{ id: "dQw4w9WgXcQ", vertical: true }],
      },
      {
        category: "UI",
        items: ["Numerous fixes"],
        videos: [{ id: "GJAaMEuS6bc", vertical: false }],
      },
    ]);
  });

  it("starts a new block after a video, so each text keeps its own video", () => {
    const markdown = `## 30.10.2026
- One day off no longer ends your streak
- https://youtube.com/shorts/ROKWRaGCGF8
- Guitar duels are here
- https://youtube.com/shorts/Nn3u94kbZNQ
`;

    const { entries } = parseChangelog(markdown);

    expect(entries[0].groups).toEqual([
      {
        category: null,
        items: ["One day off no longer ends your streak"],
        videos: [{ id: "ROKWRaGCGF8", vertical: true }],
      },
      {
        category: null,
        items: ["Guitar duels are here"],
        videos: [{ id: "Nn3u94kbZNQ", vertical: true }],
      },
    ]);
  });

  it("reads `Title — <link>` as a titled video with no text", () => {
    const markdown = `## 30.10.2026
- ☕ Rest Day — https://youtube.com/shorts/ROKWRaGCGF8
- 🎸 New Guitars & Pedals in the Arsenal — https://youtu.be/GJAaMEuS6bc
- 🔧 UI — Numerous fixes
`;

    const { entries } = parseChangelog(markdown);

    expect(entries[0].groups).toEqual([
      {
        category: "Rest Day",
        items: [],
        videos: [{ id: "ROKWRaGCGF8", vertical: true }],
      },
      {
        category: "New Guitars & Pedals in the Arsenal",
        items: [],
        videos: [{ id: "GJAaMEuS6bc", vertical: false }],
      },
      { category: "UI", items: ["Numerous fixes"] },
    ]);
  });

  it("keeps a video link that opens an entry in an uncategorized group", () => {
    const markdown = `## 30.10.2026
- https://www.youtube.com/shorts/dQw4w9WgXcQ
`;

    const { entries } = parseChangelog(markdown);

    expect(entries[0].groups).toEqual([
      {
        category: null,
        items: [],
        videos: [{ id: "dQw4w9WgXcQ", vertical: true }],
      },
    ]);
  });
});

describe("parseVideoLink", () => {
  it("reads Shorts links as vertical videos", () => {
    expect(parseVideoLink("https://youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      id: "dQw4w9WgXcQ",
      vertical: true,
    });
    expect(
      parseVideoLink("https://m.youtube.com/shorts/dQw4w9WgXcQ?feature=share"),
    ).toEqual({ id: "dQw4w9WgXcQ", vertical: true });
  });

  it("reads youtu.be and watch links as regular videos", () => {
    expect(parseVideoLink("https://youtu.be/GJAaMEuS6bc?si=abc")).toEqual({
      id: "GJAaMEuS6bc",
      vertical: false,
    });
    expect(
      parseVideoLink(
        "https://www.youtube.com/watch?list=PL1&v=GJAaMEuS6bc&t=3",
      ),
    ).toEqual({ id: "GJAaMEuS6bc", vertical: false });
  });

  it("ignores other links and text that only mentions a video", () => {
    expect(parseVideoLink("https://example.com/shorts/dQw4w9WgXcQ")).toBe(null);
    expect(parseVideoLink("Watch it at https://youtu.be/GJAaMEuS6bc")).toBe(
      null,
    );
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

describe("getCategoryIcon", () => {
  it("returns a matching icon for known category keywords", () => {
    expect(getCategoryIcon("Daily Quests")).toBe(Target);
    expect(getCategoryIcon("Guitar Arsenal")).toBe(Guitar);
    expect(getCategoryIcon("Practice Plans")).toBe(ClipboardList);
  });

  it("falls back to the default icon for unknown or missing categories", () => {
    expect(getCategoryIcon("Something Unmapped")).toBe(Sparkles);
    expect(getCategoryIcon(null)).toBe(Sparkles);
  });
});

describe("isBugFixItem", () => {
  it("flags entries starting with Fixed/Fix", () => {
    expect(isBugFixItem("Fixed a lag in the correct-note detection")).toBe(
      true,
    );
    expect(isBugFixItem("Fix Google Translator issue")).toBe(true);
  });

  it("flags entries mentioning bug(s)", () => {
    expect(isBugFixItem("Numerous bug and UI fixes")).toBe(true);
  });

  it("does not flag regular feature entries", () => {
    expect(isBugFixItem("Added a metronome to the free timer")).toBe(false);
  });
});
