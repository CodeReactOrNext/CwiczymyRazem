import type {
  RecordingContract,
  RecordingMood,
  RecordingRating,
} from "feature/guilds/data/guildRecording";
import {
  getRecordingContract,
  getRecordingTier,
  isRecordingTier,
  RECORDING_BANK_PAY,
  RECORDING_CONTRACTS,
  RECORDING_DAYS,
  RECORDING_DEMO,
  RECORDING_FULL_SHARE_TAKES,
  RECORDING_GEAR,
  RECORDING_GOLD,
  RECORDING_KEEP_ACCURACY,
  RECORDING_LOG_LENGTH,
  RECORDING_MEMBER_PAY,
  RECORDING_MIN_NOTES,
  RECORDING_MIN_TAKES_FOR_PAY,
  RECORDING_MOODS,
  RECORDING_PLATINUM,
  RECORDING_RATINGS,
  RECORDING_TAKES_PER_DAY,
  RECORDING_TAPE_CAP,
  RECORDING_TEMPO_MAX,
  RECORDING_TEMPO_MIN,
  RECORDING_TIERS,
  RECORDING_TYPICAL_TAKE,
  sessionBpm,
  sessionParts,
} from "feature/guilds/data/guildRecording";
import type { GuildStudio } from "feature/guilds/utils/guildStudio.utils";
import { itemLevel } from "feature/guilds/utils/guildStudio.utils";
import { hashSeed } from "feature/guilds/utils/recordingRiff";

/**
 * Pure rules for recording sessions, kept apart from any storage so the
 * screen and the server's transactions apply the very same ones: what the
 * room is worth to a session, which tier a guild may book and who walks in,
 * what a take lays on the tape, how full the tapes are, and what the session
 * is worth when it ends.
 */

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

// ── The room ────────────────────────────────────────────────────────────────

/** What the guild's studio does for its sessions, in the units the rules use. */
export interface RecordingPerks {
  /** Kept takes a member may lay down a day. */
  takesPerDay: number;
  /** Percent more points on every take. */
  sound: number;
  /** Percent shorter tapes. */
  tape: number;
  /** Percent more Fame from the client into the treasury. */
  desk: number;
  /** Percent more Fame for every member who played. */
  walls: number;
  /** Percent off the session's fee. */
  bench: number;
}

export const recordingPerks = (studio: GuildStudio): RecordingPerks => {
  const gear = RECORDING_GEAR;
  const level = (id: string) => itemLevel(studio, id);
  return {
    takesPerDay:
      RECORDING_TAKES_PER_DAY +
      gear.sofa.takesAt.filter((at) => level(gear.sofa.item) >= at).length,
    sound:
      gear.sound.items.reduce((sum, id) => sum + level(id), 0) *
      gear.sound.perLevel,
    tape: level(gear.tape.item) * gear.tape.perLevel,
    desk: level(gear.desk.item) * gear.desk.perLevel,
    walls: level(gear.walls.item) * gear.walls.perLevel,
    bench: level(gear.bench.item) * gear.bench.perLevel,
  };
};

/** Which perk a piece of gear feeds, for the list under the session. */
export type RecordingPerkKind =
  | Exclude<keyof RecordingPerks, "takesPerDay">
  | "takes";

export const recordingPerkOf = (itemId: string): RecordingPerkKind | null => {
  const gear = RECORDING_GEAR;
  if ((gear.sound.items as readonly string[]).includes(itemId)) return "sound";
  if (itemId === gear.tape.item) return "tape";
  if (itemId === gear.desk.item) return "desk";
  if (itemId === gear.walls.item) return "walls";
  if (itemId === gear.bench.item) return "bench";
  if (itemId === gear.sofa.item) return "takes";
  return null;
};

// ── The session ─────────────────────────────────────────────────────────────

/** One member's part in the session so far. */
export interface RecordingTally {
  /** Kept takes. */
  takes: number;
  /** Points those takes laid down. */
  points: number;
  /** The UTC day `used` counts for. */
  day: string;
  /** Kept takes on `day`. */
  used: number;
  /** The accuracies of the kept takes, added up — for the average. */
  accuracy: number;
}

