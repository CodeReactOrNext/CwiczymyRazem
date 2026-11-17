import type {
  ImprovErrorCode,
  ImprovOverview,
  ImprovRound,
  ImprovTake,
  ImprovTakeResult,
  ImprovTrack,
  ImprovTrackInfo,
} from "feature/improv/types/improv.types";
import {
  IMPROV_FAME_FOR_JOINING,
  IMPROV_MAX_POOL_TRACKS_PER_USER,
  IMPROV_MAX_TAKES_PER_ROUND,
  IMPROV_NOTE_MAX,
  IMPROV_POINTS_PER_TAKE,
} from "feature/improv/types/improv.types";
import { parseTakeLink } from "feature/improv/utils/improvLink";
import {
  improvRoundId,
  improvRoundIndex,
  improvRoundWindow,
} from "feature/improv/utils/improvRound";
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { lastDiscordError } from "lib/discord/discordBot";
import { firestore } from "utils/firebase/api/firebase.config";

import {
  deleteImprovTakeMessage,
  type ImprovThread,
  improvThreadUrl,
  isImprovDiscordConfigured,
  openImprovThread,
  postImprovTake,
} from "./improvDiscord";

/**
 * Improv rounds, server side. Every write to the three collections goes
 * through here (Admin SDK) — clients have no rule that lets them in — because
 * a take pays points and Fame and triggers a public Discord post.
 *
 *  improvTracks  the pool: backing tracks (YouTube videos) players proposed, with their votes
 *  improvRounds  one doc per five-day window, a frozen copy of the track that won
 *  improvTakes   links players posted on a round
 */
export class ImprovError extends Error {
  constructor(public code: ImprovErrorCode) {
    super(code);
    this.name = "ImprovError";
  }
}

const PAST_ROUNDS_SHOWN = 12;
/** How long a claim on opening the Discord thread holds before another request may retry. */
const THREAD_CLAIM_MS = 60_000;

const rounds = (): CollectionReference =>
  firestore.collection("improvRounds") as CollectionReference;
const tracks = (): CollectionReference =>
  firestore.collection("improvTracks") as CollectionReference;
const takes = (): CollectionReference =>
  firestore.collection("improvTakes") as CollectionReference;
const userRef = (userId: string): DocumentReference =>
  firestore.collection("users").doc(userId) as DocumentReference;

interface ImprovIdentity {
  userId: string;
  displayName: string;
  avatar: string;
  isAdmin: boolean;
}

const readIdentity = async (userId: string): Promise<ImprovIdentity> => {
  const snap: DocumentSnapshot = await userRef(userId).get();
  const user = snap.data() ?? {};
  return {
    userId,
    displayName: user.displayName || "Anonymous",
    avatar: user.avatar || "",
    isAdmin: user.role === "admin",
  };
};

const threadOf = (data: DocumentData): ImprovThread | null =>
  data.discordThreadId && data.discordGuildId
    ? { threadId: data.discordThreadId, guildId: data.discordGuildId }
    : null;

const toRound = (id: string, data: DocumentData): ImprovRound => {
  const thread = threadOf(data);
  return {
    id,
    number: data.number,
    title: data.title,
    channel: data.channel ?? "",
    youtubeId: data.youtubeId,
    uploadedByName: data.uploadedByName ?? "",
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    takeCount: Math.max(0, data.takeCount ?? 0),
    playerCount: data.playerCount ?? 0,
    discordThreadUrl: thread ? improvThreadUrl(thread) : null,
  };
};

const toTrack = (
  doc: QueryDocumentSnapshot,
  userId: string | null,
): ImprovTrack => {
  const data = doc.data();
  const voters: string[] = data.voters ?? [];
  return {
    id: doc.id,
    title: data.title,
    channel: data.channel ?? "",
    youtubeId: data.youtubeId,
    uploadedById: data.uploadedById,
    uploadedByName: data.uploadedByName ?? "",
    voteCount: voters.length,
    hasMyVote: !!userId && voters.includes(userId),
    createdAt: data.createdAt,
  };
};

