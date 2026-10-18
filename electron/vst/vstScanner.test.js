import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";

import { buildCatalog, friendlyError, isEffect, publicView, resolveBundle, walkFolder } from "./vstScanner";

const fx = (uid, name, extra = {}) => ({
  uid,
  name,
  vendor: "Vendor",
  category: "Audio Module Class",
  subCategories: "Fx|Distortion",
  version: "1.0.0",
  ...extra,
});

const UID_A = "ABCDEF019182FAEB4E445350414A5050";
const UID_B = "F2AEE70D00DE4F4E534441613159456F";

describe("isEffect", () => {
  it("keeps audio effects and drops instruments and controller classes", () => {
    expect(isEffect(fx(UID_A, "Amp"))).toBe(true);
    expect(isEffect(fx(UID_A, "Synth", { subCategories: "Instrument|Synth" }))).toBe(false);
    expect(isEffect(fx(UID_A, "Ctl", { category: "Component Controller Class" }))).toBe(false);
  });
});

describe("friendlyError", () => {
  it("explains a DllMain refusal as a licence problem", () => {
    expect(friendlyError("LoadLibraryW failed for path C:/x.vst3: DLL init failed")).toMatch(/licence/);
  });
  it("names hangs and crashes", () => {
    expect(friendlyError("timed out")).toMatch(/too long/);
    expect(friendlyError("crashed (exit code 255)")).toMatch(/crashed/);
  });
});

describe("buildCatalog", () => {
  const paths = ["C:/VST3/Petrucci.vst3", "C:/VST3/Gojira.vst3", "C:/VST3/NAM.vst3"];

  it("scans every file on a first run, sorting results and recording failures", async () => {
    const scanOne = vi.fn(async (p) => {
      if (p.includes("Gojira")) return { ok: false, error: "LoadLibraryW failed" };
      if (p.includes("NAM")) return { ok: true, classes: [fx(UID_B.toLowerCase(), "NeuralAmpModeler")] };
      return {
        ok: true,
        classes: [fx(UID_A, "Archetype Petrucci"), fx(UID_A, "Ctl", { category: "Component Controller Class" })],
      };
    });
    const progress = [];
    const catalog = await buildCatalog({
      paths,
      previous: null,
      force: false,
      fingerprint: (p) => `fp:${p}`,
      scanOne,
      onProgress: (p) => progress.push(p),
    });

    expect(scanOne).toHaveBeenCalledTimes(3);
    expect(catalog.plugins.map((p) => p.name)).toEqual(["Archetype Petrucci", "NeuralAmpModeler"]);
    expect(catalog.plugins[1].id).toBe(UID_B); // normalised to upper case
    expect(catalog.failed).toEqual([
      { path: "C:/VST3/Gojira.vst3", name: "Gojira", error: expect.stringMatching(/licence/) },
    ]);
    expect(progress.at(-1)).toEqual({ done: 3, total: 3, current: null });
  });

  it("reuses unchanged files from the previous catalog and only loads what changed", async () => {
    const previous = {
      version: 1,
      scannedAt: 1,
      plugins: [{ id: UID_A, name: "Archetype Petrucci", path: paths[0] }],
      failed: [{ path: paths[1], name: "Gojira", error: "no licence" }],
      fingerprints: { [paths[0]]: "same", [paths[1]]: "same", [paths[2]]: "old" },
    };
    const scanOne = vi.fn(async () => ({ ok: true, classes: [fx(UID_B, "NeuralAmpModeler")] }));
    const catalog = await buildCatalog({
      paths,
      previous,
      force: false,
      fingerprint: (p) => (p === paths[2] ? "new" : "same"),
      scanOne,
    });

    expect(scanOne).toHaveBeenCalledTimes(1);
    expect(scanOne).toHaveBeenCalledWith(paths[2]);
    expect(catalog.plugins.map((p) => p.id)).toEqual([UID_A, UID_B]);
    expect(catalog.failed).toHaveLength(1);
    expect(catalog.fingerprints[paths[2]]).toBe("new");
  });

  it("retries earlier failures on Rescan even though their files did not change", async () => {
    const previous = {
      version: 1,
      scannedAt: 1,
      plugins: [{ id: UID_A, name: "Archetype Petrucci", path: paths[0] }],
      failed: [{ path: paths[1], name: "Gojira", error: "no licence" }],
      fingerprints: { [paths[0]]: "same", [paths[1]]: "same" },
    };
    // Licence activated since: the same file now loads.
    const scanOne = vi.fn(async () => ({ ok: true, classes: [fx(UID_B, "Archetype Gojira")] }));
    const catalog = await buildCatalog({
      paths: paths.slice(0, 2),
      previous,
      force: false,
      retryFailed: true,
      fingerprint: () => "same",
      scanOne,
    });
    expect(scanOne).toHaveBeenCalledTimes(1);
    expect(scanOne).toHaveBeenCalledWith(paths[1]);
    expect(catalog.failed).toEqual([]);
    expect(catalog.plugins.map((p) => p.name)).toEqual(["Archetype Gojira", "Archetype Petrucci"]);
  });

  it("spreads files over parallel lanes and keeps results in path order", async () => {
    const seen = { a: [], b: [] };
    const lane = (name, delay) => async (p) => {
      seen[name].push(p);
      await new Promise((r) => setTimeout(r, delay));
      return { ok: true, classes: [fx(UID_A.slice(0, -2) + String(paths.indexOf(p)).padStart(2, "0"), p)] };
    };
    const catalog = await buildCatalog({
      paths,
      previous: null,
      force: false,
      fingerprint: () => "x",
      scanOne: [lane("a", 15), lane("b", 1)],
    });
    expect(seen.a.length + seen.b.length).toBe(3);
    expect(seen.a.length).toBeGreaterThan(0);
    expect(seen.b.length).toBeGreaterThan(0);
    expect(catalog.plugins.map((p) => p.path).sort()).toEqual([...paths].sort());
  });

  it("rescans everything when forced, and forgets files that disappeared", async () => {
    const previous = {
      version: 1,
      scannedAt: 1,
      plugins: [{ id: UID_A, name: "Gone", path: "C:/VST3/Gone.vst3" }],
      failed: [],
      fingerprints: { "C:/VST3/Gone.vst3": "x", [paths[2]]: "same" },
    };
    const scanOne = vi.fn(async () => ({ ok: true, classes: [fx(UID_B, "NeuralAmpModeler")] }));
    const catalog = await buildCatalog({
      paths: [paths[2]],
      previous,
      force: true,
      fingerprint: () => "same",
      scanOne,
    });
    expect(scanOne).toHaveBeenCalledTimes(1);
    expect(catalog.plugins.map((p) => p.name)).toEqual(["NeuralAmpModeler"]);
  });
});