/** A part's kept takes: how many, and their accuracies added up. */
export interface PartTakes {
  takes: number;
  accuracy: number;
}

/** One kept take, as the session remembers the last few. */
export interface TakeLogEntry {
  uid: string;
  partId: string;
  /** 0–100. */
  accuracy: number;
  points: number;
  at: number;
}

/** The session a guild has open, as its document stores it. */
export interface RecordingSession {
  /** The tier the guild booked. */
  tier: number;
  /** The client who walked in, drawn when the session was booked. */
  contractId: string;
  /** Which session of this tier it is for the guild, from one. */
  lap: number;
  /**
   * The session's own number, drawn when it was booked. The client, the
   * parts and the band behind them are dealt from it, so no two sessions
   * sound alike.
   */
  seed: number;
  openedAt: number;
  endsAt: number;
  openedBy: string;
  /** What the session cost, bench discount included. */
  fee: number;
  /** Points each part's tape needs, fixed when the session opened. */
  targets: Record<string, number>;
  /** Points on each part's tape. */
  tape: Record<string, number>;
  /** The kept takes of each part. */
  partTakes: Record<string, PartTakes>;
  crew: Record<string, RecordingTally>;
  /** The last few kept takes, newest first. */
  log: TakeLogEntry[];
}

/** A tier the guild has recorded on: the best it did there, and how many times. */
export interface RecordingShelfEntry {
  best: RecordingRating;
  /** Records released on the tier. */
  count: number;
  at: number;
}
/** By tier number. */
export type RecordingShelf = Record<number, RecordingShelfEntry>;

const isRating = (value: unknown): value is RecordingRating =>
  (RECORDING_RATINGS as readonly unknown[]).includes(value);

export const ratingRank = (
  rating: RecordingRating | null | undefined,
): number => (rating ? RECORDING_RATINGS.indexOf(rating) : -1);

/** A finished track, as opposed to a demo or a shelved tape. */
export const isReleased = (
  rating: RecordingRating | null | undefined,
): boolean => ratingRank(rating) >= ratingRank("record");

/** The UTC day a take counts against. */
export const recordingDay = (now: Date): string =>
  now.toISOString().slice(0, 10);

/** The field a tier's shelf entry is stored under. */
export const shelfKey = (tier: number): string => `t${tier}`;

const readTally = (value: unknown): RecordingTally => {
  const stored = (value ?? {}) as Record<string, unknown>;
  return {
    takes: Math.max(0, Math.floor(num(stored.takes))),
    points: Math.max(0, Math.floor(num(stored.points))),
    day: typeof stored.day === "string" ? stored.day : "",
    used: Math.max(0, Math.floor(num(stored.used))),
    accuracy: Math.max(0, num(stored.accuracy)),
  };
};

const readLog = (
  value: unknown,
  parts: Record<string, unknown>,
): TakeLogEntry[] =>
  (Array.isArray(value) ? value : [])
    .filter(
      (entry) =>
        entry &&
        typeof entry.uid === "string" &&
        typeof entry.partId === "string" &&
        entry.partId in parts,
    )
    .slice(0, RECORDING_LOG_LENGTH)
    .map((entry) => ({
      uid: entry.uid,
      partId: entry.partId,
      accuracy: Math.min(100, Math.max(0, num(entry.accuracy))),
      points: Math.max(0, Math.floor(num(entry.points))),
      at: num(entry.at),
    }));

/**
 * The open session off the guild document, made safe to use: a tier and a
 * client the catalog knows, a tape and a target for each part that tier
 * records of them and nothing else. Anything that does not hold together
 * reads as no session.
 */
