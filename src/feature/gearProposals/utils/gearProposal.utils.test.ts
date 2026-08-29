import { describe, expect, it } from "vitest";

import {
  DEFAULT_SCRAP_TIER,
  effectTypeFor,
  isProposableRarity,
  MAX_SCRAP_QTY,
  MAX_SCRAP_SLOTS,
  partsForKind,
  rankProposals,
  safeImageUrl,
  sanitizeScrapBom,
  tiersForPart,
} from "./gearProposal.utils";

describe("safeImageUrl", () => {
  it("takes an https link", () => {
    expect(safeImageUrl("https://example.com/guitar.webp")).toBe(
      "https://example.com/guitar.webp",
    );
    expect(safeImageUrl("  https://example.com/a.png  ")).toBe(
      "https://example.com/a.png",
    );
  });

  it("drops every scheme that could execute or bloat", () => {
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
    expect(safeImageUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(safeImageUrl("http://example.com/a.png")).toBeNull();
  });

  it("drops junk instead of throwing", () => {
    expect(safeImageUrl("not a url")).toBeNull();
    expect(safeImageUrl("")).toBeNull();
    expect(safeImageUrl(null)).toBeNull();
    expect(safeImageUrl(42)).toBeNull();
  });
});

describe("isProposableRarity", () => {
  it("accepts the tiers a case can actually drop", () => {
    expect(isProposableRarity("Common")).toBe(true);
    expect(isProposableRarity("Mythic")).toBe(true);
  });

  it("refuses Custom Shop — the workshop is the only way to one", () => {
    expect(isProposableRarity("Custom Shop")).toBe(false);
  });

  it("refuses anything invented", () => {
    expect(isProposableRarity("Ultra")).toBe(false);
    expect(isProposableRarity(undefined)).toBe(false);
  });
});

describe("effectTypeFor", () => {
  const known = ["Delay", "Fuzz"] as const;

  it("keeps a real effect type on a pedal", () => {
    expect(effectTypeFor("effect", "Delay", known)).toBe("Delay");
  });

  it("never lets a guitar carry one", () => {
    expect(effectTypeFor("guitar", "Delay", known)).toBeNull();
  });

  it("drops a type nobody has heard of", () => {
    expect(effectTypeFor("effect", "Sparkle", known)).toBeNull();
  });
});

describe("partsForKind", () => {
  it("offers a guitar its own parts and the shared ones", () => {
    const ids = partsForKind("guitar").map((part) => part.id);

    expect(ids).toContain("neck");
    expect(ids).toContain("screws");
    expect(ids).not.toContain("opamp");
  });

  it("offers a pedal its own parts and the shared ones", () => {
    const ids = partsForKind("effect").map((part) => part.id);

    expect(ids).toContain("opamp");
    expect(ids).toContain("screws");
    expect(ids).not.toContain("neck");
  });
});

describe("sanitizeScrapBom", () => {
  it("keeps the order, because order is the salvage priority", () => {
    const bom = sanitizeScrapBom("guitar", [
      { partId: "pickup", qty: 1 },
      { partId: "body", qty: 1 },
    ]);

    expect(bom.map((slot) => slot.partId)).toEqual(["pickup", "body"]);
  });

  it("throws out a part that kind of gear cannot yield", () => {
    const bom = sanitizeScrapBom("guitar", [
      { partId: "opamp", qty: 1 },
      { partId: "neck", qty: 1 },
    ]);

    expect(bom.map((slot) => slot.partId)).toEqual(["neck"]);
  });

  it("collapses a part listed twice to its first slot", () => {
    const bom = sanitizeScrapBom("guitar", [
      { partId: "neck", qty: 1 },
      { partId: "neck", qty: 3 },
    ]);

    expect(bom).toEqual([{ partId: "neck", qty: 1, tier: DEFAULT_SCRAP_TIER }]);
  });

  it("clamps quantities and repairs missing ones", () => {
    const bom = sanitizeScrapBom("guitar", [
      { partId: "body", qty: 99 },
      { partId: "neck", qty: 0 },
      { partId: "bridge" },
      { partId: "pickup", qty: "2" },
    ]);

    expect(bom).toEqual([
      { partId: "body", qty: MAX_SCRAP_QTY, tier: DEFAULT_SCRAP_TIER },
      { partId: "neck", qty: 1, tier: DEFAULT_SCRAP_TIER },
      { partId: "bridge", qty: 1, tier: DEFAULT_SCRAP_TIER },
      { partId: "pickup", qty: 2, tier: DEFAULT_SCRAP_TIER },
    ]);
  });

  it("caps how long a teardown can get", () => {
    const bom = sanitizeScrapBom(
      "guitar",
      ["body", "neck", "bridge", "pickup", "tuners", "pot", "screws"].map(
        (partId) => ({ partId, qty: 1 }),
      ),
    );

    expect(bom).toHaveLength(MAX_SCRAP_SLOTS);
  });

  it("survives junk instead of throwing", () => {
    expect(sanitizeScrapBom("guitar", null)).toEqual([]);
    expect(sanitizeScrapBom("guitar", [null, "neck", 7])).toEqual([]);
  });
});

describe("tiersForPart", () => {
  it("stops a part at its own ceiling", () => {
    expect(tiersForPart("screws")).toEqual(["Standard"]);
    expect(tiersForPart("pot")).toEqual(["Standard", "Epic"]);
  });

  it("offers Unique only to a part worth looking at", () => {
    expect(tiersForPart("body")).toContain("Unique");
    expect(tiersForPart("neck")).not.toContain("Unique");
  });

  it("never puts Unique under the ceiling it sits above", () => {
    expect(tiersForPart("body")).toEqual([
      "Standard",
      "Epic",
      "Legendary",
      "Unique",
    ]);
  });

  it("falls back to Standard for a part nobody has heard of", () => {
    expect(tiersForPart("flux-capacitor" as never)).toEqual([
      DEFAULT_SCRAP_TIER,
    ]);
  });
});

describe("the grade a teardown asks for", () => {
  it("keeps a grade the part can actually hold", () => {
    expect(
      sanitizeScrapBom("guitar", [{ partId: "body", tier: "Unique" }]),
    ).toEqual([{ partId: "body", qty: 1, tier: "Unique" }]);
  });

  it("refuses a legendary screw", () => {
    expect(
      sanitizeScrapBom("guitar", [{ partId: "screws", tier: "Legendary" }]),
    ).toEqual([{ partId: "screws", qty: 1, tier: "Standard" }]);
  });

  it("refuses Unique on a part that cannot wear it", () => {
    expect(
      sanitizeScrapBom("guitar", [{ partId: "neck", tier: "Unique" }]),
    ).toEqual([{ partId: "neck", qty: 1, tier: "Standard" }]);
  });

  it("defaults a slot proposed before grades existed", () => {
    expect(sanitizeScrapBom("guitar", [{ partId: "neck", qty: 2 }])).toEqual([
      { partId: "neck", qty: 2, tier: DEFAULT_SCRAP_TIER },
    ]);
  });
});

describe("rankProposals", () => {
  const proposal = (id: string, voteCount: number, createdAt: string) => ({
    id,
    voteCount,
    createdAt,
  });

  it("puts the most backed first", () => {
    const ranked = rankProposals([
      proposal("quiet", 1, "2026-01-01T00:00:00.000Z"),
      proposal("loud", 9, "2026-02-01T00:00:00.000Z"),
    ]);

    expect(ranked.map((p) => p.id)).toEqual(["loud", "quiet"]);
  });

  it("breaks a tie in favour of whoever proposed it first", () => {
    const ranked = rankProposals([
      proposal("late", 2, "2026-05-01T00:00:00.000Z"),
      proposal("early", 2, "2026-01-01T00:00:00.000Z"),
    ]);

    expect(ranked.map((p) => p.id)).toEqual(["early", "late"]);
  });
});
