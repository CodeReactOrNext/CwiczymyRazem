import { describe, expect, it } from "vitest";

import type { BossFightState } from "./bossEngine";
import {
  applyJudgement,
  COUNTER_CHARGE,
  createFight,
  endPhaseBreak,
  fightAccuracy,
  fightMultiplier,
  hitPoints,
  isRegenerating,
  isSlamComing,
  isWeakSpotOpen,
  isWebbed,
  MAX_MULTIPLIER_STREAK,
  PARRY_STREAK,
  PHASE_HEAL,
  phaseBpm,
  phaseNumber,
  pickBoon,
  rerollDraft,
  SLAM_DAMAGE,
  streakMultiplier,
} from "./bossEngine";
import { fightWith,FIXTURE_RULES, FIXTURE_SEED } from "./fightFixtures";
import { generatePhase } from "./phaseGenerator";

const SEED = FIXTURE_SEED;
const RULES = FIXTURE_RULES;

type Note = Parameters<typeof applyJudgement>[1];
const hit = (grade: 1 | 2 | 3 = 3, perfect = false): Note => ({ hit: true, grade, perfect });
const miss: Note = { hit: false, grade: null, perfect: false };
const hits = (n: number, grade: 1 | 2 | 3 = 3) => Array.from({ length: n }, () => hit(grade));
const play = (state: BossFightState, notes: Note[]) => notes.reduce(applyJudgement, state);

describe("sword", () => {
  it("charges by timing grade, 4 when dead on", () => {
    expect(hitPoints(1, false)).toBe(1);
    expect(hitPoints(3, true)).toBe(4);
    const s = play(fightWith(), [hit(3), hit(2), hit(1)]);
    expect(s.charge).toBe(6);
    expect(s.bossHp).toBe(100);
  });

  it("strikes once full, harder on a longer streak", () => {
    const s = play(fightWith(), hits(3));
    const damage = Math.round(9 * streakMultiplier(3));
    expect(s.lastStrike).toEqual({ damage, multiplier: streakMultiplier(3) });
    expect(s.bossHp).toBe(100 - damage);
    expect(s.totalDamage).toBe(damage);
    expect(s.charge).toBe(0);
  });

  it("shatters the charge on a miss", () => {
    const s = play(fightWith(), [hit(3), hit(3), miss]);
    expect(s.charge).toBe(0);
    expect(s.shatterTick).toBe(1);
    expect(s.combo).toBe(0);
  });

  it("scales the multiplier from ×1 to ×2 and no further", () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(MAX_MULTIPLIER_STREAK / 2)).toBe(1.5);
    expect(streakMultiplier(MAX_MULTIPLIER_STREAK * 3)).toBe(2);
  });
});

describe("phases", () => {
  it("never end the fight: an empty phase breaks into the next one", () => {
    const s = play(fightWith({ bossHp: 9 }), hits(3));
    expect(s.outcome).toBeNull();
    expect(phaseNumber(s)).toBe(2);
    expect(s.plan).toEqual(generatePhase(SEED, 1));
    expect(s.bossHp).toBe(s.plan.rules.bossHp);
    expect(s.bossMaxHp).toBe(s.plan.rules.bossHp);
    expect(s.totalDamage).toBe(9);
    expect(s.phaseTick).toBe(1);
    expect(s.holding).toBe(true);
  });

  it("remember the phase just cleared and its tempo, for the briefing", () => {
    const before = fightWith({ bossHp: 9 });
    const s = play(before, hits(3));
    expect(s.previousPlan).toEqual(before.plan);
    expect(s.previousBpm).toBe(phaseBpm(before));
  });

  it("heal the player at every break, up to full", () => {
    const hurt = { ...fightWith({ bossHp: 9 }), playerHp: 50 };
    expect(play(hurt, hits(3)).playerHp).toBe(50 + PHASE_HEAL);
    const nearlyFull = { ...fightWith({ bossHp: 9 }), playerHp: 95 };
    const healed = play(nearlyFull, hits(3));
    expect(healed.playerHp).toBe(100);
    expect(healed.lastHeal).toBe(5);
  });

  it("take no notes while the boss changes form", () => {
    const held = play(fightWith({ bossHp: 9 }), hits(3));
    expect(play(held, [miss, miss, hit()])).toBe(held);
  });

  it("start the next one with a broken streak", () => {
    const held = play(fightWith({ bossHp: 9 }), hits(3));
    const next = endPhaseBreak(held);
    expect(next.holding).toBe(false);
    expect(next.combo).toBe(0);
    expect(endPhaseBreak(next)).toBe(next);
  });
});