export const readSession = (
  data: Record<string, any> | undefined,
): RecordingSession | null => {
  const stored = data?.recording;
  const contract = getRecordingContract(stored?.contractId);
  if (!stored || !contract || num(stored.endsAt) <= 0) return null;
  if (!isRecordingTier(stored.tier)) return null;

  const fallback = getRecordingTier(stored.tier).tape;
  const targets: Record<string, number> = {};
  const tape: Record<string, number> = {};
  const partTakes: Record<string, PartTakes> = {};
  for (const part of sessionParts(contract, stored.tier)) {
    targets[part.id] = Math.max(
      1,
      Math.floor(num(stored.targets?.[part.id])) || fallback,
    );
    tape[part.id] = Math.max(0, Math.floor(num(stored.tape?.[part.id])));
    partTakes[part.id] = {
      takes: Math.max(0, Math.floor(num(stored.partTakes?.[part.id]?.takes))),
      accuracy: Math.max(0, num(stored.partTakes?.[part.id]?.accuracy)),
    };
  }
  const crew: Record<string, RecordingTally> = {};
  for (const [uid, tally] of Object.entries(stored.crew ?? {}))
    crew[uid] = readTally(tally);

  return {
    tier: stored.tier,
    contractId: contract.id,
    lap: Math.max(1, Math.floor(num(stored.lap)) || 1),
    // A session stored without one still has to deal the same parts every
    // time it is read: the moment it opened is as good a number as any.
    seed: (num(stored.seed) || num(stored.openedAt)) >>> 0,
    openedAt: num(stored.openedAt),
    endsAt: num(stored.endsAt),
    openedBy: typeof stored.openedBy === "string" ? stored.openedBy : "",
    fee: Math.max(0, Math.floor(num(stored.fee))),
    targets,
    tape,
    partTakes,
    crew,
    log: readLog(stored.log, targets),
  };
};

export const readShelf = (
  data: Record<string, any> | undefined,
): RecordingShelf => {
  const shelf: RecordingShelf = {};
  for (const { tier } of RECORDING_TIERS) {
    const stored = data?.recordings?.[shelfKey(tier)];
    if (!stored || !isRating(stored.best)) continue;
    shelf[tier] = {
      best: stored.best,
      count: Math.max(0, Math.floor(num(stored.count))),
      at: num(stored.at),
    };
  }
  return shelf;
};

// ── Booking ─────────────────────────────────────────────────────────────────

/** The first tier takes anybody; each one after wants a record out on the one before. */
export const isTierUnlocked = (tier: number, shelf: RecordingShelf): boolean =>
  tier <= 1 || isReleased(shelf[tier - 1]?.best);

export const sessionFee = (tier: number, perks: RecordingPerks): number =>
  Math.round(getRecordingTier(tier).fee * (1 - perks.bench / 100));

export const sessionTapeTarget = (
  tier: number,
  perks: RecordingPerks,
): number =>
  Math.max(1, Math.round(getRecordingTier(tier).tape * (1 - perks.tape / 100)));

/** What a plain release on the tier pays each member, and the treasury. */
export const tierPayout = (
  tier: number,
  perks: RecordingPerks,
  rating: RecordingRating = "record",
): { fame: number; bank: number } => {
  const { fame, fee } = getRecordingTier(tier);
  return {
    fame: Math.round(
      fame * RECORDING_MEMBER_PAY[rating] * (1 + perks.walls / 100),
    ),
    bank: Math.round(fee * RECORDING_BANK_PAY[rating] * (1 + perks.desk / 100)),
  };
};

export type BookingCheck =
  | { ok: true; fee: number }
  | { ok: false; reason: "busy" | "locked" }
  | { ok: false; reason: "bank"; fee: number; short: number };

export const checkBooking = (
  tier: number,
  shelf: RecordingShelf,
  perks: RecordingPerks,
  bank: number,
  hasSession: boolean,
): BookingCheck => {
  if (hasSession) return { ok: false, reason: "busy" };
  if (!isTierUnlocked(tier, shelf)) return { ok: false, reason: "locked" };
  const fee = sessionFee(tier, perks);
  if (bank < fee) return { ok: false, reason: "bank", fee, short: fee - bank };
  return { ok: true, fee };
};

/**
 * Who walks in: one of the clients, drawn by the session's seed — anybody but
 * whoever the guild recorded last, so two sessions in a row are never the
 * same band.
 */
