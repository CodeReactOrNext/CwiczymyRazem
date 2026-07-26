import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { MAX_IR_TAPS } from "./dsp/convolver";
import * as toneStore from "./toneStore";

// electron's `app` module only exists inside the real Electron runtime — under
// Node/Vitest, `require("electron")` resolves to a path string, not the API object,
// so mocking `app.getPath` via vi.mock doesn't reach the plain `require()` call
// inside toneStore.js. Use its test-only directory override instead.
const testUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tone-store-test-"));
toneStore._setUserDataDirForTests(testUserDataDir);

function writeMinimalWav(filePath, { sampleRate, samples }) {
  const dataSize = samples.length * 4;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(3, 20); // IEEE float
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(32, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);
  samples.forEach((v, i) => buffer.writeFloatLE(v, 44 + i * 4));
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

afterAll(() => {
  fs.rmSync(testUserDataDir, { recursive: true, force: true });
});

describe("toneStore presets", () => {
  it("starts with an empty preset list", () => {
    expect(toneStore.listPresets()).toEqual([]);
  });

  it("saves and lists a preset", () => {
    const preset = { id: "p1", name: "My Tone", params: { drive: 0.5 }, builtIn: false, createdAt: 1 };
    toneStore.savePreset(preset);
    expect(toneStore.listPresets()).toEqual([preset]);
  });

  it("overwrites (not duplicates) a preset with the same id", () => {
    const updated = { id: "p1", name: "My Tone v2", params: { drive: 0.9 }, builtIn: false, createdAt: 1 };
    toneStore.savePreset(updated);
    const all = toneStore.listPresets();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("My Tone v2");
  });

  it("deletes a preset by id", () => {
    toneStore.deletePreset("p1");
    expect(toneStore.listPresets()).toEqual([]);
  });
});

describe("toneStore IRs", () => {
  const sampleRate = 48000;
  const samples = [0.1, 0.2, 0.3, 0.4, -0.1, -0.2];
  let wavPath;

  beforeEach(() => {
    wavPath = path.join(testUserDataDir, "test-ir.wav");
    writeMinimalWav(wavPath, { sampleRate, samples });
  });

  it("imports a WAV IR and lists it", () => {
    const meta = toneStore.importIR(wavPath);
    expect(meta.sampleRate).toBe(sampleRate);
    expect(meta.lengthSamples).toBe(samples.length);
    expect(meta.truncated).toBe(false);

    const listed = toneStore.listIRs();
    expect(listed.some((ir) => ir.id === meta.id)).toBe(true);
  });

  it("resolves IR samples unresampled when the target sample rate matches", () => {
    const meta = toneStore.importIR(wavPath);
    const resolved = toneStore.getIRSamples(meta.id, sampleRate);
    expect(resolved.length).toBe(samples.length);
    resolved.forEach((v, i) => expect(v).toBeCloseTo(samples[i], 5));
  });

  it("resamples IR samples for a different target sample rate", () => {
    const meta = toneStore.importIR(wavPath);
    const resolved = toneStore.getIRSamples(meta.id, sampleRate / 2);
    expect(resolved.length).toBeCloseTo(samples.length / 2, 0);
  });

  it("truncates IRs longer than MAX_IR_TAPS and flags it", () => {
    const longPath = path.join(testUserDataDir, "long-ir.wav");
    const longSamples = new Array(MAX_IR_TAPS + 1000).fill(0.001);
    writeMinimalWav(longPath, { sampleRate, samples: longSamples });

    const meta = toneStore.importIR(longPath);
    expect(meta.truncated).toBe(true);
    expect(meta.lengthSamples).toBe(MAX_IR_TAPS);
    expect(meta.originalLengthSamples).toBe(longSamples.length);
  });

  it("deleting an IR removes it and its cached samples", () => {
    const meta = toneStore.importIR(wavPath);
    expect(toneStore.getIRSamples(meta.id, sampleRate)).not.toBeNull();

    toneStore.deleteIR(meta.id);
    expect(toneStore.listIRs().some((ir) => ir.id === meta.id)).toBe(false);
    expect(toneStore.getIRSamples(meta.id, sampleRate)).toBeNull();
  });
});

describe("toneStore NAM models", () => {
  function writeNamFile(filePath, overrides = {}) {
    const model = {
      version: "0.5.4",
      metadata: { gear_make: "Darkglass Electronics", gear_model: "Microtubes 900 v2" },
      architecture: "WaveNet",
      config: { layers: [], head: null, head_scale: 0.02 },
      weights: [0.1, 0.2, 0.3],
      sample_rate: 48000,
      ...overrides,
    };
    fs.writeFileSync(filePath, JSON.stringify(model));
    return filePath;
  }

  it("starts with an empty model list", () => {
    expect(toneStore.listNamModels()).toEqual([]);
  });

  it("imports a .nam file and lists it with metadata", () => {
    const namPath = writeNamFile(path.join(testUserDataDir, "test-amp.nam"));
    const meta = toneStore.importNamModel(namPath);
    expect(meta.architecture).toBe("WaveNet");
    expect(meta.gearMake).toBe("Darkglass Electronics");
    expect(meta.gearModel).toBe("Microtubes 900 v2");
    expect(meta.name).toBe("test-amp");

    const listed = toneStore.listNamModels();
    expect(listed.some((m) => m.id === meta.id)).toBe(true);
  });

  it("resolves an imported model id back to its raw JSON text", () => {
    const namPath = writeNamFile(path.join(testUserDataDir, "test-amp-2.nam"));
    const meta = toneStore.importNamModel(namPath);
    const json = toneStore.getNamModelJson(meta.id);
    expect(JSON.parse(json).architecture).toBe("WaveNet");
  });

  it("returns null for an unknown or missing model id", () => {
    expect(toneStore.getNamModelJson("nam_does_not_exist")).toBeNull();
    expect(toneStore.getNamModelJson(null)).toBeNull();
  });

  it("rejects a file missing architecture/weights", () => {
    const badPath = path.join(testUserDataDir, "bad.nam");
    fs.writeFileSync(badPath, JSON.stringify({ foo: "bar" }));
    expect(() => toneStore.importNamModel(badPath)).toThrow();
  });

  it("deleting a model removes it from the list and its JSON becomes unresolvable", () => {
    const namPath = writeNamFile(path.join(testUserDataDir, "test-amp-3.nam"));
    const meta = toneStore.importNamModel(namPath);
    toneStore.deleteNamModel(meta.id);
    expect(toneStore.listNamModels().some((m) => m.id === meta.id)).toBe(false);
    expect(toneStore.getNamModelJson(meta.id)).toBeNull();
  });
});
