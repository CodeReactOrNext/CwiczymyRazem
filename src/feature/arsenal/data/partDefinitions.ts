import type { PartId, PartTier } from "../types/arsenal.types";

/** Ordered low → high; index doubles as the tier's numeric rank. */
export const PART_TIERS: PartTier[] = ["Standard", "Epic", "Legendary", "Unique"];

export const PART_TIER_COLORS: Record<PartTier, string> = {
  Standard: "#9ca3af",
  Epic: "#a855f7",
  Legendary: "#f59e0b",
  Unique: "#06b6d4",
};

export interface PartDefinition {
  id: PartId;
  label: string;
  /** Which teardown yields it. `shared` parts drop from guitars and pedals alike. */
  group: "guitar" | "pedal" | "shared";
  /**
   * Highest tier this part can roll. Filler parts stay Standard — nobody brags
   * about a legendary screw.
   */
  maxTier: Exclude<PartTier, "Unique">;
  /** Only visually meaningful parts can roll the Unique tier. */
  unique?: boolean;
  /**
   * 128px transparent WebP in `public/images/parts`. Parts without artwork fall
   * back to a generic glyph in `PartIcon`.
   */
  icon?: string;
}

const icon = (id: PartId) => `/images/parts/${id}.webp`;

/**
 * Deliberately short. Every entry has to pass "I want a better X" — filler parts
 * (screws aside, which anchor the 100% drop guarantee) and near-duplicates of
 * another part were cut rather than padding the list out.
 */
export const PART_DEFINITIONS: PartDefinition[] = [
  // ─── Guitar teardown ───────────────────────────────────────────────────────
  { id: "body", label: "Body", group: "guitar", maxTier: "Legendary", unique: true, icon: icon("body") },
  { id: "neck", label: "Neck", group: "guitar", maxTier: "Legendary", icon: icon("neck") },
  { id: "bridge", label: "Bridge", group: "guitar", maxTier: "Legendary", unique: true, icon: icon("bridge") },
  { id: "pickup", label: "Pickup", group: "guitar", maxTier: "Legendary", unique: true, icon: icon("pickup") },
  { id: "tuners", label: "Tuner", group: "guitar", maxTier: "Legendary", icon: icon("tuners") },
  // ─── Pedal teardown ────────────────────────────────────────────────────────
  { id: "enclosure", label: "Enclosure", group: "pedal", maxTier: "Legendary", unique: true, icon: icon("enclosure") },
  { id: "opamp", label: "Op-Amp", group: "pedal", maxTier: "Legendary", icon: icon("opamp") },
  { id: "diode", label: "Diode", group: "pedal", maxTier: "Legendary", icon: icon("diode") },
  // ─── Dropped by both ───────────────────────────────────────────────────────
  { id: "pot", label: "Potentiometer", group: "shared", maxTier: "Epic", icon: icon("pot") },
  { id: "screws", label: "Screw", group: "shared", maxTier: "Standard", icon: icon("screws") },
];

export const PARTS_BY_ID = new Map<PartId, PartDefinition>(
  PART_DEFINITIONS.map((p) => [p.id, p])
);

export const getPartLabel = (id: PartId): string => PARTS_BY_ID.get(id)?.label ?? id;
