import { getLocalDateKey } from "utils/converter";
import { buildCsv, downloadCsv } from "utils/csvExport";

import type { Song, SongStatus } from "../types/songs.type";
import type { getUserSongs } from "./getUserSongs";

type UserSongLibrary = Awaited<ReturnType<typeof getUserSongs>>;

const STATUS_LABELS: Record<SongStatus, string> = {
  learned: "Learned",
  learning: "Learning",
  wantToLearn: "Want to learn",
};

const CSV_HEADERS = [
  "Title",
  "Artist",
  "Status",
  "Mastery %",
  "Avg. difficulty",
  "Tier",
];

const toRow = (song: Song, status: SongStatus) => [
  song.title,
  song.artist,
  STATUS_LABELS[status],
  song.masteryProgress ?? 0,
  song.avgDifficulty ?? "",
  song.tier ?? "",
];

export const buildSongProgressCsv = (library: UserSongLibrary): string => {
  const rows = [
    ...library.learned.map((song) => toRow(song, "learned")),
    ...library.learning.map((song) => toRow(song, "learning")),
    ...library.wantToLearn.map((song) => toRow(song, "wantToLearn")),
  ];

  return buildCsv(CSV_HEADERS, rows);
};

export const downloadSongProgressCsv = (
  library: UserSongLibrary,
  filename = `riffquest-songs-${getLocalDateKey(new Date())}.csv`
) => downloadCsv(buildSongProgressCsv(library), filename);
