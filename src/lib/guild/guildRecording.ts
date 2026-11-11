import { randomInt } from "crypto";
import {
  getRecordingContract,
  isRecordingTier,
  sessionBpm,
} from "feature/guilds/data/guildRecording";
import type { GuildMember } from "feature/guilds/types/guild.types";
import type {
  RecordingSession,
  RecordingView,
  SessionResult,
  TakeResult,
  TakeSubmission,
} from "feature/guilds/utils/guildRecording.utils";
import {
  canDeliver,
  checkBooking,
  isSessionOver,
  judgeTake,
  layTake,
  openSession,
  readSession,
  readShelf,
  recordingPerks,
  sessionView,
  settleSession,
  shelfKey,
  shelve,
  takesLeft,
  tierViews,
} from "feature/guilds/utils/guildRecording.utils";
import { readTreasury } from "feature/guilds/utils/guildTreasury.utils";
import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { readStudio } from "lib/guild/guildStudio";
import { awardFame } from "lib/support/fameWallet";
import type { PlayerSession } from "lib/support/supporterAuth";
import { userRef } from "lib/support/tokenWallet";
import { firestore } from "utils/firebase/api/firebase.config";

/**
 * Recording sessions on the server.
 *
 * Everything lives on the guild document, the way the studio and the quest
 * ledger do: `recording` is the session that is open (one at a time),
 * `recordings` what the guild has released on each tier, `recordingLast` how
 * the last session ended and `recordingPay` the Fame it owes each member
 * until they collect it. No subcollection, no query — a session costs the
 * reads the guild document already costs.
 *
 * A guild books a tier, not a client: the session draws its own seed here,
 * and the seed draws the client, the progression, the parts and the band.
 *
 * A session ends by itself: once its week is up (or its tapes are full), the
 * next read or write that touches it settles it first, inside the same
 * transaction, from what is stored. Nobody has to be online for it.
 *
 * A take's score comes from the player's own session, as a duel's does, so it
 * cannot be verified here. What can be is held to: the part belongs to the
 * open session, the tempo is clamped to the range a take may be played at, a
 * member lays down only so many kept takes a day, and a tape stops at its cap.
 */

const guildRef = (id: string): DocumentReference =>
  firestore.collection("guilds").doc(id);

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export type RecordingResult<T> =
  | ({ ok: true } & T)
  | { ok: false; status: 400 | 402 | 403 | 404 | 409; error: string };

type Refusal = Extract<RecordingResult<object>, { ok: false }>;

const NOT_IN_ONE: Refusal = {
  ok: false,
  status: 400,
  error: "You are not in a guild",
};
const GONE: Refusal = { ok: false, status: 404, error: "That guild is gone" };

/**
 * Ends the open session inside `tx`: the client's cheque into the treasury,
 * the record onto its tier's shelf, what each member is owed onto their tab.
 * Returns the patch's effect on `data`, so the caller can go on from the
 * settled state without reading the document again.
 */
const settleIn = (
  tx: Transaction,
  ref: DocumentReference,
  data: Record<string, any>,
  session: RecordingSession,
  now: Date,
): { data: Record<string, any>; result: SessionResult } => {
  const perks = recordingPerks(readStudio(data));
  const result = settleSession(session, perks, now);
  const entry = shelve(readShelf(data), result);
  const key = shelfKey(result.tier);

  const patch: Record<string, unknown> = {
    recording: FieldValue.delete(),
    [`recordings.${key}`]: entry,
    recordingLast: result,
  };
  if (result.bank > 0)
    patch["treasury.fame"] = FieldValue.increment(result.bank);
  for (const [uid, fame] of Object.entries(result.pay))
    patch[`recordingPay.${uid}`] = FieldValue.increment(fame);
  tx.update(ref, patch);

  const pay = { ...(data.recordingPay ?? {}) };
  for (const [uid, fame] of Object.entries(result.pay))
    pay[uid] = num(pay[uid]) + fame;
  const { recording: _ended, ...rest } = data;
  return {
    result,
    data: {
      ...rest,
      recordings: { ...(data.recordings ?? {}), [key]: entry },
      recordingLast: result,
      recordingPay: pay,
      treasury: {
        ...(data.treasury ?? {}),
        fame: num(data.treasury?.fame) + result.bank,
      },
    },
  };
};

/** The guild document with an overdue session settled, and the session left open if any. */
const current = (
  tx: Transaction,
  ref: DocumentReference,
  data: Record<string, any>,
  now: Date,
): { data: Record<string, any>; session: RecordingSession | null } => {
  const session = readSession(data);
  if (!session) return { data, session: null };
  if (!isSessionOver(session, now)) return { data, session };
  return { data: settleIn(tx, ref, data, session, now).data, session: null };
};

