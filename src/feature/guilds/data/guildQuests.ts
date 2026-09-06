/**
 * The guild's quests: fifty milestones in ten chapters of five — and then the
 * same fifty again with the numbers doubled, then tripled, for as long as a
 * guild keeps going.
 *
 * A quest is a milestone rather than a week. It is counted from the day the
 * guild was founded, over whoever is on the roster, and once it is cleared it
 * stays cleared — a guild's level is simply how many quests it has behind it,
 * with no ceiling. Chapters open one at a time: the five quests of a chapter
 * are worked on together, and the next chapter opens the moment all five are
 * done, so a guild always has a handful of different things to chase and can
 * never get stuck on one it does not care for. When the tenth chapter closes
 * the ladder starts over as a second *lap*, every target and every reward
 * scaled by `lapMultiplier` — the catalog below is only ever lap one, and
 * `scaleQuest` is what turns it into any lap after.
 *
 * Every quest is measured out of things the app already writes down — practice
 * reports, the roster's own statistics, songs marked learned, recordings, the
 * activity log, the guild's treasury. Nothing here is a counter a client could
 * increment, which is the same choice the community goal made, for the same
 * reason. `lib/guild/guildQuests.ts` does the measuring; this file is only the
 * catalog and the arithmetic that needs no database.
 *
 * Most targets are flat guild totals, on purpose: a level is a thing the guild
 * has done, and a bigger guild doing more is exactly what a level should say.
 * The quests that count members are the counterweight — "four members with
 * twenty sessions each" cannot be bought by one person practising for
 * everybody. They ask for a fixed handful rather than the whole roster, so one
 * member who signed up and never played cannot hold the chapter shut on the
 * rest — there is no way to remove them, and a level that depends on the least
 * active person in the room is a level nobody reaches.
 */

/**
 * A practice-report field a quest can be counted over. All of them come out of
 * the same two aggregation queries per member, so a quest on any of these costs
 * the guild nothing it was not already paying for the roster's tallies.
 */
export type QuestReportField =
  | "sessions"
  | "time"
  | "technique"
  | "theory"
  | "hearing"
  | "creativity"
  | "points";

export type QuestLogType = "daily_quest_completed" | "journey_exam_passed";

/** How a quest is measured. See `lib/guild/guildQuests.ts` for each one's query. */
export type QuestMeasure =
  /** The whole roster's reports added up, since the guild was founded. */
  | { kind: "reports"; field: QuestReportField; scope: "guild" }
  /** Members who have reached `each` of the field on their own, counted. */
  | { kind: "reports"; field: QuestReportField; scope: "each"; each: number }
  /** Members with at least `hoursEach` hours in every one of the four practice categories, counted. */
  | { kind: "allCategoriesEach"; hoursEach: number }
  /** Fame ever put into the guild's treasury, all members together. */
  | { kind: "treasury" }
  /** Members whose current daily streak is at least `days`, right now. */
  | { kind: "streak"; days: number }
  /** Songs the roster has marked as learned, added up. */
  | { kind: "songsLearned" }
  /** Recordings the roster has published. */
  | { kind: "recordings" }
  /** Entries in the activity log of one type, per member, added up. */
  | { kind: "logs"; type: QuestLogType }
  /** Monthly challenge entries the roster has sent in. */
  | { kind: "submissions" };

/** What a quest's numbers are stated in. */
export type QuestUnit =
  | "sessions"
  | "hours"
  | "fame"
  | "members"
  | "songs"
  | "recordings"
  | "quests"
  | "exams"
  | "entries"
  | "points";

export interface GuildQuestChapter {
  name: string;
  blurb: string;
  /** Fame every eligible member claims per quest cleared in this chapter. */
  reward: number;
}

export interface GuildQuest {
  id: string;
  /** Index into `GUILD_QUEST_CHAPTERS`. */
  chapter: number;
  name: string;
  blurb: string;
  measure: QuestMeasure;
  /** What is asked, in `unit` — for the quests that count members, how many. */
  target: number;
}

