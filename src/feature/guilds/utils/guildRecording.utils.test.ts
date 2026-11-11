import {
  getRecordingContract,
  getRecordingTier,
  RECORDING_BANK_PAY,
  RECORDING_CONTRACTS,
  RECORDING_FULL_SHARE_TAKES,
  RECORDING_GEAR,
  RECORDING_MEMBER_PAY,
  RECORDING_MIN_TAKES_FOR_PAY,
  RECORDING_MOODS,
  RECORDING_TAKES_PER_DAY,
  RECORDING_TAPE_CAP,
  RECORDING_TIERS,
  sessionBpm,
  sessionParts,
} from "feature/guilds/data/guildRecording";
import { STUDIO_ITEMS } from "feature/guilds/data/guildStudio";
import type {
  RecordingSession,
  RecordingShelf,
} from "feature/guilds/utils/guildRecording.utils";
import {
  canDeliver,
  checkBooking,
  clientMood,
  drawClient,
  isSessionOver,
  isTierUnlocked,
  judgeTake,
  layTake,
  memberShare,
  openSession,
  readSession,
  readShelf,
  recordingPerkOf,
  recordingPerks,
  sessionFee,
  sessionStanding,
  sessionView,
  settleSession,
  shelfKey,
  shelve,
  takesLeft,
  tierPayout,
  tierViews,
} from "feature/guilds/utils/guildRecording.utils";
import { describe, expect, it } from "vitest";

const EMPTY = recordingPerks({ roomLevel: 1, items: {} });
const NOW = new Date("2026-11-11T12:00:00Z");
// The numbers below come off the balance table, so a rebalance moves them
// here too: these tests are about the rules, not about what a tier costs.
const T1 = getRecordingTier(1);
const T6 = getRecordingTier(6);
const BASE_TAKES = RECORDING_TAKES_PER_DAY;
const FULL = RECORDING_FULL_SHARE_TAKES;
const MIN = RECORDING_MIN_TAKES_FOR_PAY;
const GEAR = RECORDING_GEAR;
const pct = (value: number, percent: number) =>
  Math.round(value * (1 + percent / 100));
const DAY = "2026-11-11";

/** A seed that draws this client, so a test can name the parts it expects. */
const seedFor = (clientId: string): number => {
  for (let seed = 1; seed < 5000; seed++)
    if (drawClient(seed).id === clientId) return seed;
  throw new Error(`no seed draws ${clientId}`);
};
const RUST = seedFor("rust-buckets");
const rust = getRecordingContract("rust-buckets")!;

const fresh = (tier = 1): RecordingSession =>
  openSession(tier, {}, EMPTY, "ann", NOW, RUST);

/** A session with every part's tape at `fill` times its target. */
const filled = (fill: number, tier = 1): RecordingSession => {
  const session = fresh(tier);
  for (const id of Object.keys(session.targets))
    session.tape[id] = Math.round(session.targets[id] * fill);
  return session;
};

const released = (tier: number): RecordingShelf => ({
  [tier]: { best: "record", count: 1, at: 1 },
});