const toTake = (
  id: string,
  data: DocumentData,
  thread: ImprovThread | null,
): ImprovTake => ({
  id,
  roundId: data.roundId,
  userId: data.userId,
  userName: data.userName,
  userAvatar: data.userAvatar ?? "",
  url: data.url,
  provider: data.provider,
  note: data.note ?? "",
  takeNumber: data.takeNumber,
  createdAt: data.createdAt,
  discordUrl:
    thread && data.discordMessageId
      ? `${improvThreadUrl(thread)}/${data.discordMessageId}`
      : null,
});

/** Most-backed first; the older upload wins a tie, so the pool is also a queue. */
const readPool = async (): Promise<QueryDocumentSnapshot[]> => {
  const snap: QuerySnapshot = await tracks()
    .where("status", "==", "pool")
    .get();
  return [...snap.docs].sort(
    (a, b) =>
      (b.data().voters?.length ?? 0) - (a.data().voters?.length ?? 0) ||
      a.data().createdAt - b.data().createdAt,
  );
};

/**
 * The live round, drawn on first sight.
 *
 * There is no cron: the first request of a new window finds no doc for it,
 * takes the pool's leader and freezes it into the round inside a transaction,
 * so everybody arriving at midnight collapses into one draw. With an empty
 * pool there is no round — the window stays open, and the first track anyone
 * uploads starts it.
 */
const ensureCurrentRound = async (
  now: number,
): Promise<{ ref: DocumentReference; data: DocumentData } | null> => {
  const index = improvRoundIndex(now);
  const ref = rounds().doc(improvRoundId(index));

  const existing: DocumentSnapshot = await ref.get();
  if (existing.exists) return { ref, data: existing.data() as DocumentData };

  const [winner] = await readPool();
  if (!winner) return null;

  const { startsAt, endsAt } = improvRoundWindow(index);
  const data = await firestore.runTransaction(
    async (tx: Transaction): Promise<DocumentData | null> => {
      const roundSnap = await tx.get(ref);
      if (roundSnap.exists) return roundSnap.data() as DocumentData;

      const trackSnap = await tx.get(winner.ref);
      const track = trackSnap.data();
      // Removed, or drawn by a request that got here first — the next visit redraws.
      if (!track || track.status !== "pool") return null;

      const round: DocumentData = {
        number: index + 1,
        trackId: winner.id,
        title: track.title,
        channel: track.channel ?? "",
        youtubeId: track.youtubeId,
        uploadedById: track.uploadedById,
        uploadedByName: track.uploadedByName ?? "",
        startsAt,
        endsAt,
        takeCount: 0,
        playerCount: 0,
        createdAt: now,
      };
      tx.set(ref, round);
      tx.update(winner.ref, { status: "used", roundId: ref.id });
      return round;
    },
  );

  return data ? { ref, data } : null;
};

/**
 * The round's Discord thread, opened once. A short-lived claim keeps two
 * requests from each opening one; a failed attempt drops the claim so the next
 * request (the next visit, or the next take) tries again — which is also how a
 * round drawn before the bot was configured gets its thread later.
 */
/** Discord's "Unknown Channel" — the thread no longer exists. */
const isUnknownChannelError = (error: string | null): boolean =>
  !!error && /"code":\s*10003\b/.test(error);

const NOT_CONFIGURED =
  "DISCORD_BOT_TOKEN or DISCORD_IMPROV_CHANNEL_ID is not set on the server";

interface RoundThreadState {
  thread: ImprovThread | null;
  /** Why there is no thread, for admins. Null when there is one, or one is being opened. */
  issue: string | null;
}

