/**
 * Skins for the pedalboard: what the signal cable is made of, and what the
 * board itself is built from.
 *
 * They are bought with supporter tokens in the supporter panel and change
 * nothing but how the board looks. The routing of the cable, the size of the
 * deck and the verdict colours all stay where they are — a run wired backwards
 * is red on every cable in this file, which is why none of them is red or
 * emerald, and why orange is left to the power loom.
 *
 * Prices are in tokens, ten to the dollar (`TOKENS_PER_DOLLAR`). A cable costs
 * what a couple of roadmap ideas do; a board costs about what a generated
 * roadmap does, because it redraws the whole object rather than one line on it.
 */

/** The jacket's gauge, in board units. `SignalCable` draws every run at it. */
export const CABLE_JACKET_W = 1.9;

/** One dashed stroke laid along the run: how a braid is drawn. */
export interface WeaveLayer {
  color: string;
  width: number;
  dash: string;
  offset: number;
  opacity: number;
}

/** Everything a run of cable is painted with, bottom layer to top. */
export interface CablePaint {
  jacket: string;
  /** The bright line down the spine. A braid has none. */
  core?: string;
  coreWidth?: number;
  /** The travelling dash a flawless board carries. */
  pulse: string;
  /** A soft halo under the run, for the cables that are lit from inside. */
  glow?: string;
  glowOpacity?: number;
  weave?: WeaveLayer[];
  /** A dark line low on the jacket: what makes a pale or woven cable round. */
  shade?: number;
  /** The highlight along the top. Defaults to a rubber jacket's. */
  sheen?: number;
}

export type PlugMetal = "nickel" | "gold" | "black";

/** Five stops down a cylinder: highlight, body, core shadow, shadow, bounce. */
export const PLUG_METALS: Record<PlugMetal, readonly string[]> = {
  nickel: ["#c9d1d8", "#8e969d", "#454b51", "#2a2e33", "#767d84"],
  gold: ["#f6e2a4", "#cfa850", "#7d5d20", "#4e3912", "#b48e40"],
  black: ["#7b8088", "#44474d", "#1a1b1e", "#0c0c0e", "#3c3f45"],
};

/** Offsets the stops above sit at, in percent. */
export const PLUG_METAL_STOPS = [0, 22, 48, 72, 100] as const;

export type BoardLookId = "rail" | "wood" | "tweed" | "road" | "steel";

interface SkinBase {
  id: string;
  /** A proper name, the same in every language. */
  name: string;
  /** Supporter tokens. */
  price: number;
}

export interface CableSkin extends SkinBase {
  kind: "cable";
  metal: PlugMetal;
  /** The strain-relief boot behind each plug. */
  boot: string;
  /** A pale boot wants fainter ribs than a black one. */
  lightBoot?: boolean;
  paint: CablePaint;
}

export interface BoardSkin extends SkinBase {
  kind: "board";
  look: BoardLookId;
}

export type RigSkin = CableSkin | BoardSkin;
export type SkinKind = RigSkin["kind"];

/**
 * A two-colour braid: the light thread across the full width, then the dark
 * and the light again down the middle, half a cell apart, which is what turns
 * a row of dashes into a checker that reads as woven.
 */
const braid = (
  dark: string,
  light: string,
  cell: number,
  opacity: number,
): WeaveLayer[] => [
  {
    color: light,
    width: CABLE_JACKET_W,
    dash: `${cell} ${cell}`,
    offset: 0,
    opacity,
  },
  { color: dark, width: 0.72, dash: `${cell} ${cell}`, offset: 0, opacity: 1 },
  {
    color: light,
    width: 0.72,
    dash: `${cell} ${cell}`,
    offset: cell,
    opacity,
  },
];

/** Plain colours cost least, braids more, and the two showpieces most. */
const CABLE_PRICE = { plain: 30, braided: 40, special: 50, top: 60 } as const;

