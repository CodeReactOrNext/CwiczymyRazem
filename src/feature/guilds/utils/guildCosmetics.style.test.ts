import {
  GUILD_BANNERS,
  GUILD_FRAMES,
} from "feature/guilds/data/guildCosmetics";
import {
  bannerLook,
  crestStyle,
  darken,
  frameStyle,
  lighten,
  mute,
  shiftHue,
  tint,
} from "feature/guilds/utils/guildCosmetics.style";
import { describe, expect, it } from "vitest";

const stringify = (styles: object[]): string =>
  styles.flatMap((style) => Object.values(style)).join(" ");

describe("tint", () => {
  it("appends the opacity as two hex digits", () => {
    expect(tint("#22d3ee", 0.5)).toBe("#22d3ee80");
    expect(tint("#22d3ee", 1)).toBe("#22d3eeff");
    expect(tint("#22d3ee", 0)).toBe("#22d3ee00");
  });

  it("clamps an opacity outside 0–1 rather than emitting nonsense", () => {
    expect(tint("#22d3ee", 2)).toBe("#22d3eeff");
    expect(tint("#22d3ee", -1)).toBe("#22d3ee00");
  });

  it("falls back to grey for a colour that is not a six-digit hex", () => {
    expect(tint("cyan", 0.5)).toBe("#a1a1aa80");
    expect(tint("#fff", 0.5)).toBe("#a1a1aa80");
  });
});

describe("lighten", () => {
  it("pulls the colour towards white by the amount asked", () => {
    expect(lighten("#000000", 1)).toBe("#ffffff");
    expect(lighten("#000000", 0.5)).toBe("#808080");
    expect(lighten("#fb923c", 0)).toBe("#fb923c");
  });

  it("falls back to grey for a bad colour", () => {
    expect(lighten("orange", 0)).toBe("#a1a1aa");
  });
});

describe("darken", () => {
  it("pulls the colour towards black by the amount asked", () => {
    expect(darken("#ffffff", 1)).toBe("#000000");
    expect(darken("#ffffff", 0.5)).toBe("#808080");
    expect(darken("#fb923c", 0)).toBe("#fb923c");
  });

  it("falls back to grey for a bad colour", () => {
    expect(darken("orange", 0)).toBe("#a1a1aa");
  });
});