describe("publicView", () => {
  const catalog = {
    scannedAt: 5,
    plugins: [
      { id: UID_A, name: "A", vendor: "V", subCategories: "Fx", version: "1", path: "C:/VST3/A.vst3" },
      { id: UID_B, name: "B", vendor: "V", subCategories: "Fx", version: "1", path: "D:/Mine/B.vst3" },
    ],
    failed: [{ path: "C:/VST3/C.vst3", name: "C", error: "e" }],
    fingerprints: { "C:/VST3/A.vst3": "x" },
    sources: { folders: [], files: ["D:/Mine/B.vst3"] },
  };

  it("keeps system plugin paths in the main process", () => {
    const view = publicView(catalog);
    expect(JSON.stringify(view)).not.toContain("C:/VST3");
    expect(view.plugins[0]).toEqual({ id: UID_A, name: "A", vendor: "V", subCategories: "Fx", version: "1", source: "system" });
  });

  it("marks plugins the player added and shows their own paths back", () => {
    const view = publicView(catalog);
    expect(view.plugins[1]).toMatchObject({ source: "file", sourcePath: "D:/Mine/B.vst3" });
    expect(view.sources).toEqual({ folders: [], files: ["D:/Mine/B.vst3"] });
  });
});

describe("walkFolder / resolveBundle", () => {
  it("finds plain .vst3 files and the binary inside .vst3 bundles, without descending into bundles", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "vst-walk-"));
    fs.mkdirSync(path.join(root, "Vendor"), { recursive: true });
    fs.writeFileSync(path.join(root, "Vendor", "Plain.vst3"), "x");
    const bundle = path.join(root, "Amp.vst3");
    fs.mkdirSync(path.join(bundle, "Contents", "x86_64-win"), { recursive: true });
    fs.writeFileSync(path.join(bundle, "Contents", "x86_64-win", "Amp.vst3"), "x");
    fs.mkdirSync(path.join(root, "Broken.vst3")); // bundle without a Windows binary
    fs.writeFileSync(path.join(root, "readme.txt"), "x");

    const found = walkFolder(root).map((p) => path.relative(root, p)).sort();
    expect(found).toEqual([path.join("Amp.vst3", "Contents", "x86_64-win", "Amp.vst3"), path.join("Vendor", "Plain.vst3")]);
    expect(resolveBundle(bundle)).toBe(path.join(bundle, "Contents", "x86_64-win", "Amp.vst3"));
    expect(resolveBundle(path.join(root, "missing.vst3"))).toBeNull();
  });
});