export const drawClient = (
  seed: number,
  lastContractId?: string,
): RecordingContract => {
  const pool = RECORDING_CONTRACTS.filter(
    (contract) => contract.id !== lastContractId,
  );
  const from = pool.length ? pool : RECORDING_CONTRACTS;
  return from[hashSeed(`client/${seed >>> 0}`) % from.length];
};

/** A fresh session: a client drawn, empty tapes sized by the room as it stands today. */
export const openSession = (
  tier: number,
  shelf: RecordingShelf,
  perks: RecordingPerks,
  uid: string,
  now: Date,
  seed: number,
  lastContractId?: string,
): RecordingSession => {
  const contract = drawClient(seed, lastContractId);
  const target = sessionTapeTarget(tier, perks);
  const parts = sessionParts(contract, tier);
  return {
    tier,
    contractId: contract.id,
    lap: (shelf[tier]?.count ?? 0) + 1,
    seed: seed >>> 0,
    openedAt: now.getTime(),
    endsAt: now.getTime() + RECORDING_DAYS * 86_400_000,
    openedBy: uid,
    fee: sessionFee(tier, perks),
    targets: Object.fromEntries(parts.map((part) => [part.id, target])),
    tape: Object.fromEntries(parts.map((part) => [part.id, 0])),
    partTakes: Object.fromEntries(
      parts.map((part) => [part.id, { takes: 0, accuracy: 0 }]),
    ),
    crew: {},
    log: [],
  };
};

// ── Takes ───────────────────────────────────────────────────────────────────

/** What a session sends in when a take ends. */
export interface TakeSubmission {
  partId: string;
  /** 0–100, as the session scored it. */
  accuracy: number;
  /** The slowest tempo the take was scored at. */
  bpm: number;
  /** Notes the take was judged on. */
  notes: number;
}

export interface TakeVerdict {
  /** Scrapped takes lay nothing down and use no take. */
  kept: boolean;
  /** What goes on the tape. */
  points: number;
  /** The tempo's share in it, 0.5 – 1.3. */
  tempo: number;
}

/**
 * A take's worth: its accuracy, scaled by how close to the session's tempo
 * (`trackBpm`: the client's, at the tier's pace) it was played — slower is
 * allowed and pays less, faster pays a little more — and by how good the
 * room sounds.
 */
export const judgeTake = (
  take: Pick<TakeSubmission, "accuracy" | "bpm" | "notes">,
  trackBpm: number,
  perks: RecordingPerks,
): TakeVerdict => {
  const accuracy = Math.min(100, Math.max(0, num(take.accuracy)));
  const tempo = Math.min(
    RECORDING_TEMPO_MAX,
    Math.max(RECORDING_TEMPO_MIN, num(take.bpm) / trackBpm),
  );
  const kept =
    accuracy >= RECORDING_KEEP_ACCURACY &&
    num(take.notes) >= RECORDING_MIN_NOTES;
  return {
    kept,
    tempo,
    points: kept ? Math.round(accuracy * tempo * (1 + perks.sound / 100)) : 0,
  };
};

/** Kept takes the member still has today. */
export const takesLeft = (
  session: RecordingSession,
  uid: string,
  perks: RecordingPerks,
  now: Date,
): number => {
  const tally = session.crew[uid];
  const used = tally && tally.day === recordingDay(now) ? tally.used : 0;
  return Math.max(0, perks.takesPerDay - used);
};

/** The session with one kept take laid onto a part's tape. */
export const layTake = (
  session: RecordingSession,
  uid: string,
  partId: string,
  points: number,
  now: Date,
  /** 0–100, as the take was scored — what the client's mood goes by. */
  accuracy = 0,
): RecordingSession => {
  const day = recordingDay(now);
  const tally = session.crew[uid] ?? {
    takes: 0,
    points: 0,
    day,
    used: 0,
    accuracy: 0,
  };
  const part = session.partTakes[partId] ?? { takes: 0, accuracy: 0 };
  const cap = Math.round(session.targets[partId] * RECORDING_TAPE_CAP);
  const scored = Math.min(100, Math.max(0, accuracy));
  return {
    ...session,
    tape: {
      ...session.tape,
      [partId]: Math.min(cap, (session.tape[partId] ?? 0) + points),
    },
    partTakes: {
      ...session.partTakes,
      [partId]: {
        takes: part.takes + 1,
        accuracy: part.accuracy + scored,
      },
    },
    crew: {
      ...session.crew,
      [uid]: {
        takes: tally.takes + 1,
        points: tally.points + points,
        day,
        used: (tally.day === day ? tally.used : 0) + 1,
        accuracy: tally.accuracy + scored,
      },
    },
    log: [
      { uid, partId, accuracy: scored, points, at: now.getTime() },
      ...session.log,
    ].slice(0, RECORDING_LOG_LENGTH),
  };
};

