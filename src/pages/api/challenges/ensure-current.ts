import {
  CHALLENGE_SONG_COUNT,
  type ChallengeSong,
  nominationDocId,
} from "feature/challenges/types/challenge.types";
import {
  challengeMonthLabel,
  challengeWindow,
  currentChallengeId,
  shiftChallengeId,
} from "feature/challenges/utils/challengeMonth";
import type {
  DocumentReference,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

/** How many consecutive board draws a nomination may miss the cut before it's auto-removed. */
const MAX_MONTHS_WITHOUT_BOARD_ENTRY = 3;

interface NominationDoc {
  songId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  tier?: string;
  avgDifficulty?: number;
  voteCount?: number;
  createdAt?: FirebaseFirestore.Timestamp;
  monthsWithoutBoardEntry?: number;
}

interface NominationRecord {
  ref: DocumentReference;
  data: NominationDoc;
}

/** Drops `undefined` fields — Firestore rejects them. */
const toChallengeSong = (
  source: Partial<NominationDoc> & {
    songId: string;
    title: string;
    artist: string;
  },
  votes: number,
): ChallengeSong => {
  const song: ChallengeSong = {
    songId: source.songId,
    title: source.title,
    artist: source.artist,
    votes,
  };
  if (source.coverUrl) song.coverUrl = source.coverUrl;
  if (source.tier) song.tier = source.tier;
  if (source.avgDifficulty !== undefined)
    song.avgDifficulty = source.avgDifficulty;
  return song;
};

/**
 * All nominations cast for this month's ballot, most-backed first. An earlier
 * nomination wins a tie, so being first to propose a song is worth something.
 * Returns the raw records (with doc refs) alongside the picks so the caller
 * can also work out who *didn't* make the board, for carry-over.
 */
const fetchBallot = async (
  challengeId: string,
): Promise<{ picks: ChallengeSong[]; all: NominationRecord[] }> => {
  const snap = await firestore
    .collection("challengeNominations")
    .where("challengeId", "==", challengeId)
    .get();

  const all: NominationRecord[] = snap.docs.map(
    (doc: QueryDocumentSnapshot) => ({
      ref: doc.ref,
      data: doc.data() as NominationDoc,
    }),
  );

  const picks = [...all]
    .sort(
      (a, b) =>
        (b.data.voteCount ?? 0) - (a.data.voteCount ?? 0) ||
        (a.data.createdAt?.toMillis() ?? 0) -
          (b.data.createdAt?.toMillis() ?? 0),
    )
    .slice(0, CHALLENGE_SONG_COUNT)
    .map((record) => toChallengeSong(record.data, record.data.voteCount ?? 0));

  return { picks, all };
};

/**
 * A quiet month must not leave the board empty, so any unfilled slots fall back
 * to the library's most-practised songs. They carry 0 votes, which the UI shows
 * as a wildcard pick rather than a community choice.
 */
const fillWithPopularSongs = async (
  picked: ChallengeSong[],
): Promise<ChallengeSong[]> => {
  const missing = CHALLENGE_SONG_COUNT - picked.length;
  if (missing <= 0) return picked;

  const snap = await firestore
    .collection("songs")
    .orderBy("popularity", "desc")
    .limit(CHALLENGE_SONG_COUNT * 4)
    .get();

  const alreadyPicked = new Set(picked.map((song) => song.songId));
  const fillers = snap.docs
    .filter((doc: QueryDocumentSnapshot) => !alreadyPicked.has(doc.id))
    .slice(0, missing)
    .map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return toChallengeSong(
        {
          songId: doc.id,
          title: data.title ?? "Unknown",
          artist: data.artist ?? "Unknown",
          coverUrl: data.coverUrl,
          tier: data.tier,
          avgDifficulty: data.avgDifficulty,
        },
        0,
      );
    });

  return [...picked, ...fillers];
};

/**
 * Nominations from this month's ballot that didn't make the cut. Bumps their
 * "months without a board entry" counter, drops anything that's missed the
 * board `MAX_MONTHS_WITHOUT_BOARD_ENTRY` times running, and carries the rest
 * forward onto next month's ballot with votes reset — nominating stays a
 * one-time cost, backing it again each month doesn't.
 *
 * Firestore transactions require every read to happen before any write, so
 * this runs in two passes: first resolve which next-month docs already exist
 * (a player may have already nominated the same song fresh), then apply all
 * the deletes/sets/updates.
 */
