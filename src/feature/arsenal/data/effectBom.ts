import type { EffectType, ScrapBom } from "../types/arsenal.types";

/**
 * What each pedal holds, in salvage order. Pedals are far more alike than guitars,
 * so the list comes from the effect *type* and only genuine exceptions get a
 * per-id override.
 *
 * Same rules as guitars: order is priority, not inventory, and a part the circuit
 * does not have is simply omitted — a fuzz is discrete, so it has no op-amp slot.
 */

export const EFFECT_BOM_BY_TYPE: Record<EffectType, ScrapBom> = {
  Overdrive: [
    { partId: "diode", qty: 2 },
    { partId: "opamp", qty: 1 },
    { partId: "enclosure", qty: 1 },
    { partId: "pot", qty: 1 },
  ],
  Distortion: [
    { partId: "diode", qty: 3 },
    { partId: "opamp", qty: 1 },
    { partId: "enclosure", qty: 1 },
    { partId: "pot", qty: 1 },
  ],
  // Discrete circuit — clips hard, but there is no op-amp in it.
  Fuzz: [
    { partId: "enclosure", qty: 1 },
    { partId: "diode", qty: 2 },
    { partId: "pot", qty: 1 },
  ],
  Boost: [
    { partId: "opamp", qty: 1 },
    { partId: "enclosure", qty: 1 },
    { partId: "pot", qty: 1 },
  ],
  Compressor: [
    { partId: "opamp", qty: 1 },
    { partId: "diode", qty: 1 },
    { partId: "enclosure", qty: 1 },
    { partId: "pot", qty: 1 },
  ],
  Delay: [
    { partId: "opamp", qty: 2 },
    { partId: "enclosure", qty: 1 },
    { partId: "pot", qty: 1 },
    { partId: "screws", qty: 1 },
  ],
  Reverb: [
    { partId: "opamp", qty: 2 },
    { partId: "enclosure", qty: 1 },
    { partId: "diode", qty: 1 },
  ],
  Chorus: [
    { partId: "opamp", qty: 2 },
    { partId: "enclosure", qty: 1 },
    { partId: "pot", qty: 1 },
  ],
  Flanger: [
    { partId: "opamp", qty: 2 },
    { partId: "pot", qty: 2 },
    { partId: "enclosure", qty: 1 },
  ],
  Phaser: [
    { partId: "opamp", qty: 2 },
    { partId: "enclosure", qty: 1 },
    { partId: "pot", qty: 1 },
  ],
  Vibrato: [
    { partId: "opamp", qty: 2 },
    { partId: "enclosure", qty: 1 },
    { partId: "pot", qty: 1 },
  ],
  // A treadle: the sweep pot is the thing worth having.
  Wah: [
    { partId: "pot", qty: 1 },
    { partId: "enclosure", qty: 1 },
    { partId: "opamp", qty: 1 },
  ],
  // A bank of sliders — the one pedal that really is pot-heavy.
  EQ: [
    { partId: "pot", qty: 2 },
    { partId: "opamp", qty: 2 },
    { partId: "enclosure", qty: 1 },
  ],
  // No audio path to speak of — just the detector chip.
  Tuner: [
    { partId: "opamp", qty: 1 },
    { partId: "enclosure", qty: 1 },
    { partId: "screws", qty: 1 },
  ],
};

/** Per-id exceptions. Stereo boxes carry a wider harness than their type implies. */
export const EFFECT_BOM_OVERRIDES: Record<number, ScrapBom> = {
  // Stereo Delay Lab
  12: [
    { partId: "opamp", qty: 3 },
    { partId: "enclosure", qty: 1 },
    { partId: "pot", qty: 2 },
    { partId: "screws", qty: 1 },
  ],
};

export const getEffectBom = (id: number | string, type: EffectType): ScrapBom =>
  EFFECT_BOM_OVERRIDES[Number(id)] ?? EFFECT_BOM_BY_TYPE[type] ?? EFFECT_BOM_BY_TYPE.Overdrive;