// ── Standing ────────────────────────────────────────────────────────────────

export interface PartStanding {
  id: string;
  tape: number;
  target: number;
  /** tape / target, capped at RECORDING_TAPE_CAP. */
  fill: number;
  /** Kept takes laid on it. */
  takes: number;
  /** Their average accuracy, 0–100; null before the first one. */
  accuracy: number | null;
  /** Takes still to go before its tape is full, at the session's going rate. */
  takesToGo: number;
}

/** The next thing the session can become, and how far away it is. */
export interface NextRating {
  rating: RecordingRating;
  /** Takes still to go, at the session's going rate. */
  takes: number;
}

export interface SessionStanding {
  parts: PartStanding[];
  /** Kept takes so far, on every part together. */
  takes: number;
  /** Their average accuracy, 0–100; null before the first one. */
  accuracy: number | null;
  /** What a kept take has been laying down here, on average. */
  perTake: number;
  /** How the client takes what they have heard; null before the first take. */
  mood: RecordingMood | null;
  /** What that mood adds to the cheque, percent. */
  tip: number;
  /** The rating after the one the session stands at; null at the top. */
  next: NextRating | null;
  /** Mean fill of the parts. */
  mean: number;
  /** Every part's tape is full: the track exists. */
  recorded: boolean;
  /** Every part's tape is at its cap: nothing more can be laid down. */
  full: boolean;
  /** What the session would be worth if it ended now. */
  rating: RecordingRating;
}

/** The client's mood at this average accuracy; null with nothing heard yet. */
export const clientMood = (
  accuracy: number | null,
): (typeof RECORDING_MOODS)[number] | null =>
  accuracy === null
    ? null
    : [...RECORDING_MOODS].reverse().find((mood) => accuracy >= mood.from)!;

export const sessionStanding = (session: RecordingSession): SessionStanding => {
  const ids = Object.keys(session.targets);
  const takes = ids.reduce(
    (sum, id) => sum + (session.partTakes[id]?.takes ?? 0),
    0,
  );
  const accuracySum = ids.reduce(
    (sum, id) => sum + (session.partTakes[id]?.accuracy ?? 0),
    0,
  );
  const onTape = ids.reduce((sum, id) => sum + (session.tape[id] ?? 0), 0);
  // The session's own going rate once it has one; a decent take before that.
  const perTake =
    takes > 0 ? Math.max(1, onTape / takes) : RECORDING_TYPICAL_TAKE;
  const takesFor = (points: number) => Math.ceil(Math.max(0, points) / perTake);

  const parts = ids.map((id): PartStanding => {
    const target = session.targets[id];
    const tape = session.tape[id] ?? 0;
    const laid = session.partTakes[id] ?? { takes: 0, accuracy: 0 };
    return {
      id,
      tape,
      target,
      fill: Math.min(RECORDING_TAPE_CAP, tape / target),
      takes: laid.takes,
      accuracy: laid.takes > 0 ? laid.accuracy / laid.takes : null,
      takesToGo: takesFor(target - tape),
    };
  });
  /** Takes until every tape is at `fill` times its target. */
  const takesTo = (fill: number) =>
    parts.reduce(
      (sum, part) => sum + takesFor(part.target * fill - part.tape),
      0,
    );
  const mean =
    parts.reduce((sum, part) => sum + part.fill, 0) / Math.max(1, parts.length);
  const recorded = parts.length > 0 && parts.every((part) => part.fill >= 1);
  const rating: RecordingRating = recorded
    ? mean >= RECORDING_PLATINUM
      ? "platinum"
      : mean >= RECORDING_GOLD
        ? "gold"
        : "record"
    : mean >= RECORDING_DEMO
      ? "demo"
      : "shelved";
  const next: NextRating | null =
    rating === "platinum"
      ? null
      : rating === "gold"
        ? { rating: "platinum", takes: takesTo(RECORDING_PLATINUM) }
        : rating === "record"
          ? { rating: "gold", takes: takesTo(RECORDING_GOLD) }
          : { rating: "record", takes: takesTo(1) };
  const accuracy = takes > 0 ? accuracySum / takes : null;
  const mood = clientMood(accuracy);
  return {
    parts,
    takes,
    accuracy,
    perTake,
    mood: mood?.id ?? null,
    tip: mood?.tip ?? 0,
    next,
    mean,
    recorded,
    full:
      parts.length > 0 &&
      parts.every((part) => part.fill >= RECORDING_TAPE_CAP),
    rating,
  };
};