export const GUILD_QUEST_CHAPTERS: GuildQuestChapter[] = [
  {
    name: "Warm-up",
    blurb: "Show up together and start counting.",
    reward: 40,
  },
  {
    name: "Rehearsal",
    blurb: "The hours start to add up, and the ears join in.",
    reward: 60,
  },
  {
    name: "Repertoire",
    blurb: "Songs learned, songs played, songs recorded.",
    reward: 80,
  },
  {
    name: "Discipline",
    blurb: "Everybody pulling, every day.",
    reward: 100,
  },
  {
    name: "Balanced",
    blurb: "Every side of playing, from every member.",
    reward: 125,
  },
  {
    name: "Tempo",
    blurb: "Examined, a thousand sessions deep, with the theory to match.",
    reward: 150,
  },
  {
    name: "Stage",
    blurb: "Out in front of people, with the guild's name on it.",
    reward: 200,
  },
  {
    name: "Machine",
    blurb: "The guild runs itself. A thousand hours behind it.",
    reward: 250,
  },
  {
    name: "Scholars",
    blurb: "The hard categories, in serious quantities.",
    reward: 300,
  },
  {
    name: "Legends",
    blurb: "Numbers most guilds never see.",
    reward: 400,
  },
];

export const GUILD_QUESTS_PER_CHAPTER = 5;

const guildReports = (
  field: QuestReportField,
): Extract<QuestMeasure, { scope: "guild" }> => ({
  kind: "reports",
  field,
  scope: "guild",
});

const eachReports = (
  field: QuestReportField,
  each: number,
): Extract<QuestMeasure, { scope: "each" }> => ({
  kind: "reports",
  field,
  scope: "each",
  each,
});

/**
 * The fifty, chapter by chapter. Ids are stable and stored on guild documents
 * once cleared, so a rename changes `name` and never `id`.
 */
