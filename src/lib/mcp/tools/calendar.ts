import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { communityToExercise } from "feature/communityExercises/utils/communityToExercise";
import type {
  CalendarDays,
  CalendarItem,
  PracticeArea,
} from "feature/practiceCalendar/types/calendar.types";
import { addDays } from "feature/practiceCalendar/utils/calendarDates";
import {
  defaultSongMode,
  MAX_SLOT_MINUTES,
  MIN_SLOT_MINUTES,
  newItemId,
} from "feature/practiceCalendar/utils/calendarItems";
import {
  parseDays,
  parseLinks,
} from "feature/practiceCalendar/utils/calendarParse";
import {
  diffLinks,
  linkedSiblings,
  unlinkDates,
} from "feature/practiceCalendar/utils/linkedDays";
import { categoryToArea } from "feature/practiceCalendar/utils/planner";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import { consumeWriteQuota, type McpContext } from "../auth";
import {
  buildDaySlots,
  CALENDAR_DAYS_AHEAD,
  dateProblem,
  isRealDateKey,
  type SlotPlan,
} from "../calendarDays";
import {
  exercisesById,
  readOwnExercise,
  readUser,
  resolveTimeZone,
  todayIn,
  userRef,
} from "../data";
import { firestore } from "../db";
import {
  appLink,
  docId,
  errorResult,
  IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
  jsonResult,
  McpToolError,
  READ_TOOL_ANNOTATIONS,
  runTool,
  strictInput,
} from "../results";

/** The app keeps this many days back on the doc; older ones are dropped on a write. */
const KEEP_DAYS_BACK = 90;
const MAX_DAYS_PER_WRITE = 14;
const MAX_SLOTS_PER_DAY = 12;
const MAX_NOTE_LENGTH = 140;

const AREAS = [
  "technique",
  "theory",
  "hearing",
  "creativity",
  "songs",
] as const satisfies readonly PracticeArea[];

const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const minutesInput = z
  .number()
  .int()
  .min(MIN_SLOT_MINUTES)
  .max(MAX_SLOT_MINUTES);

const slotInput = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("exercise"),
      id: docId().describe("Library or own exercise id"),
      minutes: minutesInput,
      warmup: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("song"),
      songId: docId(),
      minutes: minutesInput,
      mode: z.enum(["gp", "sections"]).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("custom"),
      title: z.string().min(1).max(80),
      minutes: minutesInput,
      area: z.enum(AREAS).optional().describe("Default: technique"),
      note: z.string().max(MAX_NOTE_LENGTH).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("keep"),
      slotId: z.string().min(1).max(64),
      minutes: minutesInput.optional(),
    })
    .strict(),
]);

type SlotInput = z.infer<typeof slotInput>;

const calendarRef = (uid: string) =>
  userRef(uid).collection("settings").doc("calendar");

/** A slot as the tools show it: what it plays, never the stored fields. */
const slotView = (item: CalendarItem) => {
  const exercise = item.exerciseId
    ? exercisesById.get(item.exerciseId)
    : undefined;
  return {
    slotId: item.id,
    type: item.kind,
    title: item.song?.title ?? exercise?.title ?? item.title ?? "",
    ...(item.song && { artist: item.song.artist, songId: item.song.id }),
    ...(item.song && item.songMode && { mode: item.songMode }),
    ...(item.exerciseId && { exerciseId: item.exerciseId }),
    ...(item.kind === "goal" && item.bpm && { bpm: item.bpm }),
    ...(item.note && { note: item.note }),
    area: item.area,
    minutes: item.minutes,
    ...(item.role === "warmup" && { warmup: true }),
    ticked: item.done,
  };
};

const dayView = (
  date: string,
  items: CalendarItem[],
  links: Record<string, string>,
) => {
  const repeatsOn = linkedSiblings(links, date);
  return {
    date,
    totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
    ...(repeatsOn.length > 0 && { repeatsOn }),
    slots: items.map(slotView),
  };
};

