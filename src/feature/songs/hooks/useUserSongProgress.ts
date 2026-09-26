import {
  attachGpFileToSong,
  detachGpFileFromSong,
  getAllUserSongProgress,
  recordPracticeSession,
  updateArrangementParts,
  updateSongParts,
  type UserSongProgress,
} from "feature/songs/services/userSongProgress.service";
import type { SongArrangement, SongPart } from "feature/songs/types/songs.type";
import { useCallback, useEffect, useState } from "react";

interface UseUserSongProgressReturn {
  progressMap: Record<string, UserSongProgress>;
  isLoading: boolean;
  attachGpFile: (songId: string, gpFileId: string, gpFileName: string, trackIndex?: number) => Promise<void>;
  detachGpFile: (songId: string) => Promise<void>;
  recordSession: (
    songId: string,
    sessionMs: number,
    accuracy: number | null,
    arrangement?: SongArrangement
  ) => Promise<void>;
  /** Without `arrangement` the song-level marks change; with it, only that arrangement's. */
  setSongParts: (songId: string, parts: SongPart[], arrangement?: SongArrangement | null) => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY: UseUserSongProgressReturn = {
  progressMap: {},
  isLoading: false,
  attachGpFile: async () => {},
  detachGpFile: async () => {},
  recordSession: async () => {},
  setSongParts: async () => {},
  refresh: async () => {},
};

const emptyProgress = (songId: string): UserSongProgress => ({
  songId,
  gpFileId: null,
  gpFileName: null,
  selectedTrackIndex: 0,
  totalPracticeMs: 0,
  lastPracticedAt: null,
  bestAccuracy: null,
  lastAccuracy: null,
  sessionCount: 0,
  parts: [],
  arrangements: {},
  lastArrangement: null,
  updatedAt: new Date(),
});

// Progress (sessions, play time, accuracy) is written for every user — free
// practice records sessions too — so reads are not premium-gated. Premium only
// gates GP file attach/detach at the UI level (SongPracticePickerModal).
export const useUserSongProgress = (
  userId: string | null
): UseUserSongProgressReturn => {
  const [progressMap, setProgressMap] = useState<Record<string, UserSongProgress>>({});
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const all = await getAllUserSongProgress(userId);
      const map: Record<string, UserSongProgress> = {};
      for (const p of all) map[p.songId] = p;
      setProgressMap(map);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const attachGpFile = useCallback(
    async (songId: string, gpFileId: string, gpFileName: string, trackIndex = 0) => {
      if (!userId) return;
      await attachGpFileToSong(userId, songId, gpFileId, gpFileName, trackIndex);
      setProgressMap((prev) => ({
        ...prev,
        [songId]: {
          ...(prev[songId] ?? emptyProgress(songId)),
          gpFileId,
          gpFileName,
          selectedTrackIndex: trackIndex,
        },
      }));
    },
    [userId]
  );

  const detachGpFile = useCallback(
    async (songId: string) => {
      if (!userId) return;
      await detachGpFileFromSong(userId, songId);
      setProgressMap((prev) => ({
        ...prev,
        [songId]: { ...prev[songId], gpFileId: null, gpFileName: null, selectedTrackIndex: 0 },
      }));
    },
    [userId]
  );

  const recordSession = useCallback(
    async (songId: string, sessionMs: number, accuracy: number | null, arrangement?: SongArrangement) => {
      if (!userId) return;
      const current = progressMap[songId] ?? null;
      await recordPracticeSession(
        userId,
        songId,
        sessionMs,
        accuracy,
        current?.bestAccuracy ?? null,
        arrangement
      );
      setProgressMap((prev) => {
        const existing = prev[songId] ?? emptyProgress(songId);
        const newBest =
          accuracy !== null
            ? existing.bestAccuracy == null || accuracy > existing.bestAccuracy
              ? accuracy
              : existing.bestAccuracy
            : existing.bestAccuracy;
        const now = new Date();
        const arrangementProgress = arrangement ? existing.arrangements[arrangement] : undefined;
        return {
          ...prev,
          [songId]: {
            ...existing,
            totalPracticeMs: existing.totalPracticeMs + sessionMs,
            sessionCount: existing.sessionCount + 1,
            lastPracticedAt: now,
            bestAccuracy: newBest,
            lastAccuracy: accuracy,
            updatedAt: now,
            ...(arrangement && {
              lastArrangement: arrangement,
              arrangements: {
                ...existing.arrangements,
                [arrangement]: {
                  parts: arrangementProgress?.parts ?? [],
                  totalPracticeMs: (arrangementProgress?.totalPracticeMs ?? 0) + sessionMs,
                  sessionCount: (arrangementProgress?.sessionCount ?? 0) + 1,
                  lastPracticedAt: now,
                },
              },
            }),
          },
        };
      });
    },
    [userId, progressMap]
  );

  const setSongParts = useCallback(
    async (songId: string, parts: SongPart[], arrangement?: SongArrangement | null) => {
      if (!userId) return;
      // Optimistic: the mark animates the moment it's tapped; resync on failure.
      setProgressMap((prev) => {
        const existing = prev[songId] ?? emptyProgress(songId);
        if (!arrangement) return { ...prev, [songId]: { ...existing, parts } };
        const arrangementProgress = existing.arrangements[arrangement];
        return {
          ...prev,
          [songId]: {
            ...existing,
            arrangements: {
              ...existing.arrangements,
              [arrangement]: {
                totalPracticeMs: arrangementProgress?.totalPracticeMs ?? 0,
                sessionCount: arrangementProgress?.sessionCount ?? 0,
                lastPracticedAt: arrangementProgress?.lastPracticedAt ?? null,
                parts,
              },
            },
          },
        };
      });
      try {
        if (arrangement) {
          await updateArrangementParts(userId, songId, arrangement, parts);
        } else {
          await updateSongParts(userId, songId, parts);
        }
      } catch (error) {
        console.error("Error saving song part marks:", error);
        await load();
      }
    },
    [userId, load]
  );

  if (!userId) return EMPTY;

  return { progressMap, isLoading, attachGpFile, detachGpFile, recordSession, setSongParts, refresh: load };
};
