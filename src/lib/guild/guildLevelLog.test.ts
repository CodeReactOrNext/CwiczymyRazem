import { beforeEach, describe, expect, it, vi } from "vitest";

const created = new Map<string, Record<string, any>>();

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: {
    collection: (name: string) => ({
      doc: (id: string) => ({
        create: async (data: Record<string, any>) => {
          const path = `${name}/${id}`;
          if (created.has(path)) {
            throw Object.assign(new Error("ALREADY_EXISTS"), { code: 6 });
          }
          created.set(path, data);
        },
      }),
    }),
  },
}));

vi.mock("lib/guild/guildBadge", () => ({
  badgeFor: (guildId: string, data: Record<string, any>) => ({
    guildId,
    tag: data.tag ?? "",
    accent: "accent-default",
    frame: "frame-default",
    level: 0,
  }),
}));

const { buildGuildLevelLog, guildLevelLogId, postGuildLevelUp } =
  await import("./guildLevelLog");

const NOW = new Date("2026-03-15T12:00:00.000Z");
const GUILD = "riff-raiders";

const input = (overrides: Record<string, any> = {}) => ({
  guildId: GUILD,
  guildData: { name: "Riff Raiders", tag: "RIF" },
  fromLevel: 3,
  toLevel: 4,
  questNames: ["First Hundred"],
  now: NOW,
  ...overrides,
});

beforeEach(() => created.clear());

describe("buildGuildLevelLog", () => {
  it("describes the guild and the level it reached", () => {
    expect(buildGuildLevelLog(input())).toEqual({
      type: "guild_level_up",
      data: NOW.toISOString(),
      timestamp: NOW.toISOString(),
      guildId: GUILD,
      guildName: "Riff Raiders",
      guildBadge: {
        guildId: GUILD,
        tag: "RIF",
        accent: "accent-default",
        frame: "frame-default",
        level: 4,
      },
      level: 4,
      previousLevel: 3,
      quests: ["First Hundred"],
      questsCleared: 1,
    });
  });

  it("lists at most five quests but counts them all", () => {
    const names = Array.from({ length: 8 }, (_, i) => `Quest ${i + 1}`);
    const log = buildGuildLevelLog(input({ toLevel: 11, questNames: names }));

    expect(log.quests).toEqual(names.slice(0, 5));
    expect(log.questsCleared).toBe(8);
  });

  it("falls back to the id for a guild without a name", () => {
    expect(buildGuildLevelLog(input({ guildData: {} })).guildName).toBe(GUILD);
  });
});

describe("postGuildLevelUp", () => {
  it("writes one row per level, however many reads bank it", async () => {
    await postGuildLevelUp(input());
    await postGuildLevelUp(input());

    expect([...created.keys()]).toEqual([
      `logs/${guildLevelLogId(GUILD, 4)}`,
    ]);
  });

  it("posts nothing when the level did not move", async () => {
    await postGuildLevelUp(input({ fromLevel: 4, toLevel: 4 }));

    expect(created.size).toBe(0);
  });
});