const carryOverLosingNominations = async (
  transaction: Transaction,
  losers: NominationRecord[],
  nextChallengeId: string,
): Promise<void> => {
  const toDrop: NominationRecord[] = [];
  const toCarry: Array<{ record: NominationRecord; newCounter: number }> = [];

  for (const record of losers) {
    const newCounter = (record.data.monthsWithoutBoardEntry ?? 0) + 1;
    if (newCounter >= MAX_MONTHS_WITHOUT_BOARD_ENTRY) {
      toDrop.push(record);
    } else {
      toCarry.push({ record, newCounter });
    }
  }

  // ── Read phase: resolve every next-month target doc before writing anything ──
  const nextRefs = toCarry.map(({ record }) =>
    firestore
      .collection("challengeNominations")
      .doc(nominationDocId(nextChallengeId, record.data.songId)),
  );
  const nextSnaps =
    nextRefs.length > 0 ? await transaction.getAll(...nextRefs) : [];

  // ── Write phase ──
  for (const record of toDrop) {
    transaction.delete(record.ref);
  }

  toCarry.forEach(({ record, newCounter }, index) => {
    const nextRef = nextRefs[index];
    const nextSnap = nextSnaps[index];

    if (!nextSnap.exists) {
      // Nobody's nominated it fresh this month — carry it over with a clean slate.
      transaction.set(nextRef, {
        ...record.data,
        challengeId: nextChallengeId,
        voters: [],
        voteCount: 0,
        monthsWithoutBoardEntry: newCounter,
      });
    } else {
      // Already re-nominated with real votes this month — don't clobber those,
      // just keep its streak counter in sync.
      transaction.update(nextRef, { monthsWithoutBoardEntry: newCounter });
    }

    // The losing doc is superseded by the carried-over (or already-existing)
    // one on next month's ballot — drop it so it doesn't linger forever.
    transaction.delete(record.ref);
  });
};

/**
 * Draws the current month's challenge board if it doesn't exist yet.
 *
 * Idempotent: the board is a single doc keyed by `YYYY-MM`, created inside a
 * transaction, so concurrent callers (every player opening the page on the 1st,
 * plus any cron hitting this route) all collapse into one draw. Runs through
 * the Admin SDK so vote counts can't be forged on the way in.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const challengeId = currentChallengeId();
  const challengeRef: DocumentReference = firestore
    .collection("challenges")
    .doc(challengeId);

  try {
    const existing = await challengeRef.get();
    if (existing.exists) {
      return res.status(200).json({ challengeId, created: false });
    }

    // Same ballot decides both the board and who gets carried forward, so
    // this is fetched once and reused for both.
    const { picks, all: ballot } = await fetchBallot(challengeId);
    const songs = await fillWithPopularSongs(picks);
    if (songs.length === 0) {
      return res
        .status(503)
        .json({ error: "No songs available to draw a challenge from" });
    }

    const { startsAt, endsAt } = challengeWindow(challengeId);
    const boardSongIds = new Set(songs.map((s) => s.songId));
    const losers = ballot.filter(
      (record) => !boardSongIds.has(record.data.songId),
    );
    const nextChallengeId = shiftChallengeId(challengeId, 1);

    const created = await firestore.runTransaction(
      async (transaction: Transaction) => {
        const snapshot = await transaction.get(challengeRef);
        if (snapshot.exists) return false;

        // Carry over (or auto-clean) this month's ballot losers onto next
        // month's ballot — must run before the board write below, since it
        // does its own reads that have to land before any writes.
        await carryOverLosingNominations(transaction, losers, nextChallengeId);

        transaction.set(challengeRef, {
          title: `${challengeMonthLabel(challengeId)} Challenge`,
          status: "active",
          songs,
          startsAt: Timestamp.fromDate(startsAt),
          endsAt: Timestamp.fromDate(endsAt),
          submissionCount: 0,
          finisherCount: 0,
          createdAt: Timestamp.now(),
        });
        return true;
      },
    );

    return res
      .status(200)
      .json({ challengeId, created, songCount: songs.length });
  } catch (error) {
    console.error("Failed to ensure current challenge:", error);
    return res
      .status(500)
      .json({ error: "Failed to ensure current challenge" });
  }
}