export const GUILD_QUESTS: GuildQuest[] = [
  // 1 · Warm-up
  {
    id: "sessions-100",
    chapter: 0,
    name: "First Hundred",
    blurb: "A hundred practice sessions between you.",
    measure: guildReports("sessions"),
    target: 100,
  },
  {
    id: "hours-50",
    chapter: 0,
    name: "Fifty Hours",
    blurb: "Fifty hours of practice, all told.",
    measure: guildReports("time"),
    target: 50,
  },
  {
    id: "members-sessions-5-x3",
    chapter: 0,
    name: "Three Regulars",
    blurb: "Three members with five sessions each.",
    measure: eachReports("sessions", 5),
    target: 3,
  },
  {
    id: "technique-10",
    chapter: 0,
    name: "Hands On",
    blurb: "Ten hours on technique.",
    measure: guildReports("technique"),
    target: 10,
  },
  {
    id: "treasury-300",
    chapter: 0,
    name: "Seed Money",
    blurb: "Three hundred Fame put into the guild's own.",
    measure: { kind: "treasury" },
    target: 300,
  },

  // 2 · Rehearsal
  {
    id: "sessions-250",
    chapter: 1,
    name: "Quarter Thousand",
    blurb: "Two hundred and fifty sessions.",
    measure: guildReports("sessions"),
    target: 250,
  },
  {
    id: "hours-150",
    chapter: 1,
    name: "Long Haul",
    blurb: "A hundred and fifty hours of practice.",
    measure: guildReports("time"),
    target: 150,
  },
  {
    id: "theory-25",
    chapter: 1,
    name: "Bookworms",
    blurb: "Twenty-five hours of theory.",
    measure: guildReports("theory"),
    target: 25,
  },
  {
    id: "hearing-25",
    chapter: 1,
    name: "Open Ears",
    blurb: "Twenty-five hours of ear training.",
    measure: guildReports("hearing"),
    target: 25,
  },
  {
    id: "streak-7-x3",
    chapter: 1,
    name: "Three Flames",
    blurb: "Three members on a seven-day streak at the same time.",
    measure: { kind: "streak", days: 7 },
    target: 3,
  },

  // 3 · Repertoire
  {
    id: "songs-learned-25",
    chapter: 2,
    name: "Setlist",
    blurb: "Twenty-five songs marked learned across the guild.",
    measure: { kind: "songsLearned" },
    target: 25,
  },
  {
    id: "points-2000",
    chapter: 2,
    name: "Two Thousand Points",
    blurb: "Two thousand practice points scored between you.",
    measure: guildReports("points"),
    target: 2000,
  },
  {
    id: "recordings-5",
    chapter: 2,
    name: "On Tape",
    blurb: "Five recordings published by members.",
    measure: { kind: "recordings" },
    target: 5,
  },
  {
    id: "technique-50",
    chapter: 2,
    name: "Fifty of Technique",
    blurb: "Fifty hours on technique.",
    measure: guildReports("technique"),
    target: 50,
  },
  {
    id: "creativity-25",
    chapter: 2,
    name: "Jam Room",
    blurb: "Twenty-five hours of creative playing.",
    measure: guildReports("creativity"),
    target: 25,
  },

  // 4 · Discipline
  {
    id: "sessions-500",
    chapter: 3,
    name: "Five Hundred",
    blurb: "Five hundred sessions.",
    measure: guildReports("sessions"),
    target: 500,
  },
  {
    id: "hours-300",
    chapter: 3,
    name: "Three Hundred Hours",
    blurb: "Three hundred hours of practice.",
    measure: guildReports("time"),
    target: 300,
  },
  {
    id: "members-sessions-20-x4",
    chapter: 3,
    name: "Four Regulars",
    blurb: "Four members with twenty sessions each.",
    measure: eachReports("sessions", 20),
    target: 4,
  },
  {
    id: "daily-quests-30",
    chapter: 3,
    name: "Quest Log",
    blurb: "Thirty daily quests completed between you.",
    measure: { kind: "logs", type: "daily_quest_completed" },
    target: 30,
  },
  {
    id: "streak-30-x1",
    chapter: 3,
    name: "The Month",
    blurb: "One member on a thirty-day streak.",
    measure: { kind: "streak", days: 30 },
    target: 1,
  },

  // 5 · Balanced
  {
    id: "technique-100",
    chapter: 4,
    name: "Hundred of Technique",
    blurb: "A hundred hours on technique.",
    measure: guildReports("technique"),
    target: 100,
  },
  {
    id: "theory-50",
    chapter: 4,
    name: "Theory Fifty",
    blurb: "Fifty hours of theory.",
    measure: guildReports("theory"),
    target: 50,
  },
  {
    id: "hearing-50",
    chapter: 4,
    name: "Hearing Fifty",
    blurb: "Fifty hours of ear training.",
    measure: guildReports("hearing"),
    target: 50,
  },
  {
    id: "creativity-50",
    chapter: 4,
    name: "Creative Fifty",
    blurb: "Fifty hours of creative playing.",
    measure: guildReports("creativity"),
    target: 50,
  },
  {
    id: "members-all-categories-x4",
    chapter: 4,
    name: "All-Rounders",
    blurb: "Four members with an hour in each of the four categories.",
    measure: { kind: "allCategoriesEach", hoursEach: 1 },
    target: 4,
  },

  // 6 · Tempo
  {
    id: "theory-100",
    chapter: 5,
    name: "Theory Hundred",
    blurb: "A hundred hours of theory.",
    measure: guildReports("theory"),
    target: 100,
  },
  {
    id: "exams-10",
    chapter: 5,
    name: "Examined",
    blurb: "Ten journey exams passed.",
    measure: { kind: "logs", type: "journey_exam_passed" },
    target: 10,
  },
  {
    id: "sessions-1000",
    chapter: 5,
    name: "One Thousand",
    blurb: "A thousand sessions.",
    measure: guildReports("sessions"),
    target: 1000,
  },
  {
    id: "hours-600",
    chapter: 5,
    name: "Six Hundred Hours",
    blurb: "Six hundred hours of practice.",
    measure: guildReports("time"),
    target: 600,
  },
  {
    id: "hearing-100",
    chapter: 5,
    name: "Hearing Hundred",
    blurb: "A hundred hours of ear training.",
    measure: guildReports("hearing"),
    target: 100,
  },

  // 7 · Stage
  {
    id: "recordings-20",
    chapter: 6,
    name: "Twenty Tapes",
    blurb: "Twenty recordings published.",
    measure: { kind: "recordings" },
    target: 20,
  },
  {
    id: "submissions-5",
    chapter: 6,
    name: "Contenders",
    blurb: "Five entries into the monthly challenge.",
    measure: { kind: "submissions" },
    target: 5,
  },
  {
    id: "songs-learned-50",
    chapter: 6,
    name: "Fifty Songs",
    blurb: "Fifty songs marked learned.",
    measure: { kind: "songsLearned" },
    target: 50,
  },
  {
    id: "points-20000",
    chapter: 6,
    name: "Twenty Thousand Points",
    blurb: "Twenty thousand practice points scored between you.",
    measure: guildReports("points"),
    target: 20000,
  },
  {
    id: "treasury-3000",
    chapter: 6,
    name: "War Chest",
    blurb: "Three thousand Fame put into the guild's own.",
    measure: { kind: "treasury" },
    target: 3000,
  },

  // 8 · Machine
  {
    id: "sessions-2000",
    chapter: 7,
    name: "Two Thousand",
    blurb: "Two thousand sessions.",
    measure: guildReports("sessions"),
    target: 2000,
  },
  {
    id: "hours-1000",
    chapter: 7,
    name: "Thousand Hours",
    blurb: "A thousand hours of practice.",
    measure: guildReports("time"),
    target: 1000,
  },
  {
    id: "technique-250",
    chapter: 7,
    name: "Technique 250",
    blurb: "Two hundred and fifty hours on technique.",
    measure: guildReports("technique"),
    target: 250,
  },
  {
    id: "members-sessions-50-x5",
    chapter: 7,
    name: "Five Regulars",
    blurb: "Five members with fifty sessions each.",
    measure: eachReports("sessions", 50),
    target: 5,
  },
  {
    id: "streak-14-x5",
    chapter: 7,
    name: "Five Flames",
    blurb: "Five members on a fourteen-day streak at the same time.",
    measure: { kind: "streak", days: 14 },
    target: 5,
  },

  // 9 · Scholars
  {
    id: "theory-150",
    chapter: 8,
    name: "Theory 150",
    blurb: "A hundred and fifty hours of theory.",
    measure: guildReports("theory"),
    target: 150,
  },
  {
    id: "hearing-150",
    chapter: 8,
    name: "Hearing 150",
    blurb: "A hundred and fifty hours of ear training.",
    measure: guildReports("hearing"),
    target: 150,
  },
  {
    id: "creativity-150",
    chapter: 8,
    name: "Creative 150",
    blurb: "A hundred and fifty hours of creative playing.",
    measure: guildReports("creativity"),
    target: 150,
  },
  {
    id: "daily-quests-100",
    chapter: 8,
    name: "Hundred Quests",
    blurb: "A hundred daily quests completed.",
    measure: { kind: "logs", type: "daily_quest_completed" },
    target: 100,
  },
  {
    id: "exams-50",
    chapter: 8,
    name: "Fifty Exams",
    blurb: "Fifty journey exams passed.",
    measure: { kind: "logs", type: "journey_exam_passed" },
    target: 50,
  },

  // 10 · Legends
  {
    id: "sessions-5000",
    chapter: 9,
    name: "Five Thousand",
    blurb: "Five thousand sessions.",
    measure: guildReports("sessions"),
    target: 5000,
  },
  {
    id: "hours-2500",
    chapter: 9,
    name: "2500 Hours",
    blurb: "Two and a half thousand hours of practice.",
    measure: guildReports("time"),
    target: 2500,
  },
  {
    id: "songs-learned-100",
    chapter: 9,
    name: "Hundred Songs",
    blurb: "A hundred songs marked learned.",
    measure: { kind: "songsLearned" },
    target: 100,
  },
  {
    id: "recordings-50",
    chapter: 9,
    name: "Fifty Tapes",
    blurb: "Fifty recordings published.",
    measure: { kind: "recordings" },
    target: 50,
  },
  {
    id: "streak-100-x1",
    chapter: 9,
    name: "Hundred Days",
    blurb: "One member on a hundred-day streak.",
    measure: { kind: "streak", days: 100 },
    target: 1,
  },
];