export function registerCalendarTools(server: McpServer, context: McpContext) {
  const { uid } = context;

  async function readCalendar() {
    const data = (await calendarRef(uid).get()).data() ?? {};
    return { days: parseDays(data.days), links: parseLinks(data.links) };
  }

  /** Turns the model's slots into calendar slots, checking every id first. */
  async function resolveSlot(
    slot: SlotInput,
    label: string,
  ): Promise<SlotPlan> {
    if (slot.type === "keep") return slot;
    if (slot.type === "custom") {
      const note = slot.note?.trim();
      return {
        type: "new",
        draft: {
          kind: "custom",
          area: slot.area ?? "technique",
          minutes: slot.minutes,
          role: "main",
          title: slot.title.trim(),
          ...(note && { note }),
        },
      };
    }
    if (slot.type === "exercise") {
      const role = slot.warmup ? "warmup" : "main";
      const library = exercisesById.get(slot.id);
      if (library) {
        return {
          type: "new",
          draft: {
            kind: "exercise",
            area: categoryToArea(library.category),
            minutes: slot.minutes,
            role,
            exerciseId: library.id,
          },
        };
      }
      const own = await readOwnExercise(uid, slot.id);
      if (!own) {
        throw new McpToolError(
          `${label}: no exercise "${slot.id}" in the library or among your own exercises.`,
        );
      }
      // The calendar plays only catalog exercises by id; an own exercise
      // goes on as a named slot, the same as a routine imported in the app.
      const exercise = communityToExercise(own.data);
      const note = exercise.description?.trim().slice(0, MAX_NOTE_LENGTH);
      return {
        type: "new",
        draft: {
          kind: "custom",
          area: categoryToArea(exercise.category),
          minutes: slot.minutes,
          role,
          title: exercise.title,
          ...(note && { note }),
        },
      };
    }

    const [song, progress] = await Promise.all([
      firestore.collection("songs").doc(slot.songId).get(),
      userRef(uid).collection("songProgress").doc(slot.songId).get(),
    ]);
    const data = song.data();
    if (!data) {
      throw new McpToolError(
        `${label}: no song "${slot.songId}" — find ids with riffquest_list_songs.`,
      );
    }
    const hasTab = !!progress.data()?.gpFileId;
    if (slot.mode === "gp" && !hasTab) {
      throw new McpToolError(
        `${label}: "${data.title}" has no Guitar Pro tab attached — use mode "sections" or leave mode out.`,
      );
    }
    return {
      type: "new",
      draft: {
        kind: "song",
        area: "songs",
        minutes: slot.minutes,
        role: "main",
        song: {
          id: song.id,
          title: data.title ?? "",
          artist: data.artist ?? "",
          ...(data.coverUrl && { coverUrl: data.coverUrl }),
        },
        songMode: slot.mode ?? defaultSongMode(hasTab),
      },
    };
  }

  server.registerTool(
    "riffquest_get_planned_days",
    {
      title: "Planned practice days",
      description:
        "What the player planned on their practice calendar: each day's slots with slotId, minutes and tick. Empty days are left out.",
      inputSchema: strictInput({
        from: dateInput.optional().describe("YYYY-MM-DD, defaults to today"),
        days: z.number().int().min(1).max(31).optional().describe("Default 7"),
      }),
      annotations: READ_TOOL_ANNOTATIONS,
    },
    ({ from, days }) =>
      runTool("riffquest_get_planned_days", async () => {
        if (from && !isRealDateKey(from)) {
          return errorResult(`"${from}" isn't a date — use YYYY-MM-DD.`);
        }
        const zone = resolveTimeZone(undefined, await readUser(uid));
        const start = from ?? todayIn(zone);
        const end = addDays(start, (days ?? 7) - 1);
        const calendar = await readCalendar();
        const planned = Object.keys(calendar.days)
          .filter(
            (date) =>
              date >= start && date <= end && calendar.days[date].length > 0,
          )
          .sort()
          .map((date) => dayView(date, calendar.days[date], calendar.links));
        return jsonResult({
          from: start,
          to: end,
          today: todayIn(zone),
          days: planned,
          url: appLink("/calendar"),
        });
      }),
  );

  server.registerTool(
    "riffquest_set_calendar_days",
    {
      title: "Plan calendar days",
      description: `Replaces the slots on up to ${MAX_DAYS_PER_WRITE} calendar days (other days stay; [] clears one). A slot playing what the day had keeps its tick; {type:"keep", slotId} keeps one as is, e.g. a goal slot. Changed days stop repeating with linked days. Up to ${CALENDAR_DAYS_AHEAD} days ahead.`,
      inputSchema: strictInput({
        days: z
          .array(
            z
              .object({
                date: dateInput,
                slots: z.array(slotInput).max(MAX_SLOTS_PER_DAY),
              })
              .strict(),
          )
          .min(1)
          .max(MAX_DAYS_PER_WRITE),
      }),
      annotations: IDEMPOTENT_WRITE_TOOL_ANNOTATIONS,
    },
    ({ days }) =>
      runTool("riffquest_set_calendar_days", async () => {
        const zone = resolveTimeZone(undefined, await readUser(uid));
        const today = todayIn(zone);
        const dates = days.map((day) => day.date);
        if (new Set(dates).size !== dates.length) {
          return errorResult("A date is given twice — list each day once.");
        }
        for (const date of dates) {
          const problem = dateProblem(date, today);
          if (problem) return errorResult(problem);
        }

        const plans = await Promise.all(
          days.map((day) =>
            Promise.all(
              day.slots.map((slot, index) =>
                resolveSlot(slot, `${day.date}, slot ${index + 1}`),
              ),
            ),
          ),
        );
        // A kept slot has to be on its day before anything is counted.
        const before = await readCalendar();
        for (const [index, day] of days.entries()) {
          const built = buildDaySlots(
            before.days[day.date] ?? [],
            plans[index],
            newItemId,
          );
          if ("error" in built) {
            return errorResult(
              `${day.date}: ${built.error} See riffquest_get_planned_days.`,
            );
          }
        }

        const left = await consumeWriteQuota(context, "write");
        const ref = calendarRef(uid);
        const written = await firestore.runTransaction(async (transaction) => {
          const data = (await transaction.get(ref)).data() ?? {};
          const stored = parseDays(data.days);
          const links = parseLinks(data.links);

          const next: CalendarDays = {};
          for (const [index, day] of days.entries()) {
            const built = buildDaySlots(
              stored[day.date] ?? [],
              plans[index],
              newItemId,
            );
            if ("error" in built) {
              throw new McpToolError(
                `${day.date}: ${built.error} The calendar changed meanwhile — read it again.`,
              );
            }
            next[day.date] = built.items;
          }

          // The days changed here go their own way, like days the app's
          // auto-planner fills; the rest of their group keeps its plan.
          const cutoff = addDays(today, -KEEP_DAYS_BACK);
          const old = Object.keys(stored).filter((date) => date < cutoff);
          const nextLinks = unlinkDates(links, [...dates, ...old]);
          const linkPatch = diffLinks(links, nextLinks);

          transaction.set(
            ref,
            {
              days: {
                ...Object.fromEntries(
                  old.map((date) => [date, FieldValue.delete()]),
                ),
                ...Object.fromEntries(
                  Object.entries(next).map(([date, items]) => [
                    date,
                    items.length > 0
                      ? items.map((item) =>
                          Object.fromEntries(
                            Object.entries(item).filter(
                              ([, value]) => value !== undefined,
                            ),
                          ),
                        )
                      : FieldValue.delete(),
                  ]),
                ),
              },
              ...(Object.keys(linkPatch).length > 0 && {
                links: Object.fromEntries(
                  Object.entries(linkPatch).map(([date, group]) => [
                    date,
                    group ?? FieldValue.delete(),
                  ]),
                ),
              }),
            },
            { merge: true },
          );
          return { next, links: nextLinks };
        });

        return jsonResult({
          ...left,
          days: dates
            .slice()
            .sort()
            .map((date) => dayView(date, written.next[date], written.links)),
          url: appLink("/calendar"),
        });
      }),
  );
}