const readLast = (
  data: Record<string, any>,
  uid: string,
): RecordingView["last"] => {
  const last = data.recordingLast;
  if (!last || !getRecordingContract(last.contractId)) return null;
  if (!isRecordingTier(last.tier)) return null;
  return {
    tier: last.tier,
    contractId: last.contractId,
    rating: last.rating,
    at: num(last.at),
    bank: Math.max(0, Math.floor(num(last.bank))),
    pay: Math.max(0, Math.floor(num(last.pay?.[uid]))),
  };
};

/** What the screen is told, from the document as it stands. */
const viewOf = (
  data: Record<string, any>,
  session: RecordingSession | null,
  uid: string,
  now: Date,
): RecordingView => {
  const perks = recordingPerks(readStudio(data));
  const members = (data.members ?? []) as GuildMember[];
  const nameOf = (memberUid: string) => {
    const member = members.find((entry) => entry.uid === memberUid);
    return {
      displayName: member?.displayName ?? "Player",
      avatar: member?.avatar ?? null,
    };
  };

  return {
    bank: readTreasury(data).fame,
    perks,
    tiers: tierViews(readShelf(data), perks),
    session:
      session && sessionView(session, perks, uid, data.founderUid, now, nameOf),
    last: readLast(data, uid),
    pay: Math.max(0, Math.floor(num(data.recordingPay?.[uid]))),
  };
};

/**
 * Runs `work` on the caller's guild inside one transaction, with an overdue
 * session already settled. Which guild is the caller's own `guildId`, an
 * Admin-SDK-written field, never anything in the request.
 */
const withGuild = async <T>(
  player: PlayerSession,
  now: Date,
  work: (context: {
    tx: Transaction;
    ref: DocumentReference;
    data: Record<string, any>;
    session: RecordingSession | null;
    user: DocumentSnapshot;
  }) => RecordingResult<T>,
): Promise<RecordingResult<T>> =>
  firestore.runTransaction(async (tx: Transaction) => {
    const user = await tx.get(userRef(player.uid));
    const guildId = user.data()?.guildId as string | undefined;
    if (!guildId) return NOT_IN_ONE;

    const ref = guildRef(guildId);
    const guild = await tx.get(ref);
    if (!guild.exists) return GONE;

    const settled = current(tx, ref, guild.data() ?? {}, now);
    return work({ tx, ref, user, ...settled });
  });

/** The caller's guild's sessions: the open one, the tiers, what they are owed. */
export const readGuildRecording = (
  player: PlayerSession,
  now = new Date(),
): Promise<RecordingResult<{ view: RecordingView }>> =>
  withGuild<{ view: RecordingView }>(player, now, ({ data, session }) => ({
    ok: true,
    view: viewOf(data, session, player.uid, now),
  }));

/**
 * Books a session on a tier: the fee leaves the treasury as `spent` (the
 * deposits the quests count are left alone), a client is drawn — anybody but
 * the one the guild recorded last — and the session opens with empty tapes.
 * Any member may, the same way any member may spend on the room.
 */
export const bookRecording = (
  player: PlayerSession,
  tier: unknown,
  now = new Date(),
  // Drawn here, once: the client, the parts and the band of this session.
  seed = randomInt(0, 0xffffffff),
): Promise<RecordingResult<{ view: RecordingView }>> =>
  withGuild<{ view: RecordingView }>(
    player,
    now,
    ({ tx, ref, data, session }) => {
      if (!isRecordingTier(tier))
        return { ok: false, status: 400, error: "No such tier" };

      const shelf = readShelf(data);
      const perks = recordingPerks(readStudio(data));
      const bank = readTreasury(data).fame;
      const check = checkBooking(tier, shelf, perks, bank, !!session);
      if (!check.ok) {
        if (check.reason === "bank")
          return { ok: false, status: 402, error: "The treasury is short" };
        return {
          ok: false,
          status: 409,
          error:
            check.reason === "busy"
              ? "A session is already open"
              : "That tier is not open to you yet",
        };
      }

      const opened = openSession(
        tier,
        shelf,
        perks,
        player.uid,
        now,
        seed,
        data.recordingLast?.contractId,
      );
      tx.update(ref, {
        recording: { ...opened },
        "treasury.fame": FieldValue.increment(-check.fee),
        "treasury.spent": FieldValue.increment(check.fee),
      });
      const after = {
        ...data,
        recording: opened,
        treasury: { ...(data.treasury ?? {}), fame: bank - check.fee },
      };
      return { ok: true, view: viewOf(after, opened, player.uid, now) };
    },
  );

