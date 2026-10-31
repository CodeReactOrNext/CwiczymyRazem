import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Only the tools that never touch Firestore are called below; the rest just
// have to register. The mock keeps firebase-admin from initialising.
vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: { collection: vi.fn() },
  auth: {},
}));

import { TAB_FORMAT_GUIDE } from "./content/tabFormat";
import { createRiffQuestMcpServer } from "./server";
import { checkTab, tabSchema } from "./tablature/tabJson";
import { exerciseDetails, exerciseDetailsShape } from "./tools/catalog";

const textOf = (result: Awaited<ReturnType<Client["callTool"]>>) =>
  (result.content as { type: string; text: string }[])[0].text;

describe("riff.quest MCP server", () => {
  let client: Client;

  beforeEach(async () => {
    const server = createRiffQuestMcpServer({
      uid: "player-1",
      tokenId: "t",
      scopes: ["read"],
    });
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    client = new Client({ name: "test", version: "1.0.0" });
    await client.connect(clientSide);
  });

  afterEach(async () => {
    await client.close();
  });

  it("lists every planned tool, and nothing that calls our own AI", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(
      [
        "riffquest_add_song_to_list",
        "riffquest_create_exercise",
        "riffquest_create_practice_plan",
        "riffquest_get_calendar",
        "riffquest_get_daily_exercise",
        "riffquest_get_exercise",
        "riffquest_get_exercise_stats",
        "riffquest_get_exercise_tablature",
        "riffquest_get_goals",
        "riffquest_get_monthly_challenge",
        "riffquest_get_my_exercises",
        "riffquest_get_practice_history",
        "riffquest_get_profile_summary",
        "riffquest_get_recent_runs",
        "riffquest_get_skill_breakdown",
        "riffquest_get_song",
        "riffquest_get_tab_format",
        "riffquest_get_weak_spots",
        "riffquest_list_exercise_taxonomy",
        "riffquest_list_exercises",
        "riffquest_list_my_plans",
        "riffquest_list_songs",
        "riffquest_preview_tab",
        "riffquest_search_wiki",
        "riffquest_set_exercise_goal",
        "riffquest_update_exercise",
        "riffquest_update_practice_plan",
        "riffquest_validate_tablature",
      ].sort(),
    );
  });

  // The Claude connector directory review: every tool has a title and says
  // whether it only reads (readOnlyHint) or changes data (destructiveHint).
  it("annotates every tool the way the directory review requires", async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      expect(tool.title, tool.name).toBeTruthy();
      expect(tool.name.length, tool.name).toBeLessThanOrEqual(64);
      const { readOnlyHint, destructiveHint } = tool.annotations ?? {};
      expect(readOnlyHint === true || destructiveHint === true, tool.name).toBe(
        true,
      );
      // All four spelled out — a missing openWorldHint reads as "true".
      for (const hint of [
        "readOnlyHint",
        "destructiveHint",
        "idempotentHint",
        "openWorldHint",
      ] as const) {
        expect(typeof tool.annotations?.[hint], `${tool.name} ${hint}`).toBe(
          "boolean",
        );
      }
      expect(tool.annotations?.openWorldHint, tool.name).toBe(false);
    }
    const writes = tools
      .filter((tool) => tool.annotations?.destructiveHint)
      .map((tool) => tool.name)
      .sort();
    expect(writes).toEqual([
      "riffquest_add_song_to_list",
      "riffquest_create_exercise",
      "riffquest_create_practice_plan",
      "riffquest_set_exercise_goal",
      "riffquest_update_exercise",
      "riffquest_update_practice_plan",
    ]);
    const repeatableWrites = tools
      .filter(
        (tool) =>
          tool.annotations?.destructiveHint && tool.annotations.idempotentHint,
      )
      .map((tool) => tool.name)
      .sort();
    expect(repeatableWrites).toEqual([
      "riffquest_add_song_to_list",
      "riffquest_set_exercise_goal",
      "riffquest_update_exercise",
      "riffquest_update_practice_plan",
    ]);
  });

  // Clients load the whole tool list into every conversation. It was 39.6k
  // characters before the trim; a new tool should fit without growing it back.
  it("keeps the tool list within its size budget", async () => {
    const { tools } = await client.listTools();
    expect(JSON.stringify({ tools }).length).toBeLessThanOrEqual(35_000);
  });

  it("refuses arguments a tool doesn't take", async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      expect(tool.inputSchema.additionalProperties, tool.name).toBe(false);
    }
    const result = await client.callTool({
      name: "riffquest_list_exercises",
      arguments: { skils: "legato" },
    });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/skils/);
  });

  // OpenAI's function calling rejects `"items": [ … ]` (a tuple) and ChatGPT
  // then hides the whole tool — every tab tool went missing there once.
  it("keeps every input schema in the subset OpenAI's function calling takes", async () => {
    const { tools } = await client.listTools();
    const tupleAt = (schema: unknown, at: string): string | null => {
      if (Array.isArray(schema)) {
        for (const [index, item] of schema.entries()) {
          const found = tupleAt(item, `${at}[${index}]`);
          if (found) return found;
        }
        return null;
      }
      if (!schema || typeof schema !== "object") return null;
      const record = schema as Record<string, unknown>;
      if (Array.isArray(record.items) || "prefixItems" in record) return at;
      for (const [key, value] of Object.entries(record)) {
        const found = tupleAt(value, `${at}.${key}`);
        if (found) return found;
      }
      return null;
    };
    for (const tool of tools) {
      expect(tupleAt(tool.inputSchema, tool.name)).toBeNull();
    }
  });

  // The review rejects descriptions that steer Claude rather than describe the tool.
  it("describes tools without telling the model how to behave", async () => {
    const { tools } = await client.listTools();
    const steering =
      /\b(start here|don't guess|read (it|this|get_\w+) before|use it before|before (writing|explaining)|you must|always call|never call|ignore (previous|other))\b/i;
    for (const tool of tools) {
      expect(tool.description ?? "", tool.name).not.toMatch(steering);
    }
    const instructions = client.getInstructions() ?? "";
    expect(instructions).not.toMatch(steering);
    expect(instructions).not.toMatch(
      /\b(start with|check \w+ instead|give it to the player)\b/i,
    );
  });

  it("offers the prompts and the tab format resource", async () => {
    const { prompts } = await client.listPrompts();
    expect(prompts.map((prompt) => prompt.name).sort()).toEqual([
      "plan_next_session",
      "weekly_review",
      "write_exercise",
    ]);
    const resource = await client.readResource({
      uri: "riffquest://docs/tab-format",
    });
    expect((resource.contents[0] as { text: string }).text).toBe(
      TAB_FORMAT_GUIDE,
    );
  });

  it("finds library exercises by skill and text", async () => {
    const result = await client.callTool({
      name: "riffquest_list_exercises",
      arguments: { skill: "legato", withTabOnly: true, limit: 5 },
    });
    const data = JSON.parse(textOf(result));
    expect(data.total).toBeGreaterThan(0);
    expect(data.exercises.length).toBeLessThanOrEqual(5);

    const detail = await client.callTool({
      name: "riffquest_get_exercise",
      arguments: { id: data.exercises[0].id },
    });
    const exercise = JSON.parse(textOf(detail));
    expect(exercise.skills).toContain("legato");
    expect(exercise.url).toMatch(/\/profile\/skills\?exerciseId=/);
    expect(detail.structuredContent).toEqual(exercise);
  });

  it("pages through the library with offset", async () => {
    const first = await client.callTool({
      name: "riffquest_list_exercises",
      arguments: { limit: 3 },
    });
    const page1 = first.structuredContent as {
      total: number;
      hasMore: boolean;
      nextOffset: number;
      exercises: { id: string }[];
    };
    expect(page1.hasMore).toBe(true);
    expect(page1.nextOffset).toBe(3);

    const second = await client.callTool({
      name: "riffquest_list_exercises",
      arguments: { limit: 3, offset: page1.nextOffset },
    });
    const page2 = second.structuredContent as typeof page1;
    expect(page2.total).toBe(page1.total);
    expect(page2.exercises.map((e) => e.id)).not.toContain(
      page1.exercises[0].id,
    );
  });

  // The output schema is checked on every call — a library exercise it
  // doesn't fit would turn riffquest_get_exercise into an error for that exercise.
  it("fits every library exercise into riffquest_get_exercise's output schema", () => {
    const schema = z.object(exerciseDetailsShape);
    for (const exercise of exercisesAgregat) {
      const parsed = schema.safeParse(exerciseDetails(exercise));
      expect(parsed.success, exercise.id).toBe(true);
    }
  });

  it("reads a library tab in parts", async () => {
    const withTab = exercisesAgregat.find(
      (exercise) => (exercise.tablature?.length ?? 0) >= 3,
    )!;
    const result = await client.callTool({
      name: "riffquest_get_exercise_tablature",
      arguments: { id: withTab.id, fromMeasure: 2, toMeasure: 3 },
    });
    const data = result.structuredContent as {
      totalMeasures: number;
      fromMeasure: number;
      toMeasure: number;
      tab: { measures: unknown[] };
      asciiTab: string;
    };
    expect(data.totalMeasures).toBe(withTab.tablature!.length);
    expect([data.fromMeasure, data.toMeasure]).toEqual([2, 3]);
    expect(data.tab.measures).toHaveLength(2);
    expect(data.asciiTab).toMatch(/^[eG]\|/m);
  });

  it("answers an unknown exercise id with an error the model can act on", async () => {
    const result = await client.callTool({
      name: "riffquest_get_exercise",
      arguments: { id: "nope" },
    });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/riffquest_list_exercises/);
  });

  it("validates a tab and points at the broken measure", async () => {
    const result = await client.callTool({
      name: "riffquest_validate_tablature",
      arguments: {
        tab: {
          measures: [
            {
              beats: [{ duration: "quarter", notes: [{ string: 1, fret: 5 }] }],
            },
          ],
        },
      },
    });
    const data = JSON.parse(textOf(result));
    expect(data.ok).toBe(false);
    expect(data.errors[0]).toMatch(
      /^measure 1: beats add up to 1 quarter notes but 4\/4 holds 4/,
    );
    expect(data.asciiTab.split("\n")[0]).toBe("e|-5-|");
  });

  it("refuses a write from a read-only token before touching the database", async () => {
    const result = await client.callTool({
      name: "riffquest_set_exercise_goal",
      arguments: { exerciseId: "nope", targetBpm: 120 },
    });
    expect(result.isError).toBe(true);
  });

  it("rejects a zod-invalid call", async () => {
    const result = await client.callTool({
      name: "riffquest_get_calendar",
      arguments: { month: "October" },
    });
    expect(result.isError).toBe(true);
  });
});

describe("tab format guide", () => {
  it("has an example that passes the validator", () => {
    const example = TAB_FORMAT_GUIDE.match(/```json\n([\s\S]*?)```/)?.[1];
    expect(example).toBeDefined();
    const { validation } = checkTab(tabSchema.parse(JSON.parse(example!)));
    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toEqual([]);
  });
});
