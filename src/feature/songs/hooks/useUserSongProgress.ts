import { useCallback, useEffect, useState } from "react";
import {
  attachGpFileToSong,
  detachGpFileFromSong,
  getAllUserSongProgress,
  recordPracticeSession,
  type UserSongProgress,
} from "feature/songs/services/userSongProgress.service";

interface UseUserSongProgressReturn {
  progressMap: Record<string, UserSongProgress>;
  isLoading: boolean;
  attachGpFile: (songId: string, gpFileId: string, gpFileName: string, trackIndex?: number) => Promise<void>;
  detachGpFile: (songId: string) => Promise<void>;
  recordSession: (songId: string, sessionMs: number, accuracy: number | null) => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY: UseUserSongProgressReturn = {
  progressMap: {},
  isLoading: false,
  attachGpFile: async () => {},
  detachGpFile: async () => {},
  recordSession: async () => {},
  refresh: async () => {},
};

export const useUserSongProgress = (
  userId: string | null,
  isPremium: boolean
): UseUserSongProgressReturn => {
  const [progressMap, setProgressMap] = useState<Record<string, UserSongProgress>>({});
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !isPremium) return;
    setIsLoading(true);
    try {
      const all = await getAllUserSongProgress(userId);
      const map: Record<string, UserSongProgress> = {};
      for (const p of all) map[p.songId] = p;
      setProgressMap(map);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isPremium]);

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
          ...(prev[songId] ?? {
            songId,
            totalPracticeMs: 0,
            lastPracticedAt: null,
            bestAccuracy: null,
            lastAccuracy: null,
            sessionCount: 0,
            updatedAt: new Date(),
          }),
          gpFileId,
          gpFileName,
          selectedTrackIndex: trackIndex,
        } as UserSongProgress,
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
    async (songId: string, sessionMs: number, accuracy: number | null) => {
      if (!userId) return;
      const current = progressMap[songId] ?? null;
      await recordPracticeSession(userId, songId, sessionMs, accuracy, current?.bestAccuracy ?? null);
      setProgressMap((prev) => {
        const existing = prev[songId];
        const newBest =
          accuracy !== null
            ? existing?.bestAccuracy == null || accuracy > existing.bestAccuracy
              ? accuracy
              : existing.bestAccuracy
            : existing?.bestAccuracy ?? null;
        return {
          ...prev,
          [songId]: {
            ...(existing ?? {
              songId,
              gpFileId: null,
              gpFileName: null,
              selectedTrackIndex: 0,
            }),
            totalPracticeMs: (existing?.totalPracticeMs ?? 0) + sessionMs,
            sessionCount: (existing?.sessionCount ?? 0) + 1,
            lastPracticedAt: new Date(),
            bestAccuracy: newBest,
            lastAccuracy: accuracy,
            updatedAt: new Date(),
          } as UserSongProgress,
        };
      });
    },
    [userId, progressMap]
  );

  if (!userId || !isPremium) return EMPTY;

  return { progressMap, isLoading, attachGpFile, detachGpFile, recordSession, refresh: load };
};
