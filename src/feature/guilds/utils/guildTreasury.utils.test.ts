import { describe, expect, it } from "vitest";

import { rankDepositors, readTreasury } from "./guildTreasury.utils";

describe("readTreasury", () => {
  it("reads what the guild is holding, and who filled it", () => {
    const treasury = readTreasury({
      treasury: { fame: 640, deposits: { a: 400, b: 240 }, spent: 500 },
    });

    expect(treasury).toEqual({
      fame: 640,
      deposits: { a: 400, b: 240 },
      spent: 500,
    });
  });

  it("reads a guild founded before the treasury existed as an empty one", () => {
    expect(readTreasury({})).toEqual({ fame: 0, deposits: {}, spent: 0 });
    expect(readTreasury(undefined)).toEqual({
      fame: 0,
      deposits: {},
      spent: 0,
    });
  });

  it("never reads a balance as a debt", () => {
    // A corrupt document must not leave a guild owing Fame it cannot practise
    // its way out of.
    expect(readTreasury({ treasury: { fame: -900 } }).fame).toBe(0);
    expect(readTreasury({ treasury: { spent: -5 } }).spent).toBe(0);
  });

  it("survives junk where numbers should be", () => {
    const treasury = readTreasury({
      treasury: { fame: "lots", deposits: "nobody", spent: NaN },
    });

    expect(treasury).toEqual({ fame: 0, deposits: {}, spent: 0 });
  });

  it("drops deposits that are not worth naming anybody for", () => {
    const treasury = readTreasury({
      treasury: { fame: 10, deposits: { a: 10, b: 0, c: -3, d: "x" } },
    });

    expect(treasury.deposits).toEqual({ a: 10 });
  });
});

describe("rankDepositors", () => {
  it("names whoever put the most in first", () => {
    const ranked = rankDepositors(
      readTreasury({ treasury: { deposits: { a: 100, b: 900, c: 400 } } }),
    );

    expect(ranked.map((entry) => entry.uid)).toEqual(["b", "c", "a"]);
  });

  it("has nothing to say about a treasury nobody has filled", () => {
    expect(rankDepositors(readTreasury({}))).toEqual([]);
  });
});
