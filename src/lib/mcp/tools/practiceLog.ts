import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MAX_DAYS_BACK } from "constants/gameSettings";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { SongArrangement } from "feature/songs/types/songs.type";
import {
  getLastReportInstant,
  isLastReportTimeExceeded,
} from "feature/user/view/ReportView/helpers/isLastReportTimeExceeded";
import {
  sumSkillMinutesByCategory,
  toSkillTimeGained,
} from "feature/user/view/ReportView/helpers/sessionSkills";
import {
  buildSongsSessionTitle,
  MINUTE_MS,
  pickPrimarySong,
} from "feature/user/view/ReportView/helpers/sessionSongs";
import type {
  HabbitsType,
  ReportFormikInterface,
  ReportSongEntry,
} from "feature/user/view/ReportView/ReportView.types";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getLocalDayKey, isValidTimeZone } from "utils/gameLogic/localDay";
import { z } from "zod";

import { consumeWriteQuota, type McpContext } from "../auth";
import { readUser, userRef } from "../data";
import { firestore } from "../db";
import {
  appLink,
  docId,
  errorResult,
  jsonResult,
  msToMinutes,
  runTool,
  strictInput,
  WRITE_TOOL_ANNOTATIONS,
} from "../results";

const CATEGORIES = ["technique", "theory", "hearing", "creativity"] as const;
type Category = (typeof CATEGORIES)[number];

/** Same ceilings as the report form: 8 h on one box, under 24 h in all. */
const MAX_BOX_MINUTES = 480;
const MAX_SESSION_MINUTES = 24 * 60 - 1;
/** Past this the form asks "are you sure?" — here the tool wants `confirmed`. */
const LONG_SESSION_MINUTES = 6 * 60;
const MAX_SONGS = 20;

const SKILL_IDS = new Set<string>(guitarSkills.map((skill) => skill.id));
const HABITS = [
  "exercise_plan",
  "new_things",
  "warmup",
  "metronome",
  "recording",
] as const satisfies readonly HabbitsType[];

const boxMinutes = () => z.number().int().min(0).max(MAX_BOX_MINUTES);

export const logPracticeInput = strictInput({
  minutes: z
    .object({
      technique: boxMinutes().optional(),
      theory: boxMinutes().optional(),
      hearing: boxMinutes().optional(),
      creativity: boxMinutes().optional(),
    })
    .strict()
    .optional()
    .describe("By category, not tied to a skill or song"),
  skills: z
    .array(
      z
        .object({
          // A plain string with a check, not an enum: the 22 ids would weigh on
          // every conversation the tool list is loaded into.
          skillId: z
            .string()
            .refine((id) => SKILL_IDS.has(id), "Unknown skill id"),
          minutes: z.number().int().min(1).max(MAX_BOX_MINUTES),
        })
        .strict(),
    )
    .max(SKILL_IDS.size)
    .optional()
    .describe("Ids from riffquest_get_skill_breakdown"),
  songs: z
    .array(
      z
        .object({
          songId: docId(),
          minutes: boxMinutes(),
          listeningMinutes: boxMinutes().optional(),
          arrangement: z.enum(["lead", "rhythm", "bass"]).optional(),
        })
        .strict(),
    )
    .max(MAX_SONGS)
    .optional()
    .describe("Ids from riffquest_list_songs"),
  title: z.string().max(120).optional(),
  daysAgo: z.number().int().min(0).max(MAX_DAYS_BACK).optional(),
  habits: z.array(z.enum(HABITS)).max(HABITS.length).optional(),
  confirmed: z
    .boolean()
    .optional()
    .describe("Player confirmed an unusually long session"),
});

type LogPracticeInput = z.infer<typeof logPracticeInput>;

/** The four category totals a log adds up to, in minutes. */
export const sumLogMinutes = ({
  minutes,
  skills,
  songs,
}: Pick<LogPracticeInput, "minutes" | "skills" | "songs">): Record<
  Category,
  number
> => {
  const fromSkills = sumSkillMinutesByCategory(
    Object.fromEntries(
      (skills ?? []).map((skill) => [skill.skillId, skill.minutes]),
    ),
  );
  return Object.fromEntries(
    CATEGORIES.map((category) => {
      const fromSongs = (songs ?? []).reduce(
        (sum, song) =>
          sum +
          (category === "technique"
            ? song.minutes
            : category === "hearing"
              ? (song.listeningMinutes ?? 0)
              : 0),
        0,
      );
      return [
        category,
        (minutes?.[category] ?? 0) + fromSkills[category] + fromSongs,
      ];
    }),
  ) as Record<Category, number>;
};