describe("bites", () => {
  it("cost HP on every miss", () => {
    const s = play(fightWith(), [miss, miss]);
    expect(s.playerHp).toBe(80);
    expect(s.biteTick).toBe(2);
  });

  it("hurt more once the phase is in its last stretch", () => {
    const s = play(fightWith({ bossHp: 30, chargeMax: 3 }), hits(8));
    expect(s.enraged).toBe(true);
    expect(play(s, [miss]).lastBite).toBe(15);
  });

  it("poison the sword when the spider is venomous", () => {
    const s = play(fightWith({}, { affixes: ["venom"] }), [miss]);
    expect(s.poisonedNotes).toBe(RULES.venomNotes);
    const charged = play(s, [hit(3)]);
    expect(charged.charge).toBe(2);
    expect(charged.poisonedNotes).toBe(RULES.venomNotes - 1);
    const cured = play(charged, hits(RULES.venomNotes - 1, 1));
    expect(cured.poisonedNotes).toBe(0);
  });
});

describe("weak spots", () => {
  it("open on a count and double the sword's charge while open", () => {
    const s = play(fightWith({ weakSpotEvery: 2, chargeMax: 99 }, { weakSpots: true }), [hit(1), hit(1)]);
    expect(isWeakSpotOpen(s)).toBe(true);
    const charged = play(s, [hit(3)]);
    expect(charged.charge - s.charge).toBe(6);
    const closed = play(charged, hits(2, 1));
    expect(isWeakSpotOpen(closed)).toBe(false);
  });
});

describe("web", () => {
  it("covers the tab on a count, and notes played on time tear it faster", () => {
    const s = play(fightWith({ webEvery: 2, webLength: 4, chargeMax: 99 }, { affixes: ["web"] }), [hit(1), hit(1)]);
    expect(isWebbed(s)).toBe(true);
    expect(s.webNotes).toBe(4);
    const torn = play(s, [hit(3)]);
    expect(torn.webNotes).toBe(2);
    const gone = play(torn, [hit(1), miss]);
    expect(isWebbed(gone)).toBe(false);
  });

  it("never comes without the power", () => {
    const s = play(fightWith({ webEvery: 2 }), hits(10, 1));
    expect(isWebbed(s)).toBe(false);
  });
});

describe("regeneration", () => {
  it("heals the boss while it goes unstruck", () => {
    const s = { ...fightWith({}, { affixes: ["regen"] }), bossHp: 50 };
    const after = play(s, [miss, miss]);
    expect(isRegenerating(after)).toBe(false);
    expect(after.bossHp).toBe(50);
    const healing = play(after, [miss]);
    expect(isRegenerating(healing)).toBe(true);
    expect(healing.bossHp).toBe(52);
  });
});

describe("slams", () => {
  const rules = { slamEvery: 6, slamWindup: 2 };
  const threats = { slams: true };

  it("warn before they land", () => {
    const s = play(fightWith(rules, threats), hits(3, 1));
    expect(isSlamComing(s)).toBe(false);
    expect(isSlamComing(play(s, [hit(1)]))).toBe(true);
  });

  it("land on a player off their streak", () => {
    const s = play(fightWith(rules, threats), [hit(1), hit(1), hit(1), hit(1), miss, hit(1)]);
    expect(s.lastSlam).toEqual({ blocked: false, damage: SLAM_DAMAGE });
    expect(s.playerHp).toBe(100 - 10 - SLAM_DAMAGE);
    expect(s.playerHurtTick).toBe(2);
  });

  it("are blocked by a streak, and the block charges the sword", () => {
    const s = play(fightWith(rules, threats), hits(6, 1));
    expect(s.combo).toBeGreaterThanOrEqual(PARRY_STREAK);
    expect(s.lastSlam).toEqual({ blocked: true, damage: 0 });
    expect(s.blocks).toBe(1);
    expect(s.playerHp).toBe(100);
    expect(6 + Math.round(9 * COUNTER_CHARGE)).toBeGreaterThanOrEqual(9);
    expect(s.strikes).toBe(1);
  });

  it("stay away until their phase", () => {
    const s = play(fightWith(rules), hits(12, 1));
    expect(s.slamTick).toBe(0);
  });
});

describe("outcome", () => {
  it("is a loss when HP runs out, and nothing counts after", () => {
    const s = play(fightWith(), Array.from({ length: 10 }, () => miss));
    expect(s.outcome).toBe("lost");
    expect(applyJudgement(s, hit())).toBe(s);
  });
});

describe("createFight", () => {
  it("deals the run's first phase from its seed", () => {
    const s = createFight(SEED);
    expect(s.plan).toEqual(generatePhase(SEED, 0));
    expect(s.bossHp).toBe(s.plan.rules.bossHp);
    expect(phaseNumber(s)).toBe(1);
  });
});

describe("fightAccuracy", () => {
  it("is the share of notes hit", () => {
    expect(fightAccuracy({ hits: 0, misses: 0 })).toBe(0);
    expect(fightAccuracy({ hits: 3, misses: 1 })).toBe(75);
  });
});

