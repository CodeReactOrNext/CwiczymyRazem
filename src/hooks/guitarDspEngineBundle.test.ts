import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

import { buildGuitarDspEngine, SHELL_HASH_PATH } from "../../scripts/buildGuitarDspEngine.mjs";
import { GUITAR_DSP_ENGINE_HASH } from "./generated/guitarDspEngineHash";

// Node, not jsdom: esbuild refuses to run under jsdom's TextEncoder.

/** A checkout may have turned the committed files' line ends into CRLF. */
const committed = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

describe("desktop guitar DSP bundle", () => {
  it("is up to date with the detectors", async () => {
    // Out of date: run `node scripts/buildGuitarDspEngine.mjs` and commit the result.
    const files: Record<string, string> = await buildGuitarDspEngine();
    for (const [path, source] of Object.entries(files)) {
      expect(committed(path) === source, `${path} is out of date`).toBe(true);
    }
  }, 60_000);

  it("gives the shell and the web app the same hash", () => {
    expect(committed(SHELL_HASH_PATH)).toContain(JSON.stringify(GUITAR_DSP_ENGINE_HASH));
  });
});