/** The session is over by itself: out of time, or out of tape. */
export const isSessionOver = (session: RecordingSession, now: Date): boolean =>
  now.getTime() >= session.endsAt || sessionStanding(session).full;

/**
 * Handing the track over early ends the chase for gold, so it is not
 * anybody's to do: only whoever booked the session, or the founder, and only
 * once there is a track to hand over.
 */
export const canDeliver = (
  session: RecordingSession,
  uid: string,
  founderUid: string | undefined,
): boolean =>
  sessionStanding(session).recorded &&
  (uid === session.openedBy || uid === founderUid);

// ── The end ─────────────────────────────────────────────────────────────────

export interface SessionResult {
  tier: number;
  contractId: string;
  lap: number;
  rating: RecordingRating;
  mean: number;
  /** How the client took it, and the average accuracy that mood came from. */
  mood: RecordingMood | null;
  accuracy: number | null;
  at: number;
  /** What the client paid into the treasury, tip included. */
  bank: number;
  /** Fame owed to each member who played enough to be paid. */
  pay: Record<string, number>;
  /** Everybody who laid a take down, most points first. */
  crew: { uid: string; takes: number; points: number }[];
}

/**
 * The share of the session's Fame a member's takes earn them: nothing under
 * the minimum, all of it from `RECORDING_FULL_SHARE_TAKES` up, in proportion
 * between the two.
 */
export const memberShare = (takes: number): number =>
  takes < RECORDING_MIN_TAKES_FOR_PAY
    ? 0
    : Math.min(1, takes / RECORDING_FULL_SHARE_TAKES);

export const settleSession = (
  session: RecordingSession,
  perks: RecordingPerks,
  now: Date,
): SessionResult => {
  const { rating, mean, tip, mood, accuracy } = sessionStanding(session);
  const payout = tierPayout(session.tier, perks, rating);
  const { fame } = payout;
  // A client who liked what they heard rounds the cheque up.
  const bank = Math.round(payout.bank * (1 + tip / 100));
  const crew = Object.entries(session.crew)
    .map(([uid, tally]) => ({ uid, takes: tally.takes, points: tally.points }))
    .filter((entry) => entry.takes > 0)
    .sort((a, b) => b.points - a.points || a.uid.localeCompare(b.uid));
  const pay: Record<string, number> = {};
  if (fame > 0)
    for (const entry of crew) {
      const share = memberShare(entry.takes);
      if (share > 0) pay[entry.uid] = Math.round(fame * share);
    }

  return {
    tier: session.tier,
    contractId: session.contractId,
    lap: session.lap,
    rating,
    mean: Math.round(mean * 100) / 100,
    mood,
    accuracy: accuracy === null ? null : Math.round(accuracy),
    at: now.getTime(),
    bank,
    pay,
    crew,
  };
};

/** The tier's shelf entry with a finished session on it: the best rating stays, releases count. */
export const shelve = (
  shelf: RecordingShelf,
  result: SessionResult,
): RecordingShelfEntry => {
  const known = shelf[result.tier];
  return {
    best:
      known && ratingRank(known.best) >= ratingRank(result.rating)
        ? known.best
        : result.rating,
    count: (known?.count ?? 0) + (isReleased(result.rating) ? 1 : 0),
    at: result.at,
  };
};