describe("draft", () => {
  it("is dealt at every phase break, and a reroll deals it again", () => {
    const held = play(fightWith({ bossHp: 9 }), hits(3));
    expect(held.draft).toHaveLength(3);
    expect(held.rerollsLeft).toBe(1);
    const rerolled = rerollDraft(held);
    expect(rerolled.rerollsLeft).toBe(0);
    expect(rerollDraft(rerolled)).toBe(rerolled);
  });

  it("takes only a card on offer, and closes the draft", () => {
    const held = play(fightWith({ bossHp: 9 }), hits(3));
    const card = held.draft![0];
    const notOffered = (["armor", "bandage", "blade", "momentum"] as const).find(
      (id) => !held.draft!.includes(id),
    )!;
    expect(pickBoon(held, notOffered)).toBe(held);
    const picked = pickBoon(held, card);
    expect(picked.boons[card]).toBe(1);
    expect(picked.draft).toBeNull();
  });
});

/** A running fight that holds the given boons — as if they had been drafted. */
const boosted = (state: BossFightState, ...ids: Parameters<typeof pickBoon>[1][]) =>
  ids.reduce((s, id) => pickBoon({ ...s, draft: [id] }, id), state);

describe("boons", () => {
  it("armor softens bites", () => {
    expect(play(boosted(fightWith(), "armor"), [miss]).lastBite).toBe(8);
    expect(play(boosted(fightWith(), "armor", "armor"), [miss]).lastBite).toBe(6);
  });

  it("a shield soaks up bites", () => {
    const s = play(boosted(fightWith(), "shield"), [miss, miss, miss, miss]);
    expect(s.playerHp).toBe(90);
    expect(s.shieldCharges).toBe(0);
  });

  it("second wind forgives misses outright", () => {
    const s = play(boosted(fightWith(), "secondWind"), [hit(), hit(), miss, miss]);
    expect(s.playerHp).toBe(100);
    expect(s.combo).toBe(2);
    expect(s.charge).toBe(6);
    expect(s.lastBiteCaught).toBe("secondWind");
    expect(play(s, [miss]).playerHp).toBe(90);
  });

  it("vitality and a bandage heal", () => {
    const hurt = { ...fightWith(), playerHp: 40 };
    const vital = boosted(hurt, "vitality");
    expect(vital.playerMaxHp).toBe(120);
    expect(vital.playerHp).toBe(60);
    expect(boosted(hurt, "bandage").playerHp).toBe(75);
  });

  it("a sharp blade and overdrive hit harder", () => {
    const plain = play(fightWith(), hits(3)).lastStrike!.damage;
    expect(play(boosted(fightWith(), "blade"), hits(3)).lastStrike!.damage).toBeGreaterThan(plain);
    expect(play(boosted(fightWith(), "overdrive"), hits(3)).lastStrike!.damage).toBeGreaterThan(plain);
  });

  it("a light blade needs fewer points", () => {
    expect(boosted(fightWith({ chargeMax: 30 }), "lightBlade").chargeMax).toBe(24);
  });

  it("precision makes dead-on notes worth 6", () => {
    expect(play(boosted(fightWith({ chargeMax: 99 }), "precision"), [hit(3, true)]).charge).toBe(6);
  });

  it("momentum reaches the double multiplier sooner", () => {
    const fast = boosted({ ...fightWith(), combo: 24 }, "momentum");
    expect(fightMultiplier(fast)).toBe(2);
    expect(fightMultiplier({ ...fightWith(), combo: 24 })).toBe(1.5);
  });

  it("steady hand blocks a slam on a short streak", () => {
    const rules = { slamEvery: 3, slamWindup: 1 };
    const s = play(boosted(fightWith(rules, { slams: true }), "steadyHand"), [miss, hit(1), hit(1)]);
    expect(s.lastSlam?.blocked).toBe(true);
  });

  it("an antidote keeps venom out", () => {
    const s = play(boosted(fightWith({}, { affixes: ["venom"] }), "antidote"), [miss]);
    expect(s.poisonedNotes).toBe(0);
  });

  it("clear sight halves the web", () => {
    const s = play(
      boosted(fightWith({ webEvery: 1, webLength: 4 }, { affixes: ["web"] }), "clearSight"),
      [hit(1)],
    );
    expect(s.webNotes).toBe(2);
  });

  it("exploit makes weak spots charge ×3", () => {
    const s = play(
      boosted(fightWith({ weakSpotEvery: 1, chargeMax: 99 }, { weakSpots: true }), "exploit"),
      [hit(1)],
    );
    expect(play(s, [hit(3)]).charge - s.charge).toBe(9);
  });

  it("lifesteal heals on every strike", () => {
    const s = play(boosted({ ...fightWith(), playerHp: 50 }, "lifesteal"), hits(3));
    expect(s.playerHp).toBe(52);
  });

  it("thorns hurt the spider on every bite, but never end the phase", () => {
    expect(play(boosted(fightWith({ bossHp: 500 }), "thorns"), [miss]).bossHp).toBe(490);
    expect(play(boosted({ ...fightWith(), bossHp: 1 }, "thorns"), [miss]).bossHp).toBe(1);
  });

  it("slow down and overdrive move the phase's tempo", () => {
    const base = fightWith().plan.variation.bpm;
    expect(phaseBpm(boosted(fightWith(), "slowDown"))).toBe(Math.max(50, base - 5));
    expect(phaseBpm(boosted(fightWith(), "overdrive"))).toBe(Math.min(200, base + 10));
  });
});
