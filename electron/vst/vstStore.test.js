import fs from "fs";
import os from "os";
import path from "path";
import { beforeEach, describe, expect, it } from "vitest";

import * as vstStore from "./vstStore";

const UID = "ABCDEF019182FAEB4E445350414A5050";
const SLOT = "0123456789abcdef";

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "vst-store-test-"));
  vstStore.setUserDataDir(dir);
});

describe("library", () => {
  it("starts empty and round-trips, sources included", () => {
    expect(vstStore.readCatalog()).toMatchObject({ scannedAt: null, sources: { folders: [], files: [] } });
    vstStore.writeCatalog({
      scannedAt: 42,
      plugins: [{ id: UID, name: "Archetype Petrucci", path: "C:/p.vst3" }],
      failed: [],
      fingerprints: {},
      sources: { folders: ["D:/Plugins"], files: [] },
    });
    expect(vstStore.readCatalog()).toMatchObject({ scannedAt: 42, sources: { folders: ["D:/Plugins"] } });
    expect(vstStore.findPlugin(UID.toLowerCase())).toMatchObject({ name: "Archetype Petrucci" });
    expect(vstStore.findPlugin("0000")).toBeNull();
  });

  it("treats a corrupt or foreign catalog as empty", () => {
    fs.writeFileSync(path.join(dir, "vst-plugins.json"), "{not json");
    expect(vstStore.readCatalog().plugins).toEqual([]);
    fs.writeFileSync(path.join(dir, "vst-plugins.json"), JSON.stringify({ version: 99, plugins: [{}] }));
    expect(vstStore.readCatalog().plugins).toEqual([]);
  });
});

describe("rack", () => {
  it("round-trips the rack and drops entries that don't look like ours", async () => {
    expect(vstStore.readRack()).toEqual([]);
    await vstStore.writeRack([
      { id: SLOT, pluginId: UID, name: "Archetype Petrucci", vendor: "Neural DSP", bypass: true },
      { id: "../../x", pluginId: UID, name: "evil", bypass: false },
    ]);
    expect(vstStore.readRack()).toEqual([
      { id: SLOT, pluginId: UID, name: "Archetype Petrucci", vendor: "Neural DSP", bypass: true },
    ]);
  });
});

describe("slot settings", () => {
  it("round-trips and deletes a slot's settings blob", async () => {
    expect(vstStore.readState(SLOT)).toBeNull();
    expect(await vstStore.writeState(SLOT, Buffer.from("RQV3state"))).toBe(true);
    expect(vstStore.readState(SLOT.toUpperCase()).toString()).toBe("RQV3state");
    await vstStore.deleteState(SLOT);
    expect(vstStore.readState(SLOT)).toBeNull();
  });

  it("refuses ids that are not slot ids, so they can never escape the folder", async () => {
    expect(await vstStore.writeState("../../evil", Buffer.from("x"))).toBe(false);
    expect(vstStore.readState("..\\..\\evil")).toBeNull();
    expect(fs.existsSync(path.join(dir, "vst-states"))).toBe(false);
  });
});