/** Mirrors the form's song bookkeeping: the song's own progress, and onto "learning". */
async function recordSongPractice(
  uid: string,
  song: ReportSongEntry,
  practicing: boolean,
) {
  const now = Timestamp.now();
  const progress: Record<string, unknown> = {
    songId: song.songId,
    totalPracticeMs: FieldValue.increment(song.practiceMs),
    sessionCount: FieldValue.increment(1),
    lastPracticedAt: now,
    updatedAt: now,
  };
  if (song.arrangement) {
    progress.lastArrangement = song.arrangement;
    progress.arrangements = {
      [song.arrangement]: {
        totalPracticeMs: FieldValue.increment(song.practiceMs),
        sessionCount: FieldValue.increment(1),
        lastPracticedAt: now,
      },
    };
  }
  const userSongRef = userRef(uid).collection("userSongs").doc(song.songId);
  const status = (await userSongRef.get()).data()?.status;
  const moveToLearning = status !== "learning" && status !== "learned";

  await Promise.all([
    userRef(uid)
      .collection("songProgress")
      .doc(song.songId)
      .set(progress, { merge: true }),
    moveToLearning
      ? userSongRef.set(
          {
            songId: song.songId,
            status: "learning",
            title: song.songTitle,
            artist: song.songArtist,
            pointsAwarded: false,
            lastUpdated: now,
          },
          { merge: true },
        )
      : null,
    moveToLearning && !practicing
      ? firestore
          .collection("songs")
          .doc(song.songId)
          .update({
            practicingUsers: FieldValue.arrayUnion(uid),
            popularity: FieldValue.increment(1),
          })
      : null,
  ]);
}

