import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the tools that never touch Firestore are called below; the rest just
// have to register. The mock keeps firebase-admin from initialising.
vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: { collection: vi.fn() },
  auth: {},
}));

import { TAB_FORMAT_GUIDE } from "./content/tabFormat";
import { createRiffQuestMcpServer } from "./server";
import { validateTablature } from "./tablature/validateTablature";

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
        "add_song_to_list",
        "create_exercise",
        "create_practice_plan",
        "get_calendar",
        "get_daily_exercise",
        "get_exercise",
        "get_exercise_stats",
        "get_exercise_tablature",
        "get_goals",
        "get_monthly_challenge",
        "get_my_exercises",
        "get_practice_history",
        "get_profile_summary",
        "get_skill_breakdown",
        "get_song",
        "get_tab_format",
        "get_weak_spots",
        "list_exercise_taxonomy",
        "list_exercises",
        "list_my_plans",
        "list_songs",
        "search_wiki",
        "set_exercise_goal",
        "update_exercise",
        "update_practice_plan",
        "validate_tablature",
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
    }
    const writes = tools
      .filter((tool) => tool.annotations?.destructiveHint)
      .map((tool) => tool.name)
      .sort();
    expect(writes).toEqual([
      "add_song_to_list",
      "create_exercise",
      "create_practice_plan",
      "set_exercise_goal",
      "update_exercise",
      "update_practice_plan",
    ]);
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
      name: "list_exercises",
      arguments: { skill: "legato", withTabOnly: true, limit: 5 },
    });
    const data = JSON.parse(textOf(result));
    expect(data.total).toBeGreaterThan(0);
    expect(data.exercises.length).toBeLessThanOrEqual(5);

    const detail = await client.callTool({
      name: "get_exercise",
      arguments: { id: data.exercises[0].id },
    });
    const exercise = JSON.parse(textOf(detail));
    expect(exercise.skills).toContain("legato");
    expect(exercise.url).toMatch(/\/profile\/skills\?exerciseId=/);
  });

  it("answers an unknown exercise id with an error the model can act on", async () => {
    const result = await client.callTool({
      name: "get_exercise",
      arguments: { id: "nope" },
    });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/list_exercises/);
  });

  it("validates a tab and points at the broken measure", async () => {
    const result = await client.callTool({
      name: "validate_tablature",
      arguments: {
        tablature: [
          {
            timeSignature: [4, 4],
            beats: [{ duration: 1, notes: [{ string: 1, fret: 5 }] }],
          },
        ],
      },
    });
    const data = JSON.parse(textOf(result));
    expect(data.ok).toBe(false);
    expect(data.errors[0]).toMatch(
      /^measure 1: beats add up to 1 quarter notes but 4\/4 holds 4/,
    );
  });

  it("refuses a write from a read-only token before touching the database", async () => {
    const result = await client.callTool({
      name: "set_exercise_goal",
      arguments: { exerciseId: "nope", targetBpm: 120 },
    });
    expect(result.isError).toBe(true);
  });

  it("rejects a zod-invalid call", async () => {
    const result = await client.callTool({
      name: "get_calendar",
      arguments: { month: "October" },
    });
    expect(result.isError).toBe(true);
  });
});

describe("tab format guide", () => {
  it("has an example that passes the validator", () => {
    const example = TAB_FORMAT_GUIDE.match(/```json\n([\s\S]*?)```/)?.[1];
    expect(example).toBeDefined();
    const result = validateTablature(
      JSON.parse(example!) as TablatureMeasure[],
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
