import type { PracticeLogSession } from "feature/practiceLog/types/practiceLog.types";
import { getLocalDateKey } from "utils/converter";

/** Time a session spent on songs: the per-song breakdown, else the whole
 *  session when it was a song session. Plans without songs count nothing. */
export const getSessionSongMs = (session: PracticeLogSession): number => {
  if (session.songs?.length) {
    return session.songs.reduce((sum, song) => sum + (song.practiceMs || 0), 0);
  }
  return session.type === "song" ? session.timeMs : 0;
};

/**
 * Song practice time per local day, in the row shape ActivityChart reads
 * (it sums the four category fields, so the total rides on one of them).
 */
export const getSongPracticeDays = (sessions: PracticeLogSession[]) => {
  const byDay = new Map<string, { date: string; ms: number }>();

  sessions.forEach((session) => {
    const ms = getSessionSongMs(session);
    if (ms <= 0) return;
    const key = getLocalDateKey(session.date);
    const day = byDay.get(key);
    if (day) day.ms += ms;
    else byDay.set(key, { date: session.date.toISOString(), ms });
  });

  return Array.from(byDay.values()).map(({ date, ms }) => ({
    date,
    techniqueTime: ms,
    theoryTime: 0,
    hearingTime: 0,
    creativityTime: 0,
  }));
};
