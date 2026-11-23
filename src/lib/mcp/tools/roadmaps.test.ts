import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The guide and the plan check never touch Firestore when the plan names no
// library song; the mock keeps firebase-admin from initialising.
vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: { collection: vi.fn() },
  auth: {},
}));

import { ROADMAP_GUIDE } from "../content/roadmapGuide";
import { REVIEW_CRITERIA } from "../roadmapPlan";
import { SCHOOL_TITLES } from "../roadmapPlan.fixtures";
import { createRiffQuestMcpServer } from "../server";

/** A review that answers every criterion, each with its own note. */
const review = (failing?: string) =>
  REVIEW_CRITERIA.map((criterion) => ({
    criterion: criterion.id,
    pass: criterion.id !== failing,
    note: `Looked at ${criterion.id} across all five phases.`,
  }));

const textOf = (result: Awaited<ReturnType<Client["callTool"]>>) =>
  (result.content as { type: string; text: string }[])[0].text;

const step = (title: string, extra: Record<string, unknown> = {}) => ({
  title,
  skillType: "musical",
  gist: `What the player does in ${title}.`,
  ...extra,
});

const plan = () =>
  SCHOOL_TITLES.map((titles, index) => ({
    title: `Phase ${index + 1}`,
    steps: titles.map((title) => step(title)),
  }));

/** Eight topics that between them name every step of the plan. */
const syllabus = () => {
  const titles = SCHOOL_TITLES.flat();
  return Array.from({ length: 8 }, (_unused, index) => ({
    topic: `Topic ${index + 1}`,
    steps: titles.filter((_title, at) => at % 8 === index),
  }));
};

describe("roadmap tools", () => {
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

  it("serves the guide as a tool and as a resource, built from the generator's own rules", async () => {
    const result = await client.callTool({
      name: "riffquest_get_roadmap_guide",
      arguments: {},
    });
    expect(textOf(result)).toBe(ROADMAP_GUIDE);
    const resource = await client.readResource({
      uri: "riffquest://docs/roadmap-guide",
    });
    expect((resource.contents[0] as { text: string }).text).toBe(ROADMAP_GUIDE);

    // The level rules, the voice and both curated exemplars are in it —
    // imported, so a change to the generator changes the guide.
    expect(ROADMAP_GUIDE).toContain('"Absolute Beginner"');
    expect(ROADMAP_GUIDE).toContain("VOICE");
    expect(ROADMAP_GUIDE).toContain("EXAMPLE 2");
    // Every tool the guide sends a model to exists.
    const { tools } = await client.listTools();
    const names = new Set(tools.map((tool) => tool.name));
    for (const [name] of ROADMAP_GUIDE.matchAll(/riffquest_[a-z_]+/g)) {
      expect(names.has(name), name).toBe(true);
    }
  });

  it("passes a sound plan and says what is wrong with a broken one", async () => {
    const ok = await client.callTool({
      name: "riffquest_check_roadmap_plan",
      arguments: { level: "Intermediate", phases: plan() },
    });
    expect(ok.isError).toBeFalsy();
    expect(ok.structuredContent).toMatchObject({
      ok: true,
      problems: [],
      size: { phases: 5, steps: 25 },
    });
    // The part of the review code cannot do comes back with every check.
    expect(
      (ok.structuredContent as { reviewCriteria: unknown[] }).reviewCriteria,
    ).toHaveLength(REVIEW_CRITERIA.length);

    const broken = plan();
    broken[0].steps[0] = step("Neck pickup clean tone", {
      exerciseId: "made_up",
    });
    const bad = await client.callTool({
      name: "riffquest_check_roadmap_plan",
      arguments: { level: "Intermediate", phases: broken },
    });
    const data = bad.structuredContent as { ok: boolean; problems: string[] };
    expect(data.ok).toBe(false);
    expect(data.problems.some((p) => p.includes('"made_up"'))).toBe(true);
    expect(data.problems.some((p) => p.includes("piece of gear"))).toBe(true);
  });

  it("refuses a plan outside the size limits before any check runs", async () => {
    const result = await client.callTool({
      name: "riffquest_check_roadmap_plan",
      arguments: { level: "Intermediate", phases: plan().slice(0, 2) },
    });
    expect(result.isError).toBe(true);
  });

  it("refuses to save a plan with problems, and a read-only token before touching the database", async () => {
    const broken = plan();
    broken[1].steps[0].title = "Trills between two fingers";
    const refused = await client.callTool({
      name: "riffquest_create_roadmap",
      arguments: {
        title: "Legato",
        goal: "A complete school of legato for electric lead guitar",
        level: "Intermediate",
        phases: broken,
        syllabus: syllabus(),
        review: review(),
        playerApproved: true,
      },
    });
    expect(refused.isError).toBe(true);
    expect(textOf(refused)).toMatch(/Not saved/);
    expect(textOf(refused)).toMatch(/both called/);
  });

  it("refuses to save a sound plan whose review is not done", async () => {
    const save = (extra: Record<string, unknown>) =>
      client.callTool({
        name: "riffquest_create_roadmap",
        arguments: {
          title: "Legato",
          goal: "A complete school of legato for electric lead guitar",
          level: "Intermediate",
          phases: plan(),
          syllabus: syllabus(),
          ...extra,
        },
      });

    const failing = await save({
      review: review("coverage"),
      playerApproved: true,
    });
    expect(textOf(failing)).toMatch(/"coverage" did not pass/);

    const partial = await save({
      review: review().slice(0, 4),
      playerApproved: true,
    });
    expect(textOf(partial)).toMatch(/leaves out: .*general/);

    const unseen = await save({ review: review(), playerApproved: false });
    expect(textOf(unseen)).toMatch(/has not seen and agreed/);
  });

  it("refuses to save a school whose syllabus does not cover it, or whose title is not a subject", async () => {
    const save = (extra: Record<string, unknown>) =>
      client.callTool({
        name: "riffquest_create_roadmap",
        arguments: {
          title: "Legato",
          goal: "A complete school of legato for electric lead guitar",
          level: "Intermediate",
          phases: plan(),
          syllabus: syllabus(),
          review: review(),
          playerApproved: true,
          ...extra,
        },
      });

    const thin = await save({ syllabus: syllabus().slice(0, 7) });
    expect(textOf(thin)).toMatch(/syllabus does not match the plan/);
    expect(textOf(thin)).toMatch(/teach no topic/);

    const numbered = await save({ title: "Legato: 90 to 160 BPM" });
    expect(textOf(numbered)).toMatch(/names a number/);
  });

  it("names the questions and the review criteria in the guide", () => {
    for (const criterion of REVIEW_CRITERIA) {
      expect(ROADMAP_GUIDE).toContain(`\`${criterion.id}\``);
    }
    expect(ROADMAP_GUIDE).toContain("Which songs should be in the roadmap?");
    // A school is not about the player who asked: the personal questions stay out.
    expect(ROADMAP_GUIDE).not.toContain("What do you find hardest");
    expect(ROADMAP_GUIDE).toContain("[Before you start]");
    expect(ROADMAP_GUIDE).toContain("[What you can do now]");
    expect(ROADMAP_GUIDE).toContain("The syllabus");
    expect(ROADMAP_GUIDE).toContain("riffquest_write_roadmap_checkpoint");
    expect(ROADMAP_GUIDE).toContain("riffquest_find_lessons");
  });
});
