import { logger } from "feature/logger/Logger";
import {
  FAME_ON_LIKE,
  FAME_ON_SAVE,
  getPlaylistPopularity,
  type Playlist,
  type PlaylistDraft,
  type PlaylistSongEntry,
} from "feature/songs/types/playlist.types";
import type { Song } from "feature/songs/types/songs.type";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";
import {
  trackedGetDoc,
  trackedGetDocs,
} from "utils/firebase/client/firestoreTracking";

const PLAYLISTS_COLLECTION = "playlists";
const CACHE_TTL = 2 * 60 * 1000;

const userCacheKey = (userId: string) => `playlists:user:${userId}`;
const PUBLIC_CACHE_KEY = "playlists:public";

const invalidatePlaylistCaches = () => memoryCache.clear("playlists:");

/** Firestore rejects `undefined` values — keep only defined snapshot fields. */
export const songToEntry = (song: Song): PlaylistSongEntry => {
  const entry: PlaylistSongEntry = {
    songId: song.id,
    title: song.title,
    artist: song.artist,
    addedAt: Timestamp.now(),
  };
  if (song.coverUrl) entry.coverUrl = song.coverUrl;
  if (song.tier) entry.tier = song.tier;
  if (song.avgDifficulty !== undefined) entry.avgDifficulty = song.avgDifficulty;
  return entry;
};

export const getUserPlaylists = async (userId: string): Promise<Playlist[]> => {
  const cached = memoryCache.get(userCacheKey(userId));
  if (cached) return cached;

  try {
    const q = query(
      collection(db, PLAYLISTS_COLLECTION),
      where("ownerId", "==", userId)
    );
    const snap = await trackedGetDocs(q);
    const playlists = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Playlist))
      .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
    memoryCache.set(userCacheKey(userId), playlists, CACHE_TTL);
    return playlists;
  } catch (error) {
    logger.error(error, { context: "getUserPlaylists" });
    return [];
  }
};

export const getPublicPlaylists = async (): Promise<Playlist[]> => {
  const cached = memoryCache.get(PUBLIC_CACHE_KEY);
  if (cached) return cached;

  try {
    const q = query(
      collection(db, PLAYLISTS_COLLECTION),
      where("isPublic", "==", true),
      limit(60)
    );
    const snap = await trackedGetDocs(q);
    const playlists = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Playlist))
      .sort(
        (a, b) =>
          getPlaylistPopularity(b) - getPlaylistPopularity(a) ||
          (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0)
      );
    memoryCache.set(PUBLIC_CACHE_KEY, playlists, CACHE_TTL);
    return playlists;
  } catch (error) {
    logger.error(error, { context: "getPublicPlaylists" });
    return [];
  }
};

/** Reads a single playlist — works for foreign playlists as long as they are public. */
export const getPlaylistById = async (playlistId: string): Promise<Playlist | null> => {
  try {
    const snap = await trackedGetDoc(doc(db, PLAYLISTS_COLLECTION, playlistId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Playlist;
  } catch (error) {
    // Permission error for a private playlist behaves like "not found" for the viewer.
    logger.error(error, { context: "getPlaylistById" });
    return null;
  }
};

/** Writes a `playlist_created` entry to the shared activity feed (logs collection). */
const logPlaylistCreated = async (params: {
  playlistId: string;
  userId: string;
  userName: string | null | undefined;
  userAvatar: string | null | undefined;
  name: string;
  kind: Playlist["kind"];
  songCount: number;
}) => {
  const logRef = doc(collection(db, "logs"));
  await setDoc(logRef, {
    type: "playlist_created",
    uid: params.userId,
    userName: params.userName ?? "Someone",
    avatarUrl: params.userAvatar ?? null,
    playlistId: params.playlistId,
    playlistName: params.name,
    playlistKind: params.kind,
    songCount: params.songCount,
    data: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  });
};

export const createPlaylist = async (
  userId: string,
  ownerName: string | null | undefined,
  ownerAvatar: string | null | undefined,
  draft: PlaylistDraft
): Promise<string> => {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, PLAYLISTS_COLLECTION), {
    name: draft.name,
    description: draft.description ?? "",
    kind: draft.kind,
    ownerId: userId,
    ownerName: ownerName ?? "",
    ownerAvatar: ownerAvatar ?? "",
    isPublic: draft.isPublic,
    songs: draft.songs,
    importCount: 0,
    likeCount: 0,
    likes: [],
    createdAt: now,
    updatedAt: now,
  });
  invalidatePlaylistCaches();

  // Announce it in the global activity feed (best-effort — never block creation).
  logPlaylistCreated({
    playlistId: docRef.id,
    userId,
    userName: ownerName,
    userAvatar: ownerAvatar,
    name: draft.name,
    kind: draft.kind,
    songCount: draft.songs.length,
  }).catch((error) => logger.error(error, { context: "logPlaylistCreated" }));

  return docRef.id;
};

export const updatePlaylistMeta = async (
  playlistId: string,
  meta: Partial<Pick<Playlist, "name" | "description" | "isPublic">>
) => {
  await updateDoc(doc(db, PLAYLISTS_COLLECTION, playlistId), {
    ...meta,
    updatedAt: Timestamp.now(),
  });
  invalidatePlaylistCaches();
};