export function registerPracticeLogTools(
  server: McpServer,
  context: McpContext,
) {
  const { uid } = context;

  server.registerTool(
    "riffquest_log_practice",
    {
      title: "Log practice time",
      description:
        "Logs a practice session like the app's report form (points, Fame, streak). minutes, skills and songs add up; song minutes are playing, listeningMinutes ear work. Each call is a new session.",
      inputSchema: logPracticeInput,
      annotations: WRITE_TOOL_ANNOTATIONS,
    },
    (input) =>
      runTool("riffquest_log_practice", async () => {
        const { skills, songs, title, daysAgo, habits, confirmed } = input;
        const byCategory = sumLogMinutes(input);
        const total = CATEGORIES.reduce(
          (sum, category) => sum + byCategory[category],
          0,
        );
        if (total <= 0) {
          return errorResult(
            "Nothing to log — give some minutes by category, skill or song.",
          );
        }
        if (total > MAX_SESSION_MINUTES) {
          return errorResult(
            `${total} minutes is a day or more — one log has to stay under 24 h.`,
          );
        }
        const songIds = (songs ?? []).map((song) => song.songId);
        if (new Set(songIds).size !== songIds.length) {
          return errorResult("Each song can appear once — add its minutes up.");
        }
        if (
          (songs ?? []).some((s) => s.minutes + (s.listeningMinutes ?? 0) <= 0)
        ) {
          return errorResult("A song needs some minutes.");
        }

        const [user, songDocs, lastLog] = await Promise.all([
          readUser(uid),
          Promise.all(
            songIds.map((id) => firestore.collection("songs").doc(id).get()),
          ),
          daysAgo
            ? null
            : userRef(uid)
                .collection("exerciseData")
                .orderBy("__name__", "desc")
                .limit(1)
                .get(),
        ]);
        const missing = songDocs.find((doc) => !doc.exists);
        if (missing) {
          return errorResult(
            `No song "${missing.id}" — find ids with riffquest_list_songs.`,
          );
        }

        if (!confirmed) {
          if (total > LONG_SESSION_MINUTES) {
            return errorResult(
              `${total} minutes is a long session — check it with the player, then call again with confirmed: true.`,
            );
          }
          const lastId = lastLog?.docs[0]?.id;
          const exceeded = isLastReportTimeExceeded(
            getLastReportInstant(lastId ? [{ date: lastId }] : []),
            total * MINUTE_MS,
          );
          if (exceeded) {
            return errorResult(
              `That's ${Math.ceil(exceeded / MINUTE_MS)} min more than has passed since the last log — check it with the player (or use daysAgo for an earlier day), then call again with confirmed: true.`,
            );
          }
        }

        const left = await consumeWriteQuota(context, "write");

        const songEntries: ReportSongEntry[] = (songs ?? []).map(
          (song, index) => {
            const data = songDocs[index].data() ?? {};
            const techniqueMs = song.minutes * MINUTE_MS;
            const hearingMs = (song.listeningMinutes ?? 0) * MINUTE_MS;
            return {
              songId: song.songId,
              songTitle: String(data.title ?? ""),
              songArtist: String(data.artist ?? ""),
              techniqueMs,
              hearingMs,
              practiceMs: techniqueMs + hearingMs,
              ...(song.arrangement && {
                arrangement: song.arrangement as SongArrangement,
              }),
            };
          },
        );
        const primarySong = pickPrimarySong(songEntries);
        const skillTimeGained = toSkillTimeGained(
          Object.fromEntries(
            (skills ?? []).map((skill) => [skill.skillId, skill.minutes]),
          ),
        );

        const storedZone = user.statistics?.timeZone;
        const timeZone = isValidTimeZone(storedZone) ? storedZone : null;
        const now = new Date();
        const box = (category: Category) => String(byCategory[category]);
        const inputData: ReportFormikInterface = {
          techniqueHours: "0",
          techniqueMinutes: box("technique"),
          theoryHours: "0",
          theoryMinutes: box("theory"),
          hearingHours: "0",
          hearingMinutes: box("hearing"),
          creativityHours: "0",
          creativityMinutes: box("creativity"),
          countBackDays: daysAgo ?? 0,
          reportTitle: (
            title?.trim() ||
            buildSongsSessionTitle(
              songEntries.map((song) => ({
                title: song.songTitle,
                artist: song.songArtist,
              })),
            )
          ).slice(0, 120),
          habbits: [...(habits ?? [])],
          avatarUrl: (user as { avatar?: string | null }).avatar ?? null,
          songs: songEntries,
          songId: primarySong?.songId,
          songTitle: primarySong?.songTitle,
          songArtist: primarySong?.songArtist,
          ...(Object.keys(skillTimeGained).length > 0 && { skillTimeGained }),
          // The player's own day, from the zone the app stored with their last
          // report. The streak fields stay unset: the server falls back to its
          // stored counter, which is what it did before the client sent them.
          clientTodayISO: getLocalDayKey(now, timeZone),
          clientNowISO: now.toISOString(),
          ...(timeZone && { clientTimeZone: timeZone }),
        };

        // Loaded on use: it pulls in the report services, which the rest of the
        // MCP server (and its tests) never need.
        const { submitPracticeReport } =
          await import("lib/report/submitPracticeReport");
        const report = await submitPracticeReport(uid, inputData);

        // Song bookkeeping the form does after its report — never worth failing
        // the logged session over.
        const songsRecorded = await Promise.all(
          songEntries.map((song, index) =>
            recordSongPractice(
              uid,
              song,
              (
                (songDocs[index].data()?.practicingUsers ?? []) as string[]
              ).includes(uid),
            ).then(
              () => true,
              (error: unknown) => {
                console.error("[mcp] song progress write failed:", error);
                return false;
              },
            ),
          ),
        );

        const stats = report.currentUserStats;
        return jsonResult({
          ...left,
          logged: true,
          day: daysAgo ? `${daysAgo} day(s) ago` : "today",
          title: inputData.reportTitle || null,
          minutes: total,
          byCategory,
          skills: (skills ?? []).map((skill) => ({
            id: skill.skillId,
            minutes: skill.minutes,
          })),
          songs: songEntries.map((song, index) => ({
            songId: song.songId,
            title: song.songTitle,
            artist: song.songArtist,
            minutes: msToMinutes(song.practiceMs),
            progressSaved: songsRecorded[index],
          })),
          points: report.raitingData.totalPoints,
          fame: report.raitingData.fameEarned,
          level: stats.lvl,
          newLevel: report.isNewLevel,
          streak: stats.streakDays ?? stats.actualDayWithoutBreak,
          newAchievements: report.newAchievements,
          url: appLink("/dashboard"),
        });
      }),
  );
}
