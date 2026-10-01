import {
  addSection,
  DEFAULT_PROFILE_LAYOUT,
  formatDaysAgo,
  hiddenSections,
  isAccentUnlocked,
  isDefaultProfileLayout,
  MAX_SECTIONS,
  MAX_TAGLINE_LENGTH,
  MAX_TROPHIES,
  moveSection,
  normalizeProfileLayout,
  removeSection,
  resolveAccent,
  resolveBanner,
  resolveEmblem,
  resolveFeaturedSongs,
  resolveTitle,
  resolveTrophies,
  setSectionSize,
  toggleBadge,
  toggleFact,
  toggleFeaturedSong,
  toggleTrophy,
} from "feature/profile/utils/profileLayout";
import { describe, expect, it } from "vitest";

describe("normalizeProfileLayout", () => {
  it("falls back to the default for missing data", () => {
    expect(normalizeProfileLayout(undefined)).toEqual(DEFAULT_PROFILE_LAYOUT);
    expect(normalizeProfileLayout(null)).toEqual(DEFAULT_PROFILE_LAYOUT);
  });

  it("drops unknown and duplicate sections and clamps sizes", () => {
    const layout = normalizeProfileLayout({
      sections: [
        { id: "about", size: "half" },
        { id: "nope", size: "half" },
        { id: "about", size: "full" },
        { id: "activity", size: "half" },
        "learning",
      ],
    });
    expect(layout.sections).toEqual([
      { id: "about", size: "half" },
      { id: "activity", size: "full" },
      { id: "learning", size: "half" },
    ]);
  });

  it("keeps an empty section list — the player hid everything", () => {
    expect(normalizeProfileLayout({ sections: [] }).sections).toEqual([]);
  });

  it("trims texts and rejects unknown accents", () => {
    const layout = normalizeProfileLayout({
      tagline: `  ${"x".repeat(200)}  `,
      about: 42,
      accent: "pink",
    });
    expect(layout.tagline).toHaveLength(MAX_TAGLINE_LENGTH);
    expect(layout.about).toBe("");
    expect(layout.accent).toBe("cyan");
  });

  it("keeps facts and badges in canonical order", () => {
    const layout = normalizeProfileLayout({
      facts: ["links", "joined", "bogus"],
      badges: ["song-tier"],
    });
    expect(layout.facts).toEqual(["joined", "links"]);
    expect(layout.badges).toEqual(["song-tier"]);
  });
});

describe("layout edits", () => {
  const base = normalizeProfileLayout(undefined);

  it("adds a hidden section at the bottom with its default size", () => {
    const next = addSection(removeSection(base, "rig"), "about");
    expect(next.sections.at(-1)).toEqual({ id: "about", size: "half" });
    expect(addSection(next, "about")).toBe(next);
  });

  it("removes and lists hidden sections", () => {
    const next = removeSection(base, "rig");
    expect(hiddenSections(next)).toContain("rig");
    expect(hiddenSections(next)).toContain("about");
  });

  it("moves sections and ignores bad indexes", () => {
    const next = moveSection(base, 0, 2);
    expect(next.sections[2].id).toBe("trophies");
    expect(moveSection(base, 0, 99)).toBe(base);
  });

  it("resizes only resizable sections", () => {
    expect(setSectionSize(base, "activity", "half")).toBe(base);
    const withAbout = addSection(removeSection(base, "rig"), "about");
    const next = setSectionSize(withAbout, "about", "full");
    expect(next.sections.find((s) => s.id === "about")?.size).toBe("full");
  });

  it("toggles facts and badges", () => {
    expect(toggleFact(base, "band").facts).not.toContain("band");
    expect(toggleFact(toggleFact(base, "band"), "band").facts).toEqual(
      base.facts,
    );
    expect(toggleBadge(base, "level").badges).toEqual(["song-tier"]);
  });

  it("knows when the layout is the default one", () => {
    expect(isDefaultProfileLayout(base)).toBe(true);
    expect(isDefaultProfileLayout({ ...base, accent: "amber" })).toBe(false);
  });
});

describe("formatDaysAgo", () => {
  const now = new Date(2026, 8, 30, 12);
  it.each([
    [new Date(2026, 8, 30, 1), "Today"],
    [new Date(2026, 8, 29, 23), "Yesterday"],
    [new Date(2026, 8, 26), "4 days ago"],
    [new Date(2026, 7, 1), "2 months ago"],
    [new Date(2023, 8, 1), "3 years ago"],
  ])("%s → %s", (date, expected) => {
    expect(formatDaysAgo(date, now)).toBe(expected);
  });

  it("returns null for a missing or invalid date", () => {
    expect(formatDaysAgo(null, now)).toBeNull();
    expect(formatDaysAgo(new Date("nope"), now)).toBeNull();
  });
});

