export type PillPresetKey = "capsule" | "rounded" | "sharp" | "chunky";

export interface PillPreset {
  /** Label shown in the picker. */
  label: string;
  /** One-line character description under the label. */
  desc: string;
  /** Pill height in world px — the worker's BLOCK_H. */
  height: number;
  /** Corner radius in world px — the worker's BLOCK_CORNER. */
  corner: number;
}

/**
 * Note-pill shapes offered under the tablature. The worker ships with the
 * "rounded" numbers baked in as its defaults, so that stays the fallback
 * whenever nothing is stored yet.
 */
export const PILL_PRESETS: Record<PillPresetKey, PillPreset> = {
  capsule: {
    label: "Capsule",
    desc: "Fully rounded ends",
    height: 22,
    corner: 11,
  },
  rounded: { label: "Rounded", desc: "Soft corners", height: 22, corner: 5 },
  sharp: {
    label: "Sharp",
    desc: "Near-square, technical",
    height: 22,
    corner: 2,
  },
  chunky: { label: "Chunky", desc: "Taller and bolder", height: 26, corner: 8 },
};

/** Display order in the picker — widest corner radius to tightest, then the tall one. */
export const PILL_PRESET_ORDER: PillPresetKey[] = [
  "capsule",
  "rounded",
  "sharp",
  "chunky",
];

export const DEFAULT_PILL_PRESET: PillPresetKey = "rounded";
