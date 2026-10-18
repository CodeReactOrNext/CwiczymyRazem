import type { VstPluginInfo } from "types/vstHost";

export type VstCategory =
  | "amp"
  | "dynamics"
  | "eq"
  | "space"
  | "modulation"
  | "other";

/** Library filter order — guitar-first: what you'd reach for in a rig. */
export const VST_CATEGORIES: VstCategory[] = [
  "amp",
  "dynamics",
  "eq",
  "space",
  "modulation",
  "other",
];

// First match wins, in this order: an amp sim tagged "Distortion|Dynamics|
// Reverb" (Archetypes are) is an amp, not a compressor.
const RULES: [VstCategory, string[]][] = [
  ["amp", ["distortion", "amp"]],
  ["dynamics", ["dynamics", "mastering"]],
  ["eq", ["eq", "filter"]],
  ["space", ["reverb", "delay", "spatial", "surround"]],
  ["modulation", ["modulation", "pitch shift"]],
];

// Amp sims that only declare a bare "Fx" (Neural Amp Modeler does).
const AMP_NAME = /archetype|ampmodeler|amp sim|\bamp\b/i;

/** Where a plugin sits in the library, from its VST3 category path. */
export const pluginCategory = (
  plugin: Pick<VstPluginInfo, "name" | "subCategories">,
): VstCategory => {
  const parts = plugin.subCategories
    .split("|")
    .map((part) => part.trim().toLowerCase());
  for (const [category, keys] of RULES) {
    if (keys.some((key) => parts.includes(key))) return category;
  }
  return AMP_NAME.test(plugin.name) ? "amp" : "other";
};

/** Search (name or vendor, any word order) + category, sorted by name. */
export const filterPlugins = (
  plugins: VstPluginInfo[],
  query: string,
  category: VstCategory | "all",
): VstPluginInfo[] => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return plugins
    .filter(
      (plugin) => category === "all" || pluginCategory(plugin) === category,
    )
    .filter((plugin) => {
      const haystack = `${plugin.name} ${plugin.vendor}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

/** Categories that actually have plugins, in library order. */
export const presentCategories = (plugins: VstPluginInfo[]): VstCategory[] => {
  const present = new Set(plugins.map(pluginCategory));
  return VST_CATEGORIES.filter((category) => present.has(category));
};