/** Single write path for add / remove / reorder — the array order is the display order. */
export const setPlaylistSongs = async (
  playlistId: string,
  songs: PlaylistSongEntry[]
) => {
  await updateDoc(doc(db, PLAYLISTS_COLLECTION, playlistId), {
    songs,
    updatedAt: Timestamp.now(),
  });
  invalidatePlaylistCaches();
};

export const deletePlaylist = async (playlistId: string) => {
  await deleteDoc(doc(db, PLAYLISTS_COLLECTION, playlistId));
  invalidatePlaylistCaches();
};

/**
 * Increments a popularity counter on a playlist, awards the author fame, and
 * sends them a notification — all in one transaction. Used by save/import.
 */
const rewardPlaylistAuthor = async (params: {
  playlistId: string;
  authorId: string;
  actorId: string;
  playlistName: string;
  fame: number;
  counterField: "importCount";
  notificationType: "playlist_saved";
}) => {
  await runTransaction(db, async (transaction) => {
    const playlistRef = doc(db, PLAYLISTS_COLLECTION, params.playlistId);
    const actorRef = doc(db, "users", params.actorId);

    const actorSnap = await transaction.get(actorRef);
    const actorData = actorSnap.data();

    transaction.update(playlistRef, {
      [params.counterField]: increment(1),
    });

    if (params.authorId && params.authorId !== params.actorId) {
      transaction.update(doc(db, "users", params.authorId), {
        "statistics.fame": increment(params.fame),
      });

      if (actorData) {
        const notificationRef = doc(collection(db, "notifications"));
        transaction.set(notificationRef, {
          userId: params.authorId,
          senderId: params.actorId,
          senderName: actorData.displayName || "Someone",
          senderAvatarUrl: actorData.avatar || actorData.photoURL || null,
          senderFrame: actorData.selectedFrame ?? actorData.statistics?.lvl ?? 0,
          type: params.notificationType,
          playlistId: params.playlistId,
          playlistName: params.playlistName,
          fameAwarded: params.fame,
          isRead: false,
          timestamp: serverTimestamp(),
        });
      }
    }
  });
};

/**
 * Copies a public playlist into the user's own library, bumps the source's
 * popularity, and rewards the author with fame + a notification — mirroring the
 * cross-user fame/notification pattern used by log reactions ("motivate").
 */
export const importPlaylist = async (
  source: Playlist,
  userId: string,
  ownerName: string | null | undefined,
  ownerAvatar: string | null | undefined
): Promise<string> => {
  const now = Timestamp.now();
  const copyRef = await addDoc(collection(db, PLAYLISTS_COLLECTION), {
    name: source.name,
    description: source.description ?? "",
    kind: source.kind,
    ownerId: userId,
    ownerName: ownerName ?? "",
    ownerAvatar: ownerAvatar ?? "",
    isPublic: false,
    songs: source.songs,
    importCount: 0,
    likeCount: 0,
    likes: [],
    importedFrom: {
      playlistId: source.id,
      ownerName: source.ownerName ?? "",
    },
    createdAt: now,
    updatedAt: now,
  });

  // Bump popularity + reward the author. Best-effort: the copy is already saved,
  // so a failure here must not surface as a failed import.
  try {
    await rewardPlaylistAuthor({
      playlistId: source.id,
      authorId: source.ownerId,
      actorId: userId,
      playlistName: source.name,
      fame: FAME_ON_SAVE,
      counterField: "importCount",
      notificationType: "playlist_saved",
    });
  } catch (error) {
    logger.error(error, { context: "importPlaylist:reward" });
  }

  invalidatePlaylistCaches();
  return copyRef.id;
};

/**
 * Toggles the current user's like on a public playlist. Liking rewards the
 * author with fame + a notification; unliking reverses the fame and counter.
 * Returns the resulting like state so the caller can update its UI.
 */
export const togglePlaylistLike = async (
  playlist: Playlist,
  userId: string
): Promise<{ liked: boolean }> => {
  const alreadyLiked = (playlist.likes ?? []).includes(userId);
  const liking = !alreadyLiked;

  try {
    await runTransaction(db, async (transaction) => {
      const playlistRef = doc(db, PLAYLISTS_COLLECTION, playlist.id);
      const actorRef = doc(db, "users", userId);

      const actorSnap = await transaction.get(actorRef);
      const actorData = actorSnap.data();

      transaction.update(playlistRef, {
        likes: liking ? arrayUnion(userId) : arrayRemove(userId),
        likeCount: increment(liking ? 1 : -1),
      });

      if (playlist.ownerId && playlist.ownerId !== userId) {
        transaction.update(doc(db, "users", playlist.ownerId), {
          "statistics.fame": increment(liking ? FAME_ON_LIKE : -FAME_ON_LIKE),
        });

        if (liking && actorData) {
          const notificationRef = doc(collection(db, "notifications"));
          transaction.set(notificationRef, {
            userId: playlist.ownerId,
            senderId: userId,
            senderName: actorData.displayName || "Someone",
            senderAvatarUrl: actorData.avatar || actorData.photoURL || null,
            senderFrame: actorData.selectedFrame ?? actorData.statistics?.lvl ?? 0,
            type: "playlist_liked",
            playlistId: playlist.id,
            playlistName: playlist.name,
            fameAwarded: FAME_ON_LIKE,
            isRead: false,
            timestamp: serverTimestamp(),
          });
        }
      }
    });
  } catch (error) {
    logger.error(error, { context: "togglePlaylistLike" });
    throw error;
  }

  invalidatePlaylistCaches();
  return { liked: liking };
};
