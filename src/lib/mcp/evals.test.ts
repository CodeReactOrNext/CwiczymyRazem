import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import fs from "fs";
import path from "path";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Every question uses tools that never touch Firestore.
vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: { collection: vi.fn() },
  auth: {},
}));

import { createRiffQuestMcpServer } from "./server";

/**
 * docs/mcp/evals/riff-quest.xml holds the questions a model answers with the
 * tools; this solves each one the way a model would — through the tools — and
 * checks the answer in the file still holds.
 */
const answers = Array.from(
  fs
    .readFileSync(
      path.join(process.cwd(), "docs/mcp/evals/riff-quest.xml"),
      "utf8",
    )
    .matchAll(/<answer>([^<]*)<\/answer>/g),
  (match) => match[1],
);

let client: Client;

const call = async <T>(name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({
    name: `riffquest_${name}`,
    arguments: args,
  });
  if (result.isError) throw new Error(JSON.stringify(result.content));
  return result.structuredContent as T;
};

type Listed = { exercises: { id: string; title: string; skills: string[] }[] };
type Details = { id: string; bpm: { max: number; recommended: number } };
type Tab = {
  tab: {
    timeSignature?: string;
    measures: {
      timeSignature?: string;
      beats: { notes?: { string: number }[] }[];
    }[];
  };
};

const byTitle = async (title: string) => {
  const { exercises } = await call<Listed>("list_exercises", { text: title });
  const found = exercises.find((exercise) => exercise.title === title);
  if (!found) throw new Error(`no "${title}"`);
  return found.id;
};

const fastest = async (ids: string[]) => {
  const details = await Promise.all(
    ids.map((id) => call<Details>("get_exercise", { id })),
  );
  return details.sort((a, b) => b.bpm.max - a.bpm.max)[0].id;
};

/** Each measure's time signature, carrying the last one forward. */
const signatures = ({ tab }: Tab) => {
  let current = tab.timeSignature ?? "4/4";
  return tab.measures.map(
    (measure) => (current = measure.timeSignature ?? current),
  );
};

const wikiText = async (text: string) =>
  (
    await call<{ results: { text?: string }[] }>("search_wiki", {
      text,
      full: true,
    })
  ).results[0].text ?? "";

const solutions: (() => Promise<string>)[] = [
  async () => {
    const { exercises } = await call<Listed>("list_exercises", {
      skill: "legato",
      difficulty: "easy",
      withTabOnly: true,
      limit: 50,
    });
    return fastest(exercises.map((exercise) => exercise.id));
  },
  async () => {
    const tab = await call<Tab>("get_exercise_tablature", {
      id: await byTitle("Spider — One Note Per Beat"),
    });
    const string = tab.tab.measures.at(-1)!.beats[0].notes![0].string;
    return ["e", "B", "G", "D", "A", "E"][string - 1];
  },
  async () => {
    const tab = await call<Tab>("get_exercise_tablature", {
      id: await byTitle("Spider — Shifting Up the Neck"),
    });
    return signatures(tab).find((signature) => signature !== "4/4")!;
  },
  async () => {
    const { skills } = await call<{ skills: { category: string }[] }>(
      "list_exercise_taxonomy",
    );
    const counts = new Map<string, number>();
    for (const { category } of skills)
      counts.set(category, (counts.get(category) ?? 0) + 1);
    return Array.from(counts).sort((a, b) => b[1] - a[1])[0][0];
  },
  async () =>
    (await wikiText("relaxed clean run accuracy")).match(
      /Relaxed counts a run at (\d+%)/,
    )![1],
  async () => {
    const words = { one: "1", two: "2", three: "3" } as Record<string, string>;
    const count = (await wikiText("missed day rest day streak")).match(
      /(\w+) missed days? a week (?:is|are) (?:a )?rest days?/i,
    )![1];
    return words[count.toLowerCase()] ?? count;
  },
  async () => {
    const dottedQuarter = {
      duration: "quarter",
      dots: 1,
      notes: [{ string: 6, fret: 0 }],
    };
    const result = await call<{ ok: boolean; stats: { notes: number } }>(
      "validate_tablature",
      {
        tab: {
          timeSignature: "6/8",
          measures: [{ beats: [dottedQuarter, dottedQuarter] }],
        },
      },
    );
    expect(result.ok).toBe(true);
    return String(result.stats.notes);
  },
  async () => {
    const details = await call<Details>("get_exercise", {
      id: await byTitle("Spider — String Skipping"),
    });
    return String(details.bpm.recommended);
  },
  async () => {
    const { exercises } = await call<Listed>("list_exercises", {
      text: "spider",
      skill: "finger_independence",
      limit: 50,
    });
    return fastest(
      exercises
        .filter(
          (exercise) =>
            exercise.title.startsWith("Spider") && exercise.skills.length === 1,
        )
        .map((exercise) => exercise.id),
    );
  },
  async () => {
    const tab = await call<Tab>("get_exercise_tablature", {
      id: await byTitle("Meter — 3/4 ↔ 5/8"),
    });
    return String(signatures(tab).filter((s) => s === "5/8").length);
  },
];

describe("MCP evaluation answers", () => {
  beforeAll(async () => {
    const server = createRiffQuestMcpServer({
      uid: "player-1",
      tokenId: "t",
      scopes: ["read"],
    });
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    client = new Client({ name: "eval", version: "1.0.0" });
    await client.connect(clientSide);
  });

  it("has one solution per question", () => {
    expect(answers).toHaveLength(10);
    expect(solutions).toHaveLength(answers.length);
  });

  solutions.forEach((solve, index) => {
    it(`question ${index + 1} still has the answer in the file`, async () => {
      expect(await solve()).toBe(answers[index]);
    });
  });
});
