import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: {},
  auth: {},
}));

import { McpQuotaError } from "./auth";
import { McpToolError, runTool } from "./results";

const textOf = (result: Awaited<ReturnType<typeof runTool>>) =>
  (result.content as { type: string; text: string }[])[0].text;

const failWith = (error: unknown) => async () => {
  throw error;
};

describe("runTool errors", () => {
  afterEach(() => vi.restoreAllMocks());

  it("passes a tool's own refusals through word for word", async () => {
    const own = await runTool(
      "get_exercise",
      failWith(new McpToolError('No exercise "x".')),
    );
    expect(own).toMatchObject({ isError: true });
    expect(textOf(own)).toBe('No exercise "x".');

    const quota = await runTool(
      "create_exercise",
      failWith(new McpQuotaError("Daily limit reached.")),
    );
    expect(textOf(quota)).toBe("Daily limit reached.");
  });

  it("names a database timeout, says a retry helps and quotes a logged reference", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runTool(
      "get_goals",
      failWith(Object.assign(new Error("deadline"), { code: 4 })),
    );
    const text = textOf(result);
    expect(result.isError).toBe(true);
    expect(text).toMatch(
      /^get_goals didn't complete: the riff.quest database didn't answer in time\./,
    );
    expect(text).toMatch(/Retrying in a few seconds should work\./);
    expect(text).not.toMatch(/may or may not have been saved/);

    const reference = text.match(/Reference: (\w+)/)?.[1];
    expect(reference).toBeTruthy();
    expect(String(log.mock.calls[0][0])).toContain(reference);
  });

  it("warns that a failed write may have landed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runTool(
      "create_practice_plan",
      failWith(Object.assign(new Error("x"), { code: "aborted" })),
    );
    expect(textOf(result)).toMatch(
      /another change to the same data happened at the same moment/,
    );
    expect(textOf(result)).toMatch(
      /check with the matching list tool before trying again/,
    );
  });

  it("never leaks the underlying error's message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runTool(
      "get_song",
      failWith(new Error("secret internal path /srv/keys")),
    );
    expect(textOf(result)).toMatch(
      /an unexpected error on the riff.quest server\. Retrying is unlikely to help\./,
    );
    expect(textOf(result)).not.toMatch(/secret/);
  });
});
