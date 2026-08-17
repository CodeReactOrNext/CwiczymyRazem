import { describe, expect, it } from "vitest";

import {
  cumulativeRigFame,
  formatRigFameRate,
  getRigFameRate,
  RIG_FAME_HOURLY_CEILING,
} from "./rigFame";

describe("getRigFameRate", () => {
  it("pays nothing without a rig", () => {
    expect(getRigFameRate(0)).toBe(0);
    expect(getRigFameRate(-50)).toBe(0);
    expect(getRigFameRate(NaN)).toBe(0);
  });

  it("follows the published table", () => {
    // The numbers the design was signed off on — 1 decimal, as the UI prints it.
    expect(getRigFameRate(100).toFixed(1)).toBe("28.5");
    expect(getRigFameRate(150).toFixed(1)).toBe("38.6");
    expect(getRigFameRate(200).toFixed(1)).toBe("47.9");
    expect(getRigFameRate(400).toFixed(1)).toBe("80.5");
    expect(getRigFameRate(750).toFixed(1)).toBe("129.0");
  });

  it("keeps paying for the top of the ladder", () => {
    // The whole reason the hyperbolic shape was dropped: 500 → 750 has to be
    // worth real Fame, not the ~2/h an asymptote left it with.
    const gain = getRigFameRate(750) - getRigFameRate(500);

    expect(gain).toBeGreaterThan(15);
  });

  it("moves on every single level — no tiers", () => {
    for (const level of [100, 250, 473, 600]) {
      expect(getRigFameRate(level + 1)).toBeGreaterThan(getRigFameRate(level));
    }
  });

  it("never goes backwards", () => {
    for (let level = 1; level <= 1200; level++) {
      expect(getRigFameRate(level)).toBeGreaterThanOrEqual(getRigFameRate(level - 1));
    }
  });

  it("has diminishing but never dead returns", () => {
    const low = getRigFameRate(101) - getRigFameRate(100);
    const high = getRigFameRate(751) - getRigFameRate(750);

    expect(high).toBeLessThan(low);
    // At the top of the ladder a level is still worth more than half what it is
    // at the average rig — the property the tiered and hyperbolic shapes lost.
    expect(high).toBeGreaterThan(low * 0.5);
  });

  it("clamps an absurd rig to the ceiling", () => {
    expect(getRigFameRate(1_000_000)).toBe(RIG_FAME_HOURLY_CEILING);
  });

  it("leaves today's top rig well under the ceiling", () => {
    // The ceiling is a backstop against uncapped buildLevel, not a balance lever.
    expect(getRigFameRate(750)).toBeLessThan(RIG_FAME_HOURLY_CEILING);
  });
});

describe("cumulativeRigFame", () => {
  it("pays nothing without a rig", () => {
    expect(cumulativeRigFame(60, 0)).toBe(0);
  });

  it("pays nothing for an empty session", () => {
    expect(cumulativeRigFame(0, 750)).toBe(0);
  });

  it("follows the published table for a typical rig", () => {
    expect(cumulativeRigFame(5, 400)).toBe(7);
    expect(cumulativeRigFame(15, 400)).toBe(20);
    expect(cumulativeRigFame(25, 400)).toBe(34);
    expect(cumulativeRigFame(30, 400)).toBe(40);
    expect(cumulativeRigFame(60, 400)).toBe(80);
  });

  it("pays an hour of practice exactly the rate it advertises", () => {
    // The property the minutes cap broke, and the reason it was removed: a rig
    // whose card reads "30.1 Fame/h" has to hand back 30 for an hour practised.
    for (const level of [150, 400, 750]) {
      expect(cumulativeRigFame(60, level)).toBe(
        Math.round(getRigFameRate(level))
      );
    }
  });

  it("keeps paying past an hour, in proportion to the time", () => {
    // No taper: unlike the practice curve this is linear all the way out, which
    // is the trade the removed cap was buying. Checked against the exact rate
    // rather than a multiple of the rounded hour, which rounding shifts by one.
    const rate = getRigFameRate(750);

    expect(cumulativeRigFame(120, 750)).toBe(Math.round(rate * 2));
    expect(cumulativeRigFame(240, 750)).toBe(Math.round(rate * 4));
  });

  it("never goes backwards", () => {
    for (let minutes = 1; minutes <= 120; minutes++) {
      expect(cumulativeRigFame(minutes, 400)).toBeGreaterThanOrEqual(
        cumulativeRigFame(minutes - 1, 400)
      );
    }
  });

  it("treats negative minutes as zero", () => {
    expect(cumulativeRigFame(-30, 750)).toBe(0);
  });

  it("gives splitters no advantage over one session", () => {
    const steps = [10, 20, 30, 40, 50, 60];
    let previous = 0;
    let total = 0;

    for (const minutes of steps) {
      total += cumulativeRigFame(minutes, 600) - cumulativeRigFame(previous, 600);
      previous = minutes;
    }

    expect(total).toBe(cumulativeRigFame(60, 600));
  });

  it("scales with the rig at a fixed session length", () => {
    expect(cumulativeRigFame(25, 750)).toBeGreaterThan(cumulativeRigFame(25, 400));
    expect(cumulativeRigFame(25, 400)).toBeGreaterThan(cumulativeRigFame(25, 150));
  });
});

describe("formatRigFameRate", () => {
  it("prints one decimal so every level shows", () => {
    expect(formatRigFameRate(473)).toBe("91.3");
    expect(formatRigFameRate(0)).toBe("0.0");
  });
});