const ensureRoundThread = async (
  ref: DocumentReference,
  now: number,
): Promise<RoundThreadState> => {
  if (!isImprovDiscordConfigured()) {
    return { thread: null, issue: NOT_CONFIGURED };
  }

  const claimed = await firestore.runTransaction(
    async (
      tx: Transaction,
    ): Promise<DocumentData | RoundThreadState | null> => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (!data) return null;
      const thread = threadOf(data);
      if (thread) return { thread, issue: null };
      if (now - (data.discordClaimedAt ?? 0) < THREAD_CLAIM_MS) {
        return { thread: null, issue: data.discordError ?? null };
      }
      tx.update(ref, { discordClaimedAt: now });
      return data;
    },
  );

  if (!claimed) return { thread: null, issue: null };
  if ("issue" in claimed) return claimed as RoundThreadState;

  const thread = await openImprovThread(toRound(ref.id, claimed));
  if (thread) {
    await ref.update({
      discordThreadId: thread.threadId,
      discordGuildId: thread.guildId,
      discordError: FieldValue.delete(),
    });
    return { thread, issue: null };
  }
  const issue = lastDiscordError() ?? "Discord did not answer";
  await ref.update({ discordClaimedAt: 0, discordError: issue });
  return { thread: null, issue };
};

const readTakes = async (
  roundId: string,
  thread: ImprovThread | null,
): Promise<ImprovTake[]> => {
  const snap: QuerySnapshot = await takes()
    .where("roundId", "==", roundId)
    .get();
  return snap.docs
    .filter((doc) => !doc.data().deleted)
    .map((doc) => toTake(doc.id, doc.data(), thread))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getImprovOverview = async (
  userId: string,
): Promise<ImprovOverview> => {
  const now = Date.now();
  const current = await ensureCurrentRound(now);
  const existingThread = current ? threadOf(current.data) : null;
  const threadState: RoundThreadState = !current
    ? { thread: null, issue: null }
    : existingThread
      ? { thread: existingThread, issue: null }
      : await ensureRoundThread(current.ref, now);
  const thread = threadState.thread;

  const [roundTakes, pool, pastSnap, identity] = await Promise.all([
    current ? readTakes(current.ref.id, thread) : Promise.resolve([]),
    readPool(),
    rounds()
      .orderBy("startsAt", "desc")
      .limit(PAST_ROUNDS_SHOWN + 1)
      .get() as Promise<QuerySnapshot>,
    readIdentity(userId),
  ]);

  const round = current
    ? toRound(current.ref.id, {
        ...current.data,
        ...(thread
          ? { discordThreadId: thread.threadId, discordGuildId: thread.guildId }
          : {}),
      })
    : null;

  return {
    now,
    round,
    takes: roundTakes,
    pool: pool.map((doc) => toTrack(doc, userId)),
    past: pastSnap.docs
      .filter((doc) => doc.id !== current?.ref.id)
      .slice(0, PAST_ROUNDS_SHOWN)
      .map((doc) => toRound(doc.id, doc.data())),
    nextRoundStartsAt: improvRoundWindow(improvRoundIndex(now)).endsAt,
    isAdmin: identity.isAdmin,
    discordIssue: identity.isAdmin ? threadState.issue : null,
  };
};

/** The takes of any round — the archive opens closed rounds with this. */
export const getImprovRoundTakes = async (
  roundId: string,
): Promise<ImprovTake[]> => {
  const snap: DocumentSnapshot = await rounds().doc(roundId).get();
  const data = snap.data();
  if (!data) throw new ImprovError("NOT_FOUND");
  return readTakes(roundId, threadOf(data));
};

/**
 * Puts a take on the live round, pays for it and has the bot post it.
 *
 * The Discord post happens after the transaction and never fails the request:
 * a take that Discord refused is still a take, it just has no message link.
 */
export const submitImprovTake = async (
  userId: string,
  rawUrl: unknown,
  rawNote: unknown,
): Promise<ImprovTakeResult> => {
  const link = typeof rawUrl === "string" ? parseTakeLink(rawUrl) : null;
  if (!link) throw new ImprovError("BAD_LINK");
  const note =
    typeof rawNote === "string" ? rawNote.trim().slice(0, IMPROV_NOTE_MAX) : "";

  const now = Date.now();
  const current = await ensureCurrentRound(now);
  if (!current) throw new ImprovError("NO_ROUND");
  const identity = await readIdentity(userId);

  const takeRef = takes().doc();
  const { takeData, isFirst } = await firestore.runTransaction(
    async (tx: Transaction) => {
      // Deleted takes still count: the cap is on rewards paid, and a deleted
      // take keeps what it paid.
      const mine: QuerySnapshot = await tx.get(
        takes()
          .where("roundId", "==", current.ref.id)
          .where("userId", "==", userId),
      );
      if (mine.size >= IMPROV_MAX_TAKES_PER_ROUND)
        throw new ImprovError("LIMIT");
      if (
        mine.docs.some(
          (doc) => !doc.data().deleted && doc.data().url === link.url,
        )
      ) {
        throw new ImprovError("DUPLICATE");
      }

      const first = mine.size === 0;
      const data: DocumentData = {
        roundId: current.ref.id,
        userId,
        userName: identity.displayName,
        userAvatar: identity.avatar,
        url: link.url,
        provider: link.provider,
        note,
        takeNumber: mine.size + 1,
        createdAt: now,
      };
      tx.set(takeRef, data);
      tx.update(current.ref, {
        takeCount: FieldValue.increment(1),
        ...(first ? { playerCount: FieldValue.increment(1) } : {}),
      });
      tx.update(userRef(userId), {
        "statistics.points": FieldValue.increment(IMPROV_POINTS_PER_TAKE),
        ...(first
          ? { "statistics.fame": FieldValue.increment(IMPROV_FAME_FOR_JOINING) }
          : {}),
      });
      return { takeData: data, isFirst: first };
    },
  );

  let thread =
    threadOf(current.data) ??
    (await ensureRoundThread(current.ref, now)).thread;
  let discordMessageId: string | null = null;
  const post = (target: ImprovThread) =>
    postImprovTake(
      target,
      toRound(current.ref.id, current.data),
      toTake(takeRef.id, takeData, null),
    );

  if (thread) {
    discordMessageId = await post(thread);
    // The thread was deleted on Discord: unlink it, open a fresh one and try
    // once more, so a moderator removing a thread can't silence the round.
    if (!discordMessageId && isUnknownChannelError(lastDiscordError())) {
      await current.ref.update({
        discordThreadId: FieldValue.delete(),
        discordGuildId: FieldValue.delete(),
        discordClaimedAt: 0,
      });
      thread = (await ensureRoundThread(current.ref, now)).thread;
      if (thread) discordMessageId = await post(thread);
    }
    if (discordMessageId) await takeRef.update({ discordMessageId });
  }

  return {
    take: toTake(takeRef.id, { ...takeData, discordMessageId }, thread),
    points: IMPROV_POINTS_PER_TAKE,
    fame: isFirst ? IMPROV_FAME_FOR_JOINING : 0,
  };
};

/** The author (or an admin) takes a take down; the bot's message goes with it. */
export const removeImprovTake = async (
  userId: string,
  takeId: unknown,
): Promise<void> => {
  if (typeof takeId !== "string" || !takeId) throw new ImprovError("NOT_FOUND");
  const takeRef = takes().doc(takeId);
  const identity = await readIdentity(userId);

  const removed = await firestore.runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(takeRef);
    const data = snap.data();
    if (!data || data.deleted) throw new ImprovError("NOT_FOUND");
    if (data.userId !== userId && !identity.isAdmin) {
      throw new ImprovError("FORBIDDEN");
    }
    tx.update(takeRef, { deleted: true });
    tx.update(rounds().doc(data.roundId), {
      takeCount: FieldValue.increment(-1),
    });
    return data;
  });

  if (!removed.discordMessageId) return;
  const roundSnap: DocumentSnapshot = await rounds().doc(removed.roundId).get();
  const thread = threadOf(roundSnap.data() ?? {});
  if (thread) {
    await deleteImprovTakeMessage(thread.threadId, removed.discordMessageId);
  }
};