// ── What the screen is told ─────────────────────────────────────────────────

export interface RecordingTierView {
  tier: number;
  unlocked: boolean;
  /** What booking it costs this guild today. */
  fee: number;
  /** What a plain release on it pays each player, and the treasury. */
  fame: number;
  bank: number;
  best: RecordingRating | null;
  /** Records the guild has released on it. */
  count: number;
}

export interface RecordingCrewView {
  uid: string;
  displayName: string;
  avatar: string | null;
  takes: number;
  points: number;
  /** Average accuracy of their kept takes, 0–100. */
  accuracy: number;
}

/** A kept take on the session's list of the last few. */
export interface RecordingTakeView extends TakeLogEntry {
  displayName: string;
}

export interface RecordingSessionView extends SessionStanding {
  tier: number;
  contractId: string;
  lap: number;
  /** What the parts are dealt from — see `recordingRiff.ts`. */
  seed: number;
  /** The tempo a take is worth its full points at. */
  bpm: number;
  endsAt: number;
  crew: RecordingCrewView[];
  /** The last few kept takes, newest first. */
  recent: RecordingTakeView[];
  me: { takes: number; points: number; takesLeft: number };
  canDeliver: boolean;
}

export interface RecordingLastView {
  tier: number;
  contractId: string;
  rating: RecordingRating;
  at: number;
  bank: number;
  /** Fame this session owed the caller — zero when they did not play enough. */
  pay: number;
}

/** What the recording endpoint answers with. */
export interface RecordingView {
  bank: number;
  perks: RecordingPerks;
  tiers: RecordingTierView[];
  session: RecordingSessionView | null;
  last: RecordingLastView | null;
  /** Fame from finished sessions the caller has not collected yet. */
  pay: number;
}

/** The ladder as a guild sees it today. */
export const tierViews = (
  shelf: RecordingShelf,
  perks: RecordingPerks,
): RecordingTierView[] =>
  RECORDING_TIERS.map(({ tier }) => ({
    tier,
    unlocked: isTierUnlocked(tier, shelf),
    fee: sessionFee(tier, perks),
    ...tierPayout(tier, perks),
    best: shelf[tier]?.best ?? null,
    count: shelf[tier]?.count ?? 0,
  }));

/** The open session as the screen is told it, for the member `uid`. */
export const sessionView = (
  session: RecordingSession,
  perks: RecordingPerks,
  uid: string,
  founderUid: string | undefined,
  now: Date,
  nameOf: (uid: string) => { displayName: string; avatar: string | null },
): RecordingSessionView | null => {
  const contract = getRecordingContract(session.contractId);
  if (!contract) return null;
  return {
    ...sessionStanding(session),
    tier: session.tier,
    contractId: contract.id,
    lap: session.lap,
    seed: session.seed,
    bpm: sessionBpm(contract, session.tier),
    endsAt: session.endsAt,
    crew: Object.entries(session.crew)
      .filter(([, tally]) => tally.takes > 0)
      .map(([memberUid, tally]) => ({
        uid: memberUid,
        ...nameOf(memberUid),
        takes: tally.takes,
        points: tally.points,
        accuracy: tally.accuracy / tally.takes,
      }))
      .sort((a, b) => b.points - a.points),
    recent: session.log.map((entry) => ({
      ...entry,
      displayName: nameOf(entry.uid).displayName,
    })),
    me: {
      takes: session.crew[uid]?.takes ?? 0,
      points: session.crew[uid]?.points ?? 0,
      takesLeft: takesLeft(session, uid, perks, now),
    },
    canDeliver: canDeliver(session, uid, founderUid),
  };
};

/** What a take's submission answers with, on top of the view. */
export interface TakeResult {
  kept: boolean;
  points: number;
  /** Why nothing was laid down, when nothing was. */
  reason?: "scrapped" | "no-takes" | "over";
  takesLeft: number;
}
