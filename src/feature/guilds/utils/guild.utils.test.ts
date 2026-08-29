import { describe, expect, it } from "vitest";

import {
  checkGuildName,
  checkGuildTag,
  GUILD_NAME_MAX,
  GUILD_TAG_MAX,
  guildSlug,
  normaliseTag,
} from "./guild.utils";

describe("guildSlug", () => {
  it("is the same for names nobody could tell apart", () => {
    expect(guildSlug("Riff Raiders")).toBe("riff-raiders");
    expect(guildSlug("  riff   raiders  ")).toBe("riff-raiders");
    expect(guildSlug("RIFF RAIDERS")).toBe("riff-raiders");
  });

  it("folds accents, so two spellings cannot both be taken", () => {
    expect(guildSlug("Głośni")).toBe(guildSlug("Glosni"));
    expect(guildSlug("Żółte Gitary")).toBe("zolte-gitary");
  });

  it("drops punctuation without leaving stray dashes", () => {
    expect(guildSlug("The Riff — Raiders!")).toBe("the-riff-raiders");
    expect(guildSlug("...Slash...")).toBe("slash");
  });

  it("returns nothing for a name with no letters at all", () => {
    expect(guildSlug("!!!")).toBe("");
    expect(guildSlug("   ")).toBe("");
  });
});

describe("normaliseTag", () => {
  it("stores tags one way", () => {
    expect(normaliseTag("rif")).toBe("RIF");
    expect(normaliseTag(" r i f ")).toBe("RIF");
    expect(normaliseTag("r-i-f!")).toBe("RIF");
  });
});

describe("checkGuildName", () => {
  it("accepts an ordinary name", () => {
    expect(checkGuildName("Riff Raiders")).toBeNull();
  });

  it("rejects one too short or too long", () => {
    expect(checkGuildName("ab")).toBe("too-short");
    expect(checkGuildName("  a  ")).toBe("too-short");
    expect(checkGuildName("x".repeat(GUILD_NAME_MAX + 1))).toBe("too-long");
  });

  it("rejects a name that would slug down to nothing", () => {
    // It would otherwise be stored under an empty document id.
    expect(checkGuildName("!!!!")).toBe("no-letters");
  });
});

describe("checkGuildTag", () => {
  it("accepts a short tag", () => {
    expect(checkGuildTag("RIF")).toBeNull();
    expect(checkGuildTag("r1")).toBeNull();
  });

  it("measures the tag after stripping what it will not keep", () => {
    // "r-!" normalises to "R", which is below the floor.
    expect(checkGuildTag("r-!")).toBe("too-short");
    expect(checkGuildTag("A".repeat(GUILD_TAG_MAX + 1))).toBe("too-long");
  });
});