/** How many quests one lap of the ladder is. The level has no ceiling. */
export const GUILD_LAP_SIZE = GUILD_QUESTS.length;

const QUESTS_BY_ID = new Map(GUILD_QUESTS.map((quest) => [quest.id, quest]));

export const questById = (id: string): GuildQuest | undefined =>
  QUESTS_BY_ID.get(id);

export const questsOfChapter = (chapter: number): GuildQuest[] =>
  GUILD_QUESTS.filter((quest) => quest.chapter === chapter);

/**
 * Laps: the ladder after the ladder.
 *
 * Once all fifty are behind a guild the same fifty come round again, with
 * every number multiplied — targets, per-member asks, streak lengths, and the
 * Fame each one pays. The catalog is never copied: a lap is
 * `scaleQuest` applied to it on the way out, and what the ledger remembers is
 * a key of the id and the lap. The multiplier is the one knob: linear, so lap
 * three asks three times lap one. Doubling each lap would put lap four at
 * eight times, which is a ladder nobody climbs.
 */
export const lapMultiplier = (lap: number): number =>
  Math.max(1, Math.floor(Number.isFinite(lap) ? lap : 1));

/**
 * `@` rather than a dot or a tilde, because the key is a Firestore field
 * name written through a dotted path: a dot would split it, and `~` is one of
 * the characters a field path may not contain.
 */