export const CABLE_SKINS: CableSkin[] = [
  {
    id: "cable-cobalt",
    kind: "cable",
    name: "Cobalt",
    price: CABLE_PRICE.plain,
    metal: "nickel",
    boot: "#151a2b",
    paint: {
      jacket: "#1b2f7a",
      core: "#60a5fa",
      pulse: "#dbeafe",
      glow: "#3b82f6",
      glowOpacity: 0.1,
      shade: 0.25,
      sheen: 0.14,
    },
  },
  {
    id: "cable-violet",
    kind: "cable",
    name: "Violet",
    price: CABLE_PRICE.plain,
    metal: "black",
    boot: "#17131f",
    paint: {
      jacket: "#3a1d6e",
      core: "#a78bfa",
      pulse: "#ede9fe",
      glow: "#8b5cf6",
      glowOpacity: 0.1,
      shade: 0.25,
      sheen: 0.14,
    },
  },
  {
    id: "cable-glacier",
    kind: "cable",
    name: "Glacier",
    price: CABLE_PRICE.plain,
    metal: "nickel",
    boot: "#d5e4ec",
    lightBoot: true,
    paint: {
      jacket: "#a9cfe2",
      core: "#ffffff",
      coreWidth: 0.34,
      pulse: "#2563eb",
      shade: 0.28,
      sheen: 0.45,
    },
  },
  {
    id: "cable-bone",
    kind: "cable",
    name: "Bone",
    price: CABLE_PRICE.plain,
    metal: "gold",
    boot: "#cfc8b8",
    lightBoot: true,
    paint: {
      jacket: "#d9d3c5",
      core: "#a8a091",
      coreWidth: 0.3,
      pulse: "#fbbf24",
      shade: 0.28,
      sheen: 0.5,
    },
  },
  {
    id: "cable-tweed",
    kind: "cable",
    name: "Tweed",
    price: CABLE_PRICE.braided,
    metal: "nickel",
    boot: "#2a1d13",
    paint: {
      jacket: "#6f5229",
      weave: braid("#6f5229", "#dcc183", 0.8, 0.92),
      pulse: "#fff3cf",
      shade: 0.3,
      sheen: 0.1,
    },
  },
  {
    id: "cable-slate",
    kind: "cable",
    name: "Slate Cloth",
    price: CABLE_PRICE.braided,
    metal: "nickel",
    boot: "#1b1c21",
    paint: {
      jacket: "#262a30",
      weave: braid("#262a30", "#727985", 0.8, 0.85),
      pulse: "#e4e4e7",
      shade: 0.3,
      sheen: 0.1,
    },
  },
  {
    id: "cable-denim",
    kind: "cable",
    name: "Denim",
    price: CABLE_PRICE.braided,
    metal: "nickel",
    boot: "#141a2b",
    paint: {
      jacket: "#1c2a4d",
      weave: braid("#1c2a4d", "#86a2d8", 0.8, 0.85),
      pulse: "#dbeafe",
      shade: 0.3,
      sheen: 0.1,
    },
  },
  {
    id: "cable-houndstooth",
    kind: "cable",
    name: "Houndstooth",
    price: CABLE_PRICE.braided,
    metal: "black",
    boot: "#101012",
    paint: {
      jacket: "#111113",
      weave: braid("#111113", "#ebe8e1", 0.9, 0.95),
      pulse: "#ffffff",
      shade: 0.3,
      sheen: 0.08,
    },
  },
  {
    id: "cable-steel",
    kind: "cable",
    name: "Steel Braid",
    price: CABLE_PRICE.special,
    metal: "nickel",
    boot: "#1b1c21",
    paint: {
      jacket: "#59606a",
      weave: braid("#59606a", "#dfe4e9", 0.55, 0.9),
      pulse: "#ffffff",
      shade: 0.4,
      sheen: 0.3,
    },
  },
  {
    id: "cable-bumblebee",
    kind: "cable",
    name: "Bumblebee",
    price: CABLE_PRICE.special,
    metal: "black",
    boot: "#131315",
    paint: {
      jacket: "#131315",
      weave: [
        {
          color: "#e8b70e",
          width: CABLE_JACKET_W,
          dash: "1.8 1.8",
          offset: 0,
          opacity: 1,
        },
      ],
      pulse: "#fff6bf",
      shade: 0.32,
      sheen: 0.2,
    },
  },
  {
    id: "cable-studio-gold",
    kind: "cable",
    name: "Studio Gold",
    price: CABLE_PRICE.top,
    metal: "gold",
    boot: "#141416",
    paint: {
      jacket: "#0e0e10",
      core: "#d4a94a",
      coreWidth: 0.42,
      pulse: "#fde9a8",
      sheen: 0.14,
    },
  },
];

