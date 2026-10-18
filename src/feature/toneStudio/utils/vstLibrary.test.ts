import type { VstPluginInfo } from "types/vstHost";
import { describe, expect, it } from "vitest";

import { filterPlugins, pluginCategory, presentCategories } from "./vstLibrary";

const plugin = (
  name: string,
  subCategories: string,
  vendor = "Acme",
): VstPluginInfo => ({
  id: name.padEnd(32, "0"),
  name,
  vendor,
  subCategories,
  version: "1",
  source: "system",
});

const PETRUCCI = plugin(
  "Archetype Petrucci",
  "Fx|Distortion|Dynamics|Reverb",
  "Neural DSP",
);
const NAM = plugin("NeuralAmpModeler", "Fx", "Steven Atkinson");
const OZONE_EQ = plugin("iZotope Ozone 7 Equalizer", "Fx|EQ", "iZotope, Inc.");
const OZONE = plugin("iZotope Ozone 7", "Fx|Mastering", "iZotope, Inc.");
const DOUBLER = plugin(
  "Vocal Doubler",
  "Fx|Modulation|Vocals",
  "iZotope, Inc.",
);
const SAMPLER = plugin("SSDSampler5", "Fx");

describe("pluginCategory", () => {
  it("files an amp sim under amp even when it also lists dynamics and reverb", () => {
    expect(pluginCategory(PETRUCCI)).toBe("amp");
  });

  it("recognises amp sims that only say Fx by name, without catching samplers", () => {
    expect(pluginCategory(NAM)).toBe("amp");
    expect(pluginCategory(SAMPLER)).toBe("other");
  });

  it("maps the standard VST3 categories", () => {
    expect(pluginCategory(OZONE_EQ)).toBe("eq");
    expect(pluginCategory(OZONE)).toBe("dynamics");
    expect(pluginCategory(DOUBLER)).toBe("modulation");
    expect(pluginCategory(plugin("Room", "Fx|Reverb"))).toBe("space");
  });
});

describe("filterPlugins", () => {
  const all = [OZONE, PETRUCCI, NAM, OZONE_EQ, DOUBLER];

  it("matches every word against name or vendor, in any order", () => {
    expect(filterPlugins(all, "izotope eq", "all").map((p) => p.name)).toEqual([
      "iZotope Ozone 7 Equalizer",
    ]);
    expect(filterPlugins(all, "neural", "all").map((p) => p.name)).toEqual([
      "Archetype Petrucci",
      "NeuralAmpModeler",
    ]);
  });

  it("narrows to a category and sorts by name", () => {
    expect(filterPlugins(all, "", "amp").map((p) => p.name)).toEqual([
      "Archetype Petrucci",
      "NeuralAmpModeler",
    ]);
  });

  it("lists only the categories that have plugins, in library order", () => {
    expect(presentCategories(all)).toEqual([
      "amp",
      "dynamics",
      "eq",
      "modulation",
    ]);
  });
});