const LAP_SEPARATOR = "@";

/** The ledger key a quest is banked under: the id itself on lap one, `id@lap` after. */
export const questKey = (id: string, lap: number): string =>
  lap <= 1 ? id : `${id}${LAP_SEPARATOR}${Math.floor(lap)}`;

/** The quest and lap behind a ledger key, or null for one the catalog cannot place. */
export const parseQuestKey = (
  key: unknown,
): { id: string; lap: number } | null => {
  if (typeof key !== "string") return null;

  const at = key.lastIndexOf(LAP_SEPARATOR);
  if (at === -1) return QUESTS_BY_ID.has(key) ? { id: key, lap: 1 } : null;

  const id = key.slice(0, at);
  const lap = Number(key.slice(at + 1));
  if (!QUESTS_BY_ID.has(id) || !Number.isInteger(lap) || lap < 2) return null;
  return { id, lap };
};

/**
 * What a member claims for one quest — set by its chapter, not the quest, and
 * scaled with the lap the same way the target is.
 */
export const questReward = (quest: GuildQuest, lap = 1): number =>
  (GUILD_QUEST_CHAPTERS[quest.chapter]?.reward ?? 0) * lapMultiplier(lap);

/** The unit one report field is stated in: a count, points, or hours. */
export const reportFieldUnit = (field: QuestReportField): QuestUnit => {
  if (field === "sessions") return "sessions";
  if (field === "points") return "points";
  return "hours";
};

/** The unit a quest is counted in, from how it is measured. */
export const questUnit = (quest: GuildQuest): QuestUnit => {
  const { measure } = quest;
  switch (measure.kind) {
    case "reports":
      if (measure.scope === "each") return "members";
      return reportFieldUnit(measure.field);
    case "allCategoriesEach":
    case "streak":
      return "members";
    case "treasury":
      return "fame";
    case "songsLearned":
      return "songs";
    case "recordings":
      return "recordings";
    case "logs":
      return measure.type === "journey_exam_passed" ? "exams" : "quests";
    default:
      return "entries";
  }
};