/** Open frames cost least; the two cases with hardware all over them most. */
export const BOARD_SKINS: BoardSkin[] = [
  { id: "board-rail", kind: "board", name: "Rail Board", price: 80, look: "rail" },
  {
    id: "board-steel",
    kind: "board",
    name: "Tiered Steel",
    price: 80,
    look: "steel",
  },
  {
    id: "board-walnut",
    kind: "board",
    name: "Walnut Slab",
    price: 100,
    look: "wood",
  },
  { id: "board-road", kind: "board", name: "Road Case", price: 120, look: "road" },
  {
    id: "board-tweed",
    kind: "board",
    name: "Tweed Suitcase",
    price: 120,
    look: "tweed",
  },
];

export const RIG_SKINS: RigSkin[] = [...CABLE_SKINS, ...BOARD_SKINS];

export const SKINS_BY_ID: ReadonlyMap<string, RigSkin> = new Map(
  RIG_SKINS.map((skin) => [skin.id, skin]),
);

/**
 * What an account holds: every skin it has bought, and the one of each kind it
 * is wearing. `null` is the stock cable or the stock flight case.
 *
 * Stored at `arsenal.boardSkins` and written only by `/api/supporter/skins`.
 */
export interface BoardSkinState {
  owned: string[];
  cable: string | null;
  board: string | null;
}

export const EMPTY_BOARD_SKINS: BoardSkinState = {
  owned: [],
  cable: null,
  board: null,
};

/**
 * The state, read off whatever Firestore holds.
 *
 * Unknown ids are dropped rather than trusted — a skin retired from this file
 * simply stops being drawn — and nothing is worn that is not owned.
 */
export const readBoardSkins = (stored: unknown): BoardSkinState => {
  const raw = (stored ?? {}) as Record<string, unknown>;
  const owned = Array.isArray(raw.owned)
    ? [
        ...new Set(
          raw.owned.filter(
            (id): id is string => typeof id === "string" && SKINS_BY_ID.has(id),
          ),
        ),
      ]
    : [];

  const worn = (value: unknown, kind: SkinKind): string | null =>
    typeof value === "string" &&
    owned.includes(value) &&
    SKINS_BY_ID.get(value)?.kind === kind
      ? value
      : null;

  return {
    owned,
    cable: worn(raw.cable, "cable"),
    board: worn(raw.board, "board"),
  };
};

/** The cable an account is wearing, or `undefined` for the stock one. */
export const wornCable = (state: BoardSkinState): CableSkin | undefined => {
  const skin = state.cable ? SKINS_BY_ID.get(state.cable) : undefined;
  return skin?.kind === "cable" ? skin : undefined;
};

/** The board an account is wearing, or `undefined` for the flight case. */
export const wornBoardLook = (
  state: BoardSkinState,
): BoardLookId | undefined => {
  const skin = state.board ? SKINS_BY_ID.get(state.board) : undefined;
  return skin?.kind === "board" ? skin.look : undefined;
};

/** The state after a purchase. A new skin goes straight on. */
export const withPurchase = (
  state: BoardSkinState,
  skin: RigSkin,
): BoardSkinState => ({
  ...state,
  owned: [...state.owned, skin.id],
  [skin.kind]: skin.id,
});