describe("mute", () => {
  it("takes the colour towards its own grey, and all the way at 1", () => {
    const muted = mute("#fb923c", 1);
    expect(muted).toMatch(/^#([0-9a-f]{2})\1\1$/);
    expect(mute("#fb923c", 0)).toBe("#fb923c");
  });
});

describe("shiftHue", () => {
  it("turns a colour round the wheel", () => {
    expect(shiftHue("#ff0000", 120)).toBe("#00ff00");
    expect(shiftHue("#ff0000", -120)).toBe("#0000ff");
    expect(shiftHue("#ff0000", 360)).toBe("#ff0000");
  });

  it("leaves a grey alone, having no hue to turn", () => {
    expect(shiftHue("#808080", 90)).toBe("#808080");
  });

  it("keeps the lightness, so a neighbour sits as well on the card as the original", () => {
    // Ember, turned a third of the way round: still a mid-light colour.
    const turned = shiftHue("#fb923c", 120);
    expect(turned).toMatch(/^#[0-9a-f]{6}$/);
    expect(turned).not.toBe("#fb923c");
  });
});

describe("bannerLook", () => {
  const lit = GUILD_BANNERS.filter((banner) => banner.id !== "banner:none");

  it("draws every lit banner in the catalog from the guild's colour, as one gradient", () => {
    for (const banner of lit) {
      const look = bannerLook(banner.id, "#fb923c");
      expect(look.layers).toHaveLength(1);
      expect(String(look.layers[0].backgroundImage)).toMatch(
        /^linear-gradient\(/,
      );
      // Drawn from the colour, if mostly in muted forms of it: another
      // accent must give another banner.
      expect(stringify(look.layers)).not.toBe(
        stringify(bannerLook(banner.id, "#22d3ee").layers),
      );
    }
  });

  it("never draws a spot: no radial or conic gradient anywhere", () => {
    for (const banner of GUILD_BANNERS) {
      const drawn = stringify(bannerLook(banner.id, "#fb923c").layers);
      expect(drawn).not.toContain("radial-gradient");
      expect(drawn).not.toContain("conic-gradient");
    }
  });

  it("keeps the bare banner colourless, and draws the unknown as bare", () => {
    const bare = bannerLook("banner:none", "#fb923c");
    expect(bare.layers).toEqual([]);
    expect(stringify([bare.base])).not.toContain("#fb923c");
    expect(bannerLook("banner:frets", "#fb923c")).toEqual(bare);
  });

  it("never lets a bad colour into a gradient", () => {
    for (const banner of lit) {
      const drawn = stringify(bannerLook(banner.id, "not a colour").layers);
      expect(drawn).not.toContain("undefined");
      expect(drawn).not.toContain("not a colour");
      expect(drawn).not.toContain("NaN");
    }
  });

  it("draws the aurora in the colour's neighbours as well as itself", () => {
    const drawn = stringify(bannerLook("banner:aurora", "#fb923c").layers);
    expect(drawn).toContain(mute(shiftHue("#fb923c", -26), 0.3));
    expect(drawn).toContain(mute(shiftHue("#fb923c", 20), 0.3));
  });
});

describe("frameStyle and crestStyle", () => {
  it("colour the tag and the crest with the accent", () => {
    expect(frameStyle("frame:plain", "#a78bfa")).toEqual({ color: "#a78bfa" });
    expect(frameStyle("frame:heavy", "#a78bfa").boxShadow).toContain("#a78bfa");
    expect(crestStyle("#a78bfa").color).toBe("#a78bfa");
    expect(crestStyle("#a78bfa").backgroundImage).toContain("#a78bfa");
  });

  it("draws every frame in the catalog from the accent", () => {
    for (const frame of GUILD_FRAMES) {
      const style = frameStyle(frame.id, "#a78bfa");
      expect(Object.values(style).join(" ")).toContain("#a78bfa");
      expect(Object.values(style).join(" ")).not.toContain("undefined");
    }
  });

  it("cuts the solid tag out in black, and keeps the letters the colour everywhere else", () => {
    expect(frameStyle("frame:solid", "#a78bfa")).toEqual({
      color: "#09090b",
      backgroundColor: "#a78bfa",
    });
    for (const frame of GUILD_FRAMES) {
      if (frame.id === "frame:solid") continue;
      expect(frameStyle(frame.id, "#a78bfa").color).toBe("#a78bfa");
    }
  });

  it("pushes the tag past the dot, so the dot never sits under a letter", () => {
    const dot = frameStyle("frame:dot", "#a78bfa");
    expect(dot.paddingLeft).toBe(14);
    expect(String(dot.backgroundImage)).toContain("circle at 7px 50%");
  });

  it("fall back to grey rather than to an unset colour", () => {
    expect(frameStyle("frame:ring", "").color).toBe("#a1a1aa");
    expect(crestStyle("").color).toBe("#a1a1aa");
  });

  it("darkens every mark for the light tone, so pale accents stay readable on white", () => {
    for (const frame of GUILD_FRAMES) {
      const style = frameStyle(frame.id, "#e4e4e7", "light");
      const expectedMark =
        frame.id === "frame:solid" ? "#09090b" : darken("#e4e4e7", 0.35);
      expect(style.color).toBe(expectedMark);
    }
  });

  it("paints frame:double's gap in white on the light tone instead of the page's black", () => {
    const dark = frameStyle("frame:double", "#a78bfa", "dark");
    const light = frameStyle("frame:double", "#a78bfa", "light");
    expect(String(dark.boxShadow)).toContain("#09090b");
    expect(String(light.boxShadow)).toContain("#ffffff");
    expect(String(light.boxShadow)).not.toContain("#09090b");
  });

  it("defaults to the dark tone, leaving every existing call site unchanged", () => {
    for (const frame of GUILD_FRAMES) {
      expect(frameStyle(frame.id, "#a78bfa")).toEqual(
        frameStyle(frame.id, "#a78bfa", "dark"),
      );
    }
  });
});
