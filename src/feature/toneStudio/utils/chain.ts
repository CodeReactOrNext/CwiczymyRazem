import type { AmpParams } from "types/nativeAudio";

export type ToneAccent = "cyan" | "amber" | "emerald" | "purple" | "orange";

export interface ChainBlock {
  key: "gate" | "overdrive" | "amp" | "cab" | "delay";
  label: (params: AmpParams) => string;
  accent: ToneAccent;
  isActive: (params: AmpParams) => boolean;
  /** Patch that flips the block on/off. Absent for blocks that cannot be
   *  bypassed — the amp itself is always in the path. */
  toggle?: (params: AmpParams) => Partial<AmpParams>;
}

/**
 * Signal chain in the real DSP order of electron/ampSim.js `process()`:
 * gate → overdrive → (NAM model | classic preamp/tone-stack/drive) → cabinet →
 * delay. Single source for both Tone Studio's rack of units and the
 * in-session quick toggles, so the two never disagree on order or state.
 */
export const CHAIN_BLOCKS: ChainBlock[] = [
  {
    key: "gate",
    label: () => "Gate",
    accent: "cyan",
    isActive: (p) => p.gate,
    toggle: (p) => ({ gate: !p.gate }),
  },
  {
    key: "overdrive",
    label: () => "Overdrive",
    accent: "orange",
    isActive: (p) => p.overdriveEnabled,
    toggle: (p) => ({ overdriveEnabled: !p.overdriveEnabled }),
  },
  {
    key: "amp",
    label: (p) => (p.namEnabled ? "Amp · NAM" : "Amp · Classic"),
    accent: "cyan",
    isActive: () => true,
  },
  {
    key: "cab",
    label: () => "Cabinet",
    accent: "emerald",
    isActive: (p) => p.cab,
    toggle: (p) => ({ cab: !p.cab }),
  },
  {
    key: "delay",
    label: () => "Delay",
    accent: "amber",
    isActive: (p) => p.delayEnabled,
    toggle: (p) => ({ delayEnabled: !p.delayEnabled }),
  },
];