/**
 * The ledger keys a guild document says are cleared — only ones the catalog
 * can still place (a known quest, on a real lap), so a quest retired from the
 * list stops counting towards the level rather than lingering as a number
 * nobody can see.
 */
export const doneQuestKeys = (
  data: Record<string, unknown> | undefined,
): string[] => {
  const stored = data?.quests;
  if (!stored || typeof stored !== "object") return [];
  return Object.keys(stored as Record<string, unknown>).filter(
    (key) => parseQuestKey(key) !== null,
  );
};

/** The guild's level: quests cleared, across every lap, with no ceiling. */
export const guildLevelOf = (doneKeys: readonly string[]): number =>
  new Set(doneKeys).size;

/**
 * The lap the guild is on: one past every lap it has cleared in full. Laps are
 * only ever cleared in order, because only the open chapter is measured.
 */
export const currentLapOf = (doneKeys: readonly string[]): number => {
  const done = new Set(doneKeys);
  let lap = 1;
  while (GUILD_QUESTS.every((quest) => done.has(questKey(quest.id, lap)))) {
    lap++;
  }
  return lap;
};

/**
 * Where the guild is working: the lap it is on, and the first chapter of that
 * lap with a quest still open. There is always one — a finished lap opens the
 * next.
 */
export const activeChapterOf = (
  doneKeys: readonly string[],
): { lap: number; chapter: number } => {
  const done = new Set(doneKeys);
  const lap = currentLapOf(doneKeys);
  for (let chapter = 0; chapter < GUILD_QUEST_CHAPTERS.length; chapter++) {
    const open = questsOfChapter(chapter).some(
      (quest) => !done.has(questKey(quest.id, lap)),
    );
    if (open) return { lap, chapter };
  }
  return { lap, chapter: 0 };
};

/**
 * Milliseconds as the tenths of an hour a quest is measured in — rounded down,
 * so what a member is shown is never ahead of what the target is compared to.
 */
export const msToHours = (ms: number): number =>
  Math.max(0, Math.floor(((Number.isFinite(ms) ? ms : 0) / 3_600_000) * 10)) /
  10;

const singular: Record<QuestUnit, string> = {
  sessions: "session",
  hours: "h",
  fame: "Fame",
  members: "member",
  songs: "song",
  recordings: "recording",
  quests: "quest",
  exams: "exam",
  entries: "entry",
  points: "point",
};

const plural: Record<QuestUnit, string> = {
  sessions: "sessions",
  hours: "h",
  fame: "Fame",
  members: "members",
  songs: "songs",
  recordings: "recordings",
  quests: "quests",
  exams: "exams",
  entries: "entries",
  points: "points",
};

/** An amount with its unit stuck on: "4 sessions", "2.5h", "300 Fame". */
export const formatQuestAmount = (unit: QuestUnit, amount: number): string => {
  const value = Math.round((Number.isFinite(amount) ? amount : 0) * 10) / 10;
  if (unit === "hours") return `${value}h`;
  const word = value === 1 ? singular[unit] : plural[unit];
  return `${value.toLocaleString()} ${word}`;
};

/**
 * What one member is asked for on a quest that counts members, in words —
 * "5 sessions", "a 7-day streak", "level 20" — or null on a quest that only
 * counts the guild.
 */
export const questAskOfEach = (quest: GuildQuest): string | null => {
  const { measure } = quest;
  switch (measure.kind) {
    case "reports":
      if (measure.scope !== "each") return null;
      return formatQuestAmount(reportFieldUnit(measure.field), measure.each);
    case "allCategoriesEach":
      return `${formatQuestAmount("hours", measure.hoursEach)} in all four categories`;
    case "streak":
      return `a ${measure.days}-day streak`;
    default:
      return null;
  }
};