describe("achievement-backed customisation", () => {
  const base = normalizeProfileLayout(undefined);

  it("pins at most five trophies and unpins on a second toggle", () => {
    let layout = base;
    (
      ["time_1", "time_2", "time_3", "fire", "medal", "wizard"] as const
    ).forEach((id) => {
      layout = toggleTrophy(layout, id);
    });
    expect(layout.trophies).toHaveLength(MAX_TROPHIES);
    expect(toggleTrophy(layout, "time_1").trophies).not.toContain("time_1");
  });

  it("drops unknown achievement ids from stored data", () => {
    const layout = normalizeProfileLayout({
      title: "nope",
      trophies: ["fire", "nope", "fire"],
    });
    expect(layout.title).toBeNull();
    expect(layout.trophies).toEqual(["fire"]);
  });

  it("shows only earned pins, else the rarest earned", () => {
    const pinned = { ...base, trophies: ["fire" as const, "lvl100" as const] };
    expect(resolveTrophies(pinned, ["fire", "time_1"])).toEqual(["fire"]);
    expect(resolveTrophies(base, ["time_1", "lvl100", "fire"])).toEqual([
      "lvl100",
      "fire",
      "time_1",
    ]);
  });

  it("wears a title only when it is earned", () => {
    const layout = { ...base, title: "wizard" as const };
    expect(resolveTitle(layout, ["wizard"])).toBe("wizard");
    expect(resolveTitle(layout, [])).toBeNull();
  });

  it("locks accents behind achievements and falls back to cyan", () => {
    expect(isAccentUnlocked("emerald", [])).toBe(true);
    expect(isAccentUnlocked("purple", ["fire"])).toBe(false);
    expect(isAccentUnlocked("purple", ["lvl100"])).toBe(true);
    expect(isAccentUnlocked("amber", ["fire"])).toBe(true);
    expect(isAccentUnlocked("orange", ["day_3"])).toBe(true);
    expect(resolveAccent({ ...base, accent: "purple" }, [])).toBe("cyan");
  });
});

describe("song case", () => {
  const base = normalizeProfileLayout(undefined);
  const learned = [
    { id: "a", avgDifficulty: 3 },
    { id: "b", avgDifficulty: 9 },
    { id: "c", avgDifficulty: 6 },
  ];

  it("shows pinned learned songs in pin order, else the hardest", () => {
    const pinned = toggleFeaturedSong(toggleFeaturedSong(base, "a"), "zzz");
    expect(resolveFeaturedSongs(pinned, learned).map((s) => s.id)).toEqual([
      "a",
    ]);
    expect(resolveFeaturedSongs(base, learned).map((s) => s.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("caps pins and sanitises stored ids", () => {
    let layout = base;
    ["1", "2", "3", "4", "5", "6"].forEach((id) => {
      layout = toggleFeaturedSong(layout, id);
    });
    expect(layout.featuredSongs).toHaveLength(5);
    expect(
      normalizeProfileLayout({ featuredSongs: ["x", "x", 3, ""] })
        .featuredSongs,
    ).toEqual(["x"]);
  });
});

describe("banner and emblem", () => {
  const base = normalizeProfileLayout(undefined);

  it("keeps known banners and falls back to classic when locked", () => {
    expect(normalizeProfileLayout({ banner: "nope" }).banner).toBe("classic");
    const layout = normalizeProfileLayout({ banner: "amethyst" });
    expect(resolveBanner(layout, [])).toBe("classic");
    expect(resolveBanner(layout, ["lvl100"])).toBe("amethyst");
    expect(resolveBanner({ ...base, banner: "midnight" }, [])).toBe("midnight");
  });

  it("shows the emblem only when earned", () => {
    const layout = normalizeProfileLayout({ emblem: "wizard" });
    expect(resolveEmblem(layout, ["wizard"])).toBe("wizard");
    expect(resolveEmblem(layout, [])).toBeNull();
    expect(normalizeProfileLayout({ emblem: "nope" }).emblem).toBeNull();
  });
});

describe("slots", () => {
  it("caps the profile at MAX_SECTIONS", () => {
    const full = normalizeProfileLayout(undefined);
    expect(full.sections).toHaveLength(MAX_SECTIONS);
    expect(addSection(full, "about")).toBe(full);
    const stored = normalizeProfileLayout({
      sections: [
        "about",
        "insights",
        "activity",
        "statistics",
        "repertoire",
        "learning",
        "skills",
        "rig",
      ],
    });
    expect(stored.sections).toHaveLength(MAX_SECTIONS);
  });
});
