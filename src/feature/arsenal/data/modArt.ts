/**
 * Card art for mods — one cut-out part per mod, named after the mod itself.
 *
 * The plates are transparent PNG-sourced webp: the part alone, no backdrop, so it
 * sits on whatever surface the UI puts behind it instead of carrying its own tile.
 * Only the mods listed here have a drawing; the rest fall back to a neutral tile
 * in the UI rather than borrowing someone else's picture, because a pickup shown
 * next to "MIDI control" reads as a bug. Adding art is a file at
 * `/public/images/mods/<id>.webp` plus its id in this list.
 */
export const MOD_ART_IDS: ReadonlySet<string> = new Set([
  // ── Guitar ──
  // Pickups / electronics
  "coil-split",
  "hand-wound",
  "push-pull",
  "phase-switch",
  "treble-bleed",
  "cts-pots",
  "pio-caps",
  "active-preamp",
  "copper-shielding",
  // Sustain / hardware
  "bone-nut",
  "brass-trem-block",
  "steel-saddles",
  "locking-tuners",
  "torrefied-wood",
  "chambered-body",
  // Play feeling / setup
  "plek",
  "stainless-frets",
  "rolled-edges",
  "scalloped-frets",
  "compound-radius",
  "graphite-neck",
  "satin-neck",
  "low-action",
  "truss-wheel",
  "fret-level",
  // ── Effects ──
  // Tone — components / voicing
  "nos-opamp",
  "germanium-diodes",
  "matched-transistors",
  "asym-clipping",
  "led-clipping",
  "mosfet-clipping",
  "carbon-comp",
  "film-caps",
  // Headroom — noise / dynamics / power
  "charge-pump-18v",
  "true-bypass",
  "premium-buffer",
  "shielding",
  "star-grounding",
  "gold-jacks",
  "filtered-power",
  // Versatility — controls / routing
  "midi",
  "tap-tempo",
  "stereo-io",
  "presets",
  "expression-in",
  "trim-pots",
  "dip-switches",
  "relay-switch",
  "kill-dry",
]);

/** The mod's plate, or `null` for a mod that has not been drawn yet. */
export const getModArt = (modId: string): string | null =>
  MOD_ART_IDS.has(modId) ? `/images/mods/${modId}.webp` : null;