export const readTake = (
  body: Record<string, unknown>,
): TakeSubmission | null => {
  const { partId, accuracy, bpm, notes } = body;
  if (typeof partId !== "string" || !partId) return null;
  if (
    ![accuracy, bpm, notes].every(
      (value) => typeof value === "number" && Number.isFinite(value),
    )
  )
    return null;
  if ((accuracy as number) < 0 || (bpm as number) <= 0 || (notes as number) < 0)
    return null;
  return {
    partId,
    accuracy: accuracy as number,
    bpm: bpm as number,
    notes: notes as number,
  };
};

/**
 * Lays a take onto its part's tape. A take that was not good enough, came
 * after the session closed or after the member's takes for the day ran out
 * is answered — with why — rather than refused: the player has just played
 * it, and the screen owes them what became of it.
 */
export const submitRecordingTake = (
  player: PlayerSession,
  take: TakeSubmission,
  now = new Date(),
): Promise<RecordingResult<{ view: RecordingView; take: TakeResult }>> =>
  withGuild<{ view: RecordingView; take: TakeResult }>(
    player,
    now,
    ({ tx, ref, data, session }) => {
      const contract = session && getRecordingContract(session.contractId);
      if (!session || !contract)
        return {
          ok: true,
          view: viewOf(data, null, player.uid, now),
          take: { kept: false, points: 0, reason: "over", takesLeft: 0 },
        };
      // The parts this tier records of the client — not all the client has.
      if (!(take.partId in session.targets))
        return { ok: false, status: 400, error: "No such part" };

      const perks = recordingPerks(readStudio(data));
      const left = takesLeft(session, player.uid, perks, now);
      const verdict = judgeTake(
        take,
        sessionBpm(contract, session.tier),
        perks,
      );
      if (!verdict.kept || left <= 0)
        return {
          ok: true,
          view: viewOf(data, session, player.uid, now),
          take: {
            kept: false,
            points: 0,
            reason: verdict.kept ? "no-takes" : "scrapped",
            takesLeft: left,
          },
        };

      const laid = layTake(
        session,
        player.uid,
        take.partId,
        verdict.points,
        now,
        take.accuracy,
      );
      tx.update(ref, {
        [`recording.tape.${take.partId}`]: laid.tape[take.partId],
        [`recording.partTakes.${take.partId}`]: laid.partTakes[take.partId],
        [`recording.crew.${player.uid}`]: laid.crew[player.uid],
        "recording.log": laid.log,
      });
      // The take that fills the last tape to its cap ends the session with it.
      const after = current(tx, ref, { ...data, recording: laid }, now);
      return {
        ok: true,
        view: viewOf(after.data, after.session, player.uid, now),
        take: { kept: true, points: verdict.points, takesLeft: left - 1 },
      };
    },
  );

/** Hands the track over before the week is up — see `canDeliver` for who may. */
export const deliverRecording = (
  player: PlayerSession,
  now = new Date(),
): Promise<RecordingResult<{ view: RecordingView }>> =>
  withGuild<{ view: RecordingView }>(
    player,
    now,
    ({ tx, ref, data, session }) => {
      if (!session)
        return { ok: false, status: 409, error: "No session is open" };
      if (!canDeliver(session, player.uid, data.founderUid))
        return {
          ok: false,
          status: 403,
          error: "That is not yours to hand over yet",
        };

      const settled = settleIn(tx, ref, data, session, now);
      return { ok: true, view: viewOf(settled.data, null, player.uid, now) };
    },
  );

/** Pays the caller what finished sessions owe them, and clears their tab. */
export const claimRecordingPay = (
  player: PlayerSession,
  now = new Date(),
): Promise<RecordingResult<{ view: RecordingView; fame: number }>> =>
  withGuild<{ view: RecordingView; fame: number }>(
    player,
    now,
    ({ tx, ref, data, session, user }) => {
      const fame = Math.max(
        0,
        Math.floor(num(data.recordingPay?.[player.uid])),
      );
      if (fame <= 0)
        return { ok: false, status: 409, error: "Nothing to collect" };

      tx.update(ref, { [`recordingPay.${player.uid}`]: FieldValue.delete() });
      awardFame(tx, user, fame);
      const { [player.uid]: _paid, ...owed } = data.recordingPay ?? {};
      return {
        ok: true,
        fame,
        view: viewOf({ ...data, recordingPay: owed }, session, player.uid, now),
      };
    },
  );
