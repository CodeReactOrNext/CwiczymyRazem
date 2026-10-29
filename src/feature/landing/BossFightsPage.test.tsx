// @vitest-environment jsdom

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// next/font/google only works inside the Next compiler; outside it the export
// is a plain object, so hand the page the variable class it expects.
vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({
    variable: "--font-jakarta-landing",
    className: "",
  }),
}));

import { BOSSES } from "feature/bosses/data/bosses";
import { BOONS } from "feature/bosses/utils/boons";
import { dealPhase } from "feature/bosses/utils/bossEngine";
import { DIFFICULTY } from "feature/bosses/utils/difficulty";
import { safeNextPath } from "utils/auth/safeNextPath";

import { BossFightsPage } from "./BossFightsPage";
import {
  BOSS_FIGHTS_APP_PATH,
  BOSS_FIGHTS_CTA_HREF,
  BOSS_FIGHTS_META,
  bossFightsFaqs,
} from "./data/bossFights";
import { buildBossFightsProps, LADDER_SEED } from "./lib/bossFightsProps";

const props = buildBossFightsProps();
const html = renderToString(<BossFightsPage {...props} />);

describe("boss fights landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(BOSS_FIGHTS_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(BOSS_FIGHTS_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(bossFightsFaqs(props.numbers).length).toBeGreaterThanOrEqual(3);
  });

  it("sends the CTA through sign-up to the lair", () => {
    const next = new URLSearchParams(BOSS_FIGHTS_CTA_HREF.split("?")[1]).get(
      "next",
    );
    expect(safeNextPath(next)).toBe(BOSS_FIGHTS_APP_PATH);
    expect(html).toContain(BOSS_FIGHTS_CTA_HREF.replace(/&/g, "&amp;"));
  });

  it("shows every boss and every boon, with no copy left uninterpolated", () => {
    expect(props.bosses.map((boss) => boss.id)).toEqual(
      BOSSES.map((boss) => boss.id),
    );
    expect(props.boons.map((boon) => boon.id).sort()).toEqual(
      BOONS.map((boon) => boon.id).sort(),
    );
    for (const boon of props.boons) expect(html).toContain(boon.name);
    // Boons and rules are shared by all three bosses; only a boss's own pitch may name it.
    const shared = [
      ...props.boons.map((b) => b.body),
      ...props.rules.map((r) => r.body),
    ];
    for (const text of [...shared, ...props.bosses.map((b) => b.pitch)])
      expect(text).not.toMatch(/\{\{|\}\}/);
    for (const text of shared) expect(text).not.toMatch(/the spider/i);
  });

  it("replays a hero run that clears phase 1 strike by strike", () => {
    const { frames, bossMaxHp, next } = props.hero;
    expect(frames.at(-1)?.bossHp).toBe(0);
    const dealt = frames.reduce((sum, frame) => sum + (frame.strike ?? 0), 0);
    expect(dealt).toBe(bossMaxHp);
    expect(frames.some((frame) => frame.bite !== null)).toBe(true);
    expect(next.phase).toBe(2);
    expect(next.draft).toEqual(props.deals[0]);
  });

  it("lists the phases the generators deal, gates every fifth", () => {
    for (const ladder of props.ladders) {
      const kind = BOSSES.find((boss) => boss.id === ladder.id)!.drill;
      ladder.phases.forEach((phase, index) => {
        const plan = dealPhase(kind, LADDER_SEED, index);
        expect(phase.bpm).toBe(plan.variation.bpm);
        expect(phase.hp).toBe(plan.rules.bossHp);
        expect(phase.gate).toBe(phase.phase % 5 === 0);
      });
    }
  });

  it("words the difficulties the way the table defines them", () => {
    // The FAQ says Easy scores half and Brutal double.
    expect(DIFFICULTY.easy.reward).toBe(0.5);
    expect(DIFFICULTY.brutal.reward).toBe(2);
  });
});