const ROMAN: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** The lap as a quest wears it in its name: "First Hundred II". */
export const romanNumeral = (value: number): string => {
  let rest = Math.max(1, Math.floor(value));
  let out = "";
  for (const [amount, glyph] of ROMAN) {
    while (rest >= amount) {
      out += glyph;
      rest -= amount;
    }
  }
  return out;
};

/** Whether the quest's target is a number of members, which a lap leaves alone. */
const countsMembers = (measure: QuestMeasure): boolean =>
  (measure.kind === "reports" && measure.scope === "each") ||
  measure.kind === "allCategoriesEach" ||
  measure.kind === "streak";

/**
 * The measure with its per-member bar scaled. On a quest that counts members
 * it is the bar that grows — five sessions each becomes ten — because the
 * number of members is capped by the roster and the bar is not.
 */
const scaleMeasure = (measure: QuestMeasure, times: number): QuestMeasure => {
  switch (measure.kind) {
    case "reports":
      return measure.scope === "each"
        ? { ...measure, each: measure.each * times }
        : measure;
    case "allCategoriesEach":
      return { ...measure, hoursEach: measure.hoursEach * times };
    case "streak":
      return { ...measure, days: measure.days * times };
    default:
      return measure;
  }
};

const memberCount = (count: number): string =>
  count === 1 ? "One member" : `${count} members`;

/**
 * A quest's ask as a sentence, from its numbers alone. The first lap has a
 * hand-written line for every quest; every lap after is described by this.
 */
export const describeQuest = (
  measure: QuestMeasure,
  target: number,
): string => {
  switch (measure.kind) {
    case "reports": {
      const unit = reportFieldUnit(measure.field);
      if (measure.scope === "each") {
        return `${memberCount(target)} with ${formatQuestAmount(unit, measure.each)} each.`;
      }
      const amount = formatQuestAmount(unit, target);
      switch (measure.field) {
        case "sessions":
          return `${amount} between you.`;
        case "time":
          return `${amount} of practice, all told.`;
        case "technique":
          return `${amount} on technique.`;
        case "theory":
          return `${amount} of theory.`;
        case "hearing":
          return `${amount} of ear training.`;
        case "creativity":
          return `${amount} of creative playing.`;
        default:
          return `${target.toLocaleString()} practice points scored between you.`;
      }
    }
    case "allCategoriesEach":
      return `${memberCount(target)} with ${formatQuestAmount("hours", measure.hoursEach)} in each of the four categories.`;
    case "treasury":
      return `${formatQuestAmount("fame", target)} put into the guild's own.`;
    case "streak":
      return `${memberCount(target)} on a ${measure.days}-day streak at the same time.`;
    case "songsLearned":
      return `${formatQuestAmount("songs", target)} marked learned.`;
    case "recordings":
      return `${formatQuestAmount("recordings", target)} published.`;
    case "logs":
      return measure.type === "journey_exam_passed"
        ? `${target.toLocaleString()} journey exams passed.`
        : `${target.toLocaleString()} daily quests completed.`;
    default:
      return `${formatQuestAmount("entries", target)} into the monthly challenge.`;
  }
};

/** A catalog quest as it is played on one lap: its key, its numbers, its pay. */
export interface ScaledQuest extends GuildQuest {
  /** The ledger key — see `questKey`. */
  key: string;
  lap: number;
  /** Fame each eligible member claims for it, on this lap. */
  reward: number;
}

export const scaleQuest = (quest: GuildQuest, lap: number): ScaledQuest => {
  const round = Math.max(1, Math.floor(Number.isFinite(lap) ? lap : 1));
  const times = lapMultiplier(round);
  const measure = scaleMeasure(quest.measure, times);
  const target = countsMembers(quest.measure)
    ? quest.target
    : quest.target * times;

  return {
    ...quest,
    measure,
    target,
    key: questKey(quest.id, round),
    lap: round,
    reward: questReward(quest, round),
    name: round > 1 ? `${quest.name} ${romanNumeral(round)}` : quest.name,
    blurb: round > 1 ? describeQuest(measure, target) : quest.blurb,
  };
};