const TRACK_TITLE_MAX = 100;

/**
 * Turns a pasted link into a track. The name and channel come from YouTube's
 * oEmbed endpoint (no API key), which also proves the video exists and may be
 * embedded — a private or removed video answers with an error, and so do we.
 */
const readTrackInfo = async (rawUrl: unknown): Promise<ImprovTrackInfo> => {
  const link = typeof rawUrl === "string" ? parseTakeLink(rawUrl) : null;
  if (!link?.youtubeId) throw new ImprovError("BAD_TRACK");

  let video: { title?: unknown; author_name?: unknown };
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(link.url)}`,
    );
    if (!response.ok) throw new ImprovError("BAD_TRACK");
    video = await response.json();
  } catch {
    throw new ImprovError("BAD_TRACK");
  }

  const title =
    typeof video.title === "string"
      ? video.title.trim().slice(0, TRACK_TITLE_MAX)
      : "";
  if (!title) throw new ImprovError("BAD_TRACK");

  return {
    youtubeId: link.youtubeId,
    title,
    channel:
      typeof video.author_name === "string"
        ? video.author_name.trim().slice(0, TRACK_TITLE_MAX)
        : "",
  };
};

/** Adds a backing track (a YouTube video) to the pool. */
export const proposeImprovTrack = async (
  userId: string,
  rawUrl: unknown,
): Promise<{ trackId: string }> => {
  const info = await readTrackInfo(rawUrl);
  const identity = await readIdentity(userId);

  const mine: QuerySnapshot = await tracks()
    .where("uploadedById", "==", userId)
    .where("status", "==", "pool")
    .get();
  if (mine.size >= IMPROV_MAX_POOL_TRACKS_PER_USER) {
    throw new ImprovError("LIMIT");
  }

  const same: QuerySnapshot = await tracks()
    .where("youtubeId", "==", info.youtubeId)
    .where("status", "==", "pool")
    .limit(1)
    .get();
  if (!same.empty) throw new ImprovError("DUPLICATE");

  const ref = await tracks().add({
    ...info,
    uploadedById: userId,
    uploadedByName: identity.displayName,
    // An upload carries its author's vote — nobody proposes a track they wouldn't play over.
    voters: [userId],
    status: "pool",
    createdAt: Date.now(),
  });
  return { trackId: ref.id };
};

/** Backs a pool track, or takes the vote back. */
export const toggleImprovVote = async (
  userId: string,
  trackId: unknown,
): Promise<{ hasMyVote: boolean }> => {
  if (typeof trackId !== "string" || !trackId) {
    throw new ImprovError("NOT_FOUND");
  }
  const ref = tracks().doc(trackId);

  return firestore.runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!data || data.status !== "pool") throw new ImprovError("NOT_FOUND");
    const had = (data.voters ?? []).includes(userId);
    tx.update(ref, {
      voters: had
        ? FieldValue.arrayRemove(userId)
        : FieldValue.arrayUnion(userId),
    });
    return { hasMyVote: !had };
  });
};

/** The uploader (or an admin) pulls a track out of the pool. */
export const removeImprovTrack = async (
  userId: string,
  trackId: unknown,
): Promise<void> => {
  if (typeof trackId !== "string" || !trackId) {
    throw new ImprovError("NOT_FOUND");
  }
  const ref = tracks().doc(trackId);
  const identity = await readIdentity(userId);

  await firestore.runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!data || data.status !== "pool") throw new ImprovError("NOT_FOUND");
    if (data.uploadedById !== userId && !identity.isAdmin) {
      throw new ImprovError("FORBIDDEN");
    }
    tx.update(ref, { status: "removed" });
  });
};