describe("the clients", () => {
  it("are a pool of distinct clients, each with a band of its own", () => {
    const ids = RECORDING_CONTRACTS.map((contract) => contract.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(9);
    const bands = RECORDING_CONTRACTS.map((contract) => contract.band);
    expect(new Set(bands).size).toBe(bands.length);
    for (const contract of RECORDING_CONTRACTS) {
      const parts = contract.parts.map((part) => part.id);
      expect(new Set(parts).size).toBe(parts.length);
      expect(parts.length).toBeGreaterThanOrEqual(3);
      // Ids become Firestore field paths.
      for (const id of [contract.id, ...parts]) expect(id).toMatch(/^[a-z-]+$/);
    }
  });

  it("are drawn by the seed, any of them, but never the same one twice running", () => {
    const drawn = new Set<string>();
    for (let seed = 0; seed < 600; seed++) drawn.add(drawClient(seed).id);
    expect(drawn.size).toBe(RECORDING_CONTRACTS.length);

    expect(drawClient(RUST)).toBe(drawClient(RUST));
    for (let seed = 0; seed < 600; seed++)
      expect(drawClient(seed, "rust-buckets").id).not.toBe("rust-buckets");
  });
});

describe("the tiers", () => {
  it("are a ladder that gets harder and pays more with every step", () => {
    expect(RECORDING_TIERS.map((entry) => entry.tier)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    const rising = (values: number[], strictly = true) =>
      values.every(
        (value, i) =>
          i === 0 ||
          (strictly ? value > values[i - 1] : value >= values[i - 1]),
      );
    const of = <K extends keyof (typeof RECORDING_TIERS)[number]>(key: K) =>
      RECORDING_TIERS.map((entry) => entry[key] as number);
    // Harder: faster, longer tapes; never fewer parts or a simpler rhythm.
    expect(rising(of("tempo"))).toBe(true);
    expect(rising(of("tape"))).toBe(true);
    expect(rising(of("parts"), false)).toBe(true);
    expect(rising(of("density"), false)).toBe(true);
    // And worth it: the fee, the players' Fame and the cheque all climb.
    expect(rising(of("fee"))).toBe(true);
    expect(rising(of("fame"))).toBe(true);
    expect(
      rising(RECORDING_TIERS.map(({ tier }) => tierPayout(tier, EMPTY).bank)),
    ).toBe(true);
  });

  it("record more of the client, faster and busier, the higher they are", () => {
    const long = getRecordingContract("long-take")!;
    expect(sessionParts(long, 1).map((part) => part.id)).toEqual(
      long.parts.slice(0, 3).map((part) => part.id),
    );
    expect(sessionParts(long, 6)).toHaveLength(5);
    // No part of a low tier is busier than eighths.
    for (const contract of RECORDING_CONTRACTS) {
      for (const part of sessionParts(contract, 1))
        expect(part.density).toBeLessThanOrEqual(2);
      // The top tier plays every part as the client wrote it.
      expect(sessionParts(contract, 6)).toEqual(
        contract.parts.slice(0, 5).map((part) => ({ ...part })),
      );
      expect(sessionBpm(contract, 1)).toBeLessThan(contract.bpm);
      expect(sessionBpm(contract, 3)).toBe(contract.bpm);
      expect(sessionBpm(contract, 6)).toBeGreaterThan(contract.bpm);
    }
  });

  it("open one at a time: each needs a record out on the one before", () => {
    expect(isTierUnlocked(1, {})).toBe(true);
    expect(isTierUnlocked(2, {})).toBe(false);
    expect(isTierUnlocked(2, { 1: { best: "demo", count: 0, at: 1 } })).toBe(
      false,
    );
    expect(isTierUnlocked(2, released(1))).toBe(true);
    // A record on tier one does not skip ahead.
    expect(isTierUnlocked(3, released(1))).toBe(false);
  });

  it("are shown with what they cost and pay this guild today", () => {
    const views = tierViews(released(1), EMPTY);
    expect(views.map((view) => view.unlocked)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(views[0]).toMatchObject({
      tier: 1,
      fee: T1.fee,
      fame: T1.fame,
      bank: T1.fee * RECORDING_BANK_PAY.record,
      best: "record",
      count: 1,
    });
    expect(views[5]).toMatchObject({
      fee: T6.fee,
      fame: T6.fame,
      best: null,
    });
  });
});

describe("recordingPerks", () => {
  it("gives an empty garage two takes a day and nothing else", () => {
    expect(EMPTY).toEqual({
      takesPerDay: BASE_TAKES,
      sound: 0,
      tape: 0,
      desk: 0,
      walls: 0,
      bench: 0,
    });
  });

  it("adds up the room", () => {
    const perks = recordingPerks({
      roomLevel: 4,
      items: {
        amp: 2,
        drums: 1,
        sofa: 3,
        tape: 2,
        desk: 1,
        walls: 4,
        bench: 2,
      },
    });
    expect(perks).toEqual({
      // A level-3 sofa is past the first of its two steps.
      takesPerDay: BASE_TAKES + 1,
      sound: 3 * GEAR.sound.perLevel,
      tape: 2 * GEAR.tape.perLevel,
      desk: GEAR.desk.perLevel,
      walls: 4 * GEAR.walls.perLevel,
      bench: 2 * GEAR.bench.perLevel,
    });
    // The sofa gives its takes one step at a time.
    const sofa = (level: number) =>
      recordingPerks({ roomLevel: 4, items: { sofa: level } }).takesPerDay;
    expect([0, 1, 2, 3, 4].map(sofa)).toEqual(
      [0, 1, 2, 3, 4].map(
        (level) =>
          BASE_TAKES + GEAR.sofa.takesAt.filter((at) => level >= at).length,
      ),
    );
    expect(sofa(4)).toBe(BASE_TAKES + 2);
  });

  it("has a use for every piece but the weekly board", () => {
    const idle = STUDIO_ITEMS.filter((item) => !recordingPerkOf(item.id));
    expect(idle.map((item) => item.id)).toEqual(["board"]);
  });
});

describe("booking", () => {
  it("needs the tier open, the fee in the treasury and no session running", () => {
    expect(checkBooking(1, {}, EMPTY, 2_000, false)).toEqual({
      ok: true,
      fee: 2_000,
    });
    expect(checkBooking(1, {}, EMPTY, 1_500, false)).toEqual({
      ok: false,
      reason: "bank",
      fee: 2_000,
      short: 500,
    });
    expect(checkBooking(1, {}, EMPTY, 9_999, true)).toMatchObject({
      reason: "busy",
    });
    expect(checkBooking(2, {}, EMPTY, 9_999, false)).toMatchObject({
      reason: "locked",
    });
    expect(checkBooking(2, released(1), EMPTY, 4_000, false)).toMatchObject({
      ok: true,
      fee: 4_000,
    });
  });

  it("draws the client and opens the parts that tier records of them", () => {
    const session = fresh();
    expect(session).toMatchObject({
      tier: 1,
      contractId: "rust-buckets",
      seed: RUST,
      fee: 2_000,
    });
    expect(Object.keys(session.targets)).toEqual(
      sessionParts(rust, 1).map((part) => part.id),
    );
    expect(session.endsAt - session.openedAt).toBe(7 * 86_400_000);

    // The same seed after a session with that client draws somebody else.
    const next = openSession(1, {}, EMPTY, "ann", NOW, RUST, "rust-buckets");
    expect(next.contractId).not.toBe("rust-buckets");
  });

  it("is cheaper with a bench and shorter with a tape machine", () => {
    const perks = recordingPerks({
      roomLevel: 2,
      items: { bench: 2, tape: 2 },
    });
    const session = openSession(1, {}, perks, "ann", NOW, RUST);
    expect(session.fee).toBe(pct(T1.fee, -perks.bench));
    expect(session.fee).toBeLessThan(T1.fee);
    expect(sessionFee(6, perks)).toBe(pct(T6.fee, -perks.bench));
    expect(session.targets.riff).toBe(pct(T1.tape, -perks.tape));
    expect(session.targets.riff).toBeLessThan(T1.tape);
  });

  it("counts the lap from the records out on that tier", () => {
    const shelf: RecordingShelf = { 1: { best: "gold", count: 2, at: 1 } };
    expect(openSession(1, shelf, EMPTY, "ann", NOW, RUST).lap).toBe(3);
    expect(fresh().lap).toBe(1);
  });
});

describe("takes", () => {
  it("pays accuracy, scaled by tempo and the room", () => {
    const at = (bpm: number, accuracy = 90) =>
      judgeTake({ accuracy, bpm, notes: 80 }, 100, EMPTY);
    expect(at(100)).toEqual({ kept: true, tempo: 1, points: 90 });
    expect(at(50).points).toBe(45);
    // Faster pays more, up to the cap — and never past it.
    expect(at(130).points).toBe(117);
    expect(at(300).points).toBe(117);
    expect(at(10).points).toBe(45);

    const loud = recordingPerks({
      roomLevel: 4,
      items: { amp: 4, drums: 4, mic: 2 },
    });
    expect(
      judgeTake({ accuracy: 90, bpm: 100, notes: 80 }, 100, loud).points,
    ).toBe(pct(90, loud.sound));
    expect(loud.sound).toBeGreaterThan(0);
  });

  it("asks for more speed on a higher tier for the same points", () => {
    const take = { accuracy: 90, bpm: rust.bpm, notes: 80 };
    const low = judgeTake(take, sessionBpm(rust, 1), EMPTY).points;
    const high = judgeTake(take, sessionBpm(rust, 6), EMPTY).points;
    expect(low).toBeGreaterThan(high);
  });

  it("scraps a sloppy or a too-short take", () => {
    expect(
      judgeTake({ accuracy: 49, bpm: 92, notes: 80 }, 92, EMPTY),
    ).toMatchObject({ kept: false, points: 0 });
    expect(
      judgeTake({ accuracy: 100, bpm: 92, notes: 5 }, 92, EMPTY).kept,
    ).toBe(false);
    expect(
      judgeTake({ accuracy: 250, bpm: 92, notes: 80 }, 92, EMPTY).points,
    ).toBe(100);
  });

  it("counts a member's takes by the day", () => {
    let session = fresh();
    expect(takesLeft(session, "ann", EMPTY, NOW)).toBe(BASE_TAKES);
    session = layTake(session, "ann", "riff", 80, NOW);
    session = layTake(session, "ann", "bass", 70, NOW);
    expect(takesLeft(session, "ann", EMPTY, NOW)).toBe(BASE_TAKES - 2);
    expect(takesLeft(session, "bob", EMPTY, NOW)).toBe(BASE_TAKES);
    // Never below nothing, however many were laid down.
    let spent = session;
    for (let i = 0; i < BASE_TAKES + 2; i++)
      spent = layTake(spent, "ann", "hook", 1, NOW);
    expect(takesLeft(spent, "ann", EMPTY, NOW)).toBe(0);
    expect(session.crew.ann).toMatchObject({ takes: 2, points: 150, used: 2 });
    expect(session.tape).toMatchObject({ riff: 80, bass: 70, hook: 0 });

    const tomorrow = new Date("2026-11-12T00:01:00Z");
    expect(takesLeft(session, "ann", EMPTY, tomorrow)).toBe(BASE_TAKES);
    session = layTake(session, "ann", "riff", 60, tomorrow);
    expect(session.crew.ann).toMatchObject({ takes: 3, points: 210, used: 1 });
  });

  it("stops a tape at its cap", () => {
    const session = layTake(filled(2.4), "ann", "riff", 500, NOW);
    expect(session.tape.riff).toBe(
      Math.round(session.targets.riff * RECORDING_TAPE_CAP),
    );
  });
});

describe("standing", () => {
  it("rates the session by how full the tapes are", () => {
    expect(sessionStanding(fresh()).rating).toBe("shelved");
    expect(sessionStanding(filled(0.6)).rating).toBe("demo");
    expect(sessionStanding(filled(1))).toMatchObject({
      rating: "record",
      recorded: true,
      full: false,
    });
    expect(sessionStanding(filled(1.6)).rating).toBe("gold");
    expect(sessionStanding(filled(2.5))).toMatchObject({
      rating: "platinum",
      full: true,
    });
  });

  it("is no record while one part is short, however full the others are", () => {
    const session = filled(2.5);
    session.tape.bass = Math.round(session.targets.bass * 0.9);
    expect(sessionStanding(session)).toMatchObject({
      rating: "demo",
      recorded: false,
    });
  });

  it("ends when the week is up or the tape runs out", () => {
    expect(isSessionOver(filled(1), NOW)).toBe(false);
    expect(isSessionOver(filled(2.5), NOW)).toBe(true);
    expect(isSessionOver(fresh(), new Date(fresh().endsAt))).toBe(true);
  });

  it("lets only the booker or the founder hand a finished track over", () => {
    expect(canDeliver(filled(1), "ann", "zed")).toBe(true);
    expect(canDeliver(filled(1), "zed", "zed")).toBe(true);
    expect(canDeliver(filled(1), "bob", "zed")).toBe(false);
    expect(canDeliver(filled(0.9), "ann", "zed")).toBe(false);
  });

  it("tells the screen the session at the tier's tempo", () => {
    const view = sessionView(fresh(5), EMPTY, "ann", "zed", NOW, (uid) => ({
      displayName: uid,
      avatar: null,
    }))!;
    expect(view).toMatchObject({
      tier: 5,
      contractId: "rust-buckets",
      bpm: sessionBpm(rust, 5),
      me: { takes: 0, takesLeft: BASE_TAKES },
    });
    expect(view.parts.map((part) => part.id)).toEqual(
      sessionParts(rust, 5).map((part) => part.id),
    );
  });
});

describe("what is left, and what the client makes of it", () => {
  it("takes many takes to fill a tape", () => {
    // Before anybody has played: a decent take is the going rate.
    const standing = sessionStanding(fresh());
    expect(standing.takes).toBe(0);
    for (const part of standing.parts)
      expect(part.takesToGo).toBeGreaterThanOrEqual(6);
    expect(standing.next).toEqual({
      rating: "record",
      takes: standing.parts.reduce((sum, part) => sum + part.takesToGo, 0),
    });
    // And more of them the higher the tier.
    expect(sessionStanding(fresh(6)).next!.takes).toBeGreaterThan(
      standing.next!.takes * 2,
    );
  });

  it("counts down in takes at the rate the session is actually going", () => {
    let session = fresh();
    session = layTake(session, "ann", "riff", 100, NOW, 90);
    session = layTake(session, "bob", "riff", 100, NOW, 80);
    const standing = sessionStanding(session);
    expect(standing).toMatchObject({ takes: 2, accuracy: 85, perTake: 100 });
    const riff = standing.parts.find((part) => part.id === "riff")!;
    // Two takes of a hundred are the going rate: the rest is counted in those.
    const left = Math.ceil((T1.tape - 200) / 100);
    const whole = Math.ceil(T1.tape / 100);
    expect(riff).toMatchObject({ takes: 2, accuracy: 85, takesToGo: left });
    const bass = standing.parts.find((part) => part.id === "bass")!;
    expect(bass).toMatchObject({ takes: 0, accuracy: null, takesToGo: whole });
    expect(standing.next).toEqual({
      rating: "record",
      takes: left + whole * (standing.parts.length - 1),
    });
  });

  it("points at gold once the track is out, platinum after it, then at nothing", () => {
    expect(sessionStanding(filled(1)).next!.rating).toBe("gold");
    expect(sessionStanding(filled(1.6)).next!.rating).toBe("platinum");
    expect(sessionStanding(filled(2.3)).next).toBeNull();
    // A full part asks for no more takes.
    expect(sessionStanding(filled(1)).parts[0].takesToGo).toBe(0);
  });

  it("reads the client's mood off the takes' accuracy, and tips for it", () => {
    expect(clientMood(null)).toBeNull();
    expect(clientMood(50)!.id).toBe("cold");
    expect(clientMood(70)!.id).toBe("listening");
    expect(clientMood(80)!.id).toBe("nodding");
    expect(clientMood(90)!.id).toBe("grinning");
    expect(clientMood(97)!.id).toBe("speechless");
    // Only a client who likes it pays over the odds.
    expect(RECORDING_MOODS.map((mood) => mood.tip)).toEqual([0, 0, 5, 10, 20]);

    expect(sessionStanding(fresh())).toMatchObject({ mood: null, tip: 0 });
    const loved = layTake(fresh(), "ann", "riff", 100, NOW, 96);
    expect(sessionStanding(loved)).toMatchObject({
      mood: "speechless",
      tip: 20,
    });
  });

  it("puts the tip on the cheque, not on the players' Fame", () => {
    const session = filled(1);
    session.partTakes.riff = { takes: 4, accuracy: 4 * 90 };
    session.crew.ann = {
      takes: FULL,
      points: 600,
      day: DAY,
      used: 1,
      accuracy: FULL * 90,
    };
    expect(settleSession(session, EMPTY, NOW)).toMatchObject({
      rating: "record",
      mood: "grinning",
      accuracy: 90,
      bank: pct(T1.fee * RECORDING_BANK_PAY.record, 10),
      pay: { ann: T1.fame },
    });
  });

  it("keeps the last few takes, newest first", () => {
    let session = fresh();
    for (let i = 0; i < 12; i++)
      session = layTake(
        session,
        "ann",
        "riff",
        10,
        new Date(NOW.getTime() + i * 1000),
        60 + i,
      );
    expect(session.log).toHaveLength(8);
    expect(session.log[0].accuracy).toBe(71);
    expect(readSession({ recording: session })).toEqual(session);
  });
});

describe("settling", () => {
  const played = (fill: number, tier = 1): RecordingSession => ({
    ...filled(fill, tier),
    crew: {
      // Ann did a full share of the work, Bob the least that is paid, Cat
      // one take short of that.
      ann: { takes: FULL, points: 400, day: DAY, used: 1, accuracy: 400 },
      bob: { takes: MIN, points: 250, day: DAY, used: 1, accuracy: 240 },
      cat: { takes: MIN - 1, points: 180, day: DAY, used: 2, accuracy: 150 },
    },
  });

  it("pays whoever played enough, and the treasury its cheque", () => {
    const result = settleSession(played(1), EMPTY, NOW);
    expect(result).toMatchObject({
      tier: 1,
      contractId: "rust-buckets",
      rating: "record",
      bank: T1.fee * RECORDING_BANK_PAY.record,
      // Paid by the share of the work: Bob's few takes earn him that much less.
      pay: { ann: T1.fame, bob: Math.round((T1.fame * MIN) / FULL) },
    });
    expect(result.pay.bob).toBeLessThan(result.pay.ann);
    expect(result.pay.cat).toBeUndefined();
    expect([MIN - 1, MIN, FULL, FULL * 3].map(memberShare)).toEqual([
      0,
      MIN / FULL,
      1,
      1,
    ]);
    expect(result.crew.map((entry) => entry.uid)).toEqual([
      "ann",
      "bob",
      "cat",
    ]);
  });

  it("pays more for gold and platinum, less for a demo, nothing for a shelved tape", () => {
    expect(settleSession(played(1.6), EMPTY, NOW)).toMatchObject({
      bank: T1.fee * RECORDING_BANK_PAY.gold,
      pay: { ann: Math.round(T1.fame * RECORDING_MEMBER_PAY.gold) },
    });
    expect(settleSession(played(2.5), EMPTY, NOW)).toMatchObject({
      bank: T1.fee * RECORDING_BANK_PAY.platinum,
      pay: { ann: Math.round(T1.fame * RECORDING_MEMBER_PAY.platinum) },
    });
    expect(settleSession(played(0.6), EMPTY, NOW)).toMatchObject({
      rating: "demo",
      bank: T1.fee * RECORDING_BANK_PAY.demo,
      pay: { ann: Math.round(T1.fame * RECORDING_MEMBER_PAY.demo) },
    });
    expect(settleSession(played(0.2), EMPTY, NOW)).toMatchObject({
      rating: "shelved",
      bank: 0,
      pay: {},
    });
  });

  it("pays a higher tier's release more", () => {
    expect(settleSession(played(1, 6), EMPTY, NOW)).toMatchObject({
      tier: 6,
      bank: T6.fee * RECORDING_BANK_PAY.record,
      pay: { ann: T6.fame },
    });
  });

  it("pays more with a desk and a wall of records", () => {
    const perks = recordingPerks({
      roomLevel: 2,
      items: { desk: 2, walls: 2 },
    });
    expect(settleSession(played(1), perks, NOW)).toMatchObject({
      bank: pct(T1.fee * RECORDING_BANK_PAY.record, perks.desk),
      pay: { ann: pct(T1.fame, perks.walls) },
    });
    expect(perks.desk).toBeGreaterThan(0);
    expect(perks.walls).toBeGreaterThan(0);
  });

  it("keeps the best rating on the tier's shelf and counts releases", () => {
    const gold = settleSession(played(1.6), EMPTY, NOW);
    const entry = shelve({}, gold);
    expect(entry).toMatchObject({ best: "gold", count: 1 });
    const demo = settleSession(played(0.6), EMPTY, NOW);
    expect(shelve({ 1: entry }, demo)).toMatchObject({
      best: "gold",
      count: 1,
    });
    // Another tier's shelf is its own.
    expect(
      shelve({ 1: entry }, settleSession(played(1, 2), EMPTY, NOW)),
    ).toEqual({ best: "record", count: 1, at: NOW.getTime() });
  });
});

describe("reading the document", () => {
  it("reads no session from a guild that never booked one, or from junk", () => {
    expect(readSession({})).toBeNull();
    expect(
      readSession({ recording: { contractId: "nope", tier: 1, endsAt: 5 } }),
    ).toBeNull();
    expect(readSession({ recording: { ...fresh(), tier: 9 } })).toBeNull();
    expect(readShelf({ recordings: { t9: { best: "gold" } } })).toEqual({});
  });

  it("reads a stored session and shelf back as they were", () => {
    const session = layTake(fresh(4), "ann", "riff", 80, NOW);
    expect(readSession({ recording: session })).toEqual(session);
    expect(
      readShelf({
        recordings: { [shelfKey(2)]: { best: "gold", count: 3, at: 7 } },
      }),
    ).toEqual({ 2: { best: "gold", count: 3, at: 7 } });
  });

  it("drops parts the tier does not record", () => {
    const stored = { ...fresh(), tape: { riff: 10, spaceship: 99 } };
    expect(readSession({ recording: stored })!.tape).toEqual({
      riff: 10,
      bass: 0,
      hook: 0,
    });
  });
});
