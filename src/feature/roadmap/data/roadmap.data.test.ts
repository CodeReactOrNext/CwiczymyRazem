import { readFileSync } from "fs";
import { SUPPORTED_LOCALES } from "lib/i18n/locales";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { ROADMAP_TIERS } from "./roadmap.data";

const EXERCISE_PACK = "+3 New Exercises";
const GEAR_PACK = "+15 New Guitars & Pedals";
const ACHIEVEMENT_PACK = "+5 New Achievements";

/** Packs translate by shape (`tiers.content.*`); every other label by tier id. */
const isPack = (label: string) =>
  label === EXERCISE_PACK || label === GEAR_PACK || label === ACHIEVEMENT_PACK;

type TierCopy = { label?: string; description?: string; topic?: string };

const supporterTiers = (locale: string): Record<string, TierCopy> =>
  JSON.parse(
    readFileSync(
      join(__dirname, "../../../../public/locales", locale, "supporter.json"),
      "utf8",
    ),
  ).tiers;

describe("ROADMAP_TIERS", () => {
  it("derives every goal as the running sum of the step costs", () => {
    let total = 0;
    for (const tier of ROADMAP_TIERS) {
      expect(tier.cost).toBeGreaterThan(0);
      total += tier.cost;
      expect(tier.goal).toBe(total);
    }
  });

  it("gives every tier its own id", () => {
    const ids = ROADMAP_TIERS.map((tier) => tier.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ships exercises three at a time, each pack with its topic", () => {
    const packs = ROADMAP_TIERS.filter((tier) =>
      tier.label.includes("Exercise"),
    );
    expect(packs.length).toBeGreaterThan(0);
    for (const pack of packs) {
      expect(pack.label).toBe(EXERCISE_PACK);
      expect(pack.topic, pack.id).toBeTruthy();
    }
  });

  it("ships guitars and pedals fifteen at a time", () => {
    const packs = ROADMAP_TIERS.filter((tier) =>
      tier.label.includes("Guitars"),
    );
    expect(packs.length).toBeGreaterThan(0);
    for (const pack of packs) {
      expect(pack.label).toBe(GEAR_PACK);
      expect(pack.topic, pack.id).toBeTruthy();
    }
  });

  it("ships achievements five at a time", () => {
    const packs = ROADMAP_TIERS.filter((tier) =>
      tier.label.includes("Achievement"),
    );
    expect(packs.length).toBeGreaterThan(0);
    for (const pack of packs) expect(pack.label).toBe(ACHIEVEMENT_PACK);
  });

  it("matches the English catalog word for word", () => {
    const en = supporterTiers("en");
    for (const tier of ROADMAP_TIERS) {
      const copy = en[tier.id];
      if (tier.topic) expect(copy?.topic, tier.id).toBe(tier.topic);
      if (!isPack(tier.label)) expect(copy?.label, tier.id).toBe(tier.label);
      if (tier.description) {
        expect(copy?.description, tier.id).toBe(tier.description);
      }
    }
  });

  it.each(SUPPORTED_LOCALES.map(({ code }) => code))(
    "has every topic, label and description translated in %s",
    (locale) => {
      const tiers = supporterTiers(locale);
      for (const tier of ROADMAP_TIERS) {
        const copy = tiers[tier.id];
        if (tier.topic)
          expect(copy?.topic, `${locale} ${tier.id}`).toBeTruthy();
        if (!isPack(tier.label)) {
          expect(copy?.label, `${locale} ${tier.id}`).toBeTruthy();
        }
        if (tier.description) {
          expect(copy?.description, `${locale} ${tier.id}`).toBeTruthy();
        }
      }
    },
  );
});
