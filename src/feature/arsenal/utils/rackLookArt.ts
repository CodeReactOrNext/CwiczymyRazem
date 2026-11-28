import type { RackLookId } from "feature/arsenal/data/boardSkins";

/**
 * What each display case is drawn from.
 *
 * A case is one rendered photograph of an empty niche — the wall, a white lamp
 * at the top and a floor ledge at the bottom — in `public/static/images/
 * arsenal/racks`. Everything else here is what `RackScene` lays over it: how
 * hard the lamp's rarity colour is mixed into the photograph, the one thing in
 * the scene that moves, and the metal the hanger is made of.
 */

const RACK_ART_DIR = "/static/images/arsenal/racks";

/** The neon tube Backstage Neon lights in the guitar's rarity colour. */
export const RACK_NEON_TUBE_SRC = `${RACK_ART_DIR}/neon-tube.webp`;

export const rackSceneSrc = (
  look: RackLookId,
  size: "full" | "thumb" = "full",
) => `${RACK_ART_DIR}/${look}${size === "thumb" ? "-thumb" : ""}.webp`;

/** The hanger's metal, its shaded side, and the rubber pads on the yoke. */
export interface HookTones {
  metal: string;
  metalDark: string;
  pad: string;
}

const STEEL: HookTones = {
  metal: "#3a3e45",
  metalDark: "#1f2226",
  pad: "#111214",
};
const BLACK: HookTones = {
  metal: "#2a2d33",
  metalDark: "#141518",
  pad: "#0b0b0d",
};
const IRON: HookTones = {
  metal: "#4a443c",
  metalDark: "#221f1a",
  pad: "#0f0d0b",
};
const BRASS: HookTones = {
  metal: "#c9a258",
  metalDark: "#6e5223",
  pad: "#2a1a0c",
};
const GOLD: HookTones = {
  metal: "#f0d58c",
  metalDark: "#8a6420",
  pad: "#2a1d08",
};

/** What drifts through the scene, drawn on a canvas by `RackMotes`. */
export type RackMotes = "dust" | "bubbles" | "petals";

/**
 * One soft light in the scene that is never quite still: candles, lava, mist.
 * `background` is the light itself, screened over the photograph.
 */
export interface RackGlow {
  background: string;
  /** `breathe` swells and fades in place; `drift` slides slowly sideways. */
  motion: "breathe" | "drift";
  /** Seconds for one cycle. */
  period: number;
  /** In front of the guitar (mist, haze) rather than on the wall behind it. */
  front?: boolean;
}

export interface RackLookArt {
  hook: HookTones;
  /**
   * How much of the rarity colour reaches the photograph, `0..1` each: `lamp`
   * recolours the fixture and the top of its beam, `wash` tints the wall the
   * beam falls on, `pool` the floor under the guitar. Lower on a wall that has
   * a strong colour of its own, where a full tint would fight it.
   */
  tint: { lamp: number; wash: number; pool: number };
  glow?: RackGlow;
  motes?: RackMotes;
  /** A pane of glass in front of the niche, with a reflection across it. */
  glass?: boolean;
  /** The neon tube around the guitar, lit in its rarity colour. */
  neon?: boolean;
}

const FULL_TINT = { lamp: 0.9, wash: 0.85, pool: 0.45 };
const SOFT_TINT = { lamp: 0.6, wash: 0.58, pool: 0.4 };

/** Cold mist lying along the floor. */
const floorMist = (rgb: string): string =>
  `radial-gradient(70% 20% at 35% 100%, rgba(${rgb},0.2), transparent 70%), radial-gradient(60% 17% at 75% 100%, rgba(${rgb},0.14), transparent 70%)`;

export const RACK_LOOK_ART: Record<RackLookId, RackLookArt> = {
  studio: { hook: BLACK, tint: FULL_TINT },
  gallery: { hook: STEEL, tint: { lamp: 0.75, wash: 0.85, pool: 0.45 } },
  tokonoma: { hook: BLACK, tint: FULL_TINT },
  lounge: { hook: BRASS, tint: FULL_TINT },
  pod: {
    hook: STEEL,
    tint: FULL_TINT,
    glow: {
      background: floorMist("200,230,255"),
      motion: "drift",
      period: 11,
      front: true,
    },
  },
  cathedral: { hook: IRON, tint: FULL_TINT, motes: "dust" },
  deco: { hook: GOLD, tint: SOFT_TINT },
  velvet: { hook: BRASS, tint: SOFT_TINT, motes: "dust", glass: true },
  sakura: {
    hook: BLACK,
    tint: FULL_TINT,
    motes: "petals",
    glow: {
      // The two paper lanterns.
      background:
        "radial-gradient(22% 16% at 3% 80%, rgba(255,180,90,0.5), transparent 70%), radial-gradient(22% 16% at 97% 80%, rgba(255,180,90,0.5), transparent 70%)",
      motion: "breathe",
      period: 5,
    },
  },
  tubes: {
    hook: STEEL,
    tint: FULL_TINT,
    glow: {
      // The filaments, warming up and settling.
      background:
        "linear-gradient(90deg, rgba(255,130,40,0.3) 0%, transparent 24%, transparent 76%, rgba(255,130,40,0.3) 100%)",
      motion: "breathe",
      period: 7,
    },
  },
  frost: {
    hook: STEEL,
    tint: FULL_TINT,
    glow: {
      background: floorMist("190,225,255"),
      motion: "drift",
      period: 12,
      front: true,
    },
  },
  neon: { hook: BLACK, tint: { lamp: 0.8, wash: 0.5, pool: 0.5 }, neon: true },
  abyss: {
    hook: STEEL,
    tint: FULL_TINT,
    motes: "bubbles",
    glow: {
      // Light moving through the water.
      background:
        "radial-gradient(40% 50% at 40% 20%, rgba(140,200,255,0.12), transparent 70%), radial-gradient(36% 46% at 62% 34%, rgba(140,200,255,0.09), transparent 70%)",
      motion: "drift",
      period: 9,
    },
  },
  forge: {
    hook: IRON,
    tint: FULL_TINT,
    glow: {
      // The lava in the cracks at both edges.
      background:
        "linear-gradient(90deg, rgba(255,90,20,0.26) 0%, transparent 14%, transparent 86%, rgba(255,90,20,0.26) 100%), radial-gradient(60% 14% at 50% 100%, rgba(255,110,30,0.24), transparent 70%)",
      motion: "breathe",
      period: 4.2,
    },
  },
  marble: { hook: GOLD, tint: FULL_TINT, motes: "dust" },
};
