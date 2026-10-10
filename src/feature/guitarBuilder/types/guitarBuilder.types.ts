import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";

import type { FinishStyle } from "../utils/paint";

/**
 * Parts are cut by scripts/guitarBuilder/extractParts.mjs onto one template:
 * the neck is `neckWidth` px wide at the body joint and its axis is level.
 * All X/Y fields are pixels inside the part's own image.
 */
export interface BodyPart {
  key: string;
  name: string;
  src: string;
  /** R = finish weight, G = distance to the outline (px), B = pickguard weight */
  maps: string;
  /** Where stickers may sit (finish, pickguard, gloss) — grey 0..255 */
  surface: string;
  /** Single-coil covers, redrawn rather than recoloured — see paint.ts. */
  singleCoils: SingleCoilShape[];
  width: number;
  height: number;
  jointX: number;
  axisY: number;
  /** Where the fretboard ends over this body. */
  fretStartX: number;
  finishHue: number;
  finishL: number;
  pickguardL: number | null;
  /** Light range of the original pickup covers; null when none were mapped. */
  pickupTone: { lo: number; mid: number; hi: number } | null;
  /** Centre of the biggest clear patch of finish — where a new sticker lands. */
  stickerSpot: { x: number; y: number };
}

/** A single-coil cover on the body art, and the rows its six strings run along. */
export interface SingleCoilShape {
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** degrees, top toward the neck */
  lean: number;
  /** corner radius */
  r: number;
  strings: number[];
}

export interface NeckPart {
  key: string;
  name: string;
  src: string;
  width: number;
  height: number;
  jointX: number;
  axisY: number;
  nutX: number;
  nutWidth: number;
}

export interface HeadPart {
  key: string;
  name: string;
  src: string;
  width: number;
  height: number;
  nutX: number;
  axisY: number;
  nutWidth: number;
}

/** Grey figure tile (128 = flat), repeated over a body's finish. */
export interface TopPart {
  key: string;
  name: string;
  src: string;
  size: number;
  /** Lightness swing at full tile value. */
  depth: number;
}

export interface GuitarPartsManifest {
  neckWidth: number;
  bodies: BodyPart[];
  necks: NeckPart[];
  heads: HeadPart[];
  tops: TopPart[];
}

export interface StickerArt {
  key: string;
  name: string;
  src: string;
}

/** A sticker on the body; x/y/size are in the body image's pixels. */
export interface PlacedSticker {
  /** Uid of the owned sticker — each copy goes on once. */
  id: string;
  /** Sticker art key (see STICKERS). */
  key: string;
  x: number;
  y: number;
  size: number;
  /** degrees */
  rotation: number;
}

export interface GuitarBuild {
  bodyKey: string;
  neckKey: string;
  headKey: string;
  /** null keeps the body's original finish */
  finish: string | null;
  /** figured top key, null = solid */
  top: string | null;
  burst: boolean;
  /** middle ring of a multi-tone burst */
  burstColor: string | null;
  style: FinishStyle;
  /** null keeps the original pickguard */
  pickguard: string | null;
  /** pickup cover paint, null keeps the original covers */
  pickups: { color: string; metal: boolean } | null;
  stickers: PlacedSticker[];
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DrawStep {
  part: "body" | "neck" | "head";
  src: Rect;
  dest: Rect;
}

export interface GuitarLayout {
  width: number;
  height: number;
  steps: DrawStep[];
}

// ─── Components: the parts a player rolls and builds from ──────────────────

export type ComponentRarity = Exclude<GuitarRarity, "Custom Shop">;

export type ComponentSlot =
  | "body"
  | "neck"
  | "head"
  | "pickups"
  | "finish"
  | "pickguard"
  | "sticker";

/** Pickup routing a body is cut for, and the type a pickup set is. */
export type PickupType = "S" | "H" | "P90";

interface ComponentBase {
  id: string;
  name: string;
  rarity: ComponentRarity;
}

export type ComponentDef = ComponentBase &
  (
    | { slot: "body"; partKey: string; routing: PickupType; source: string }
    | { slot: "neck"; partKey: string }
    | { slot: "head"; partKey: string }
    | { slot: "pickups"; type: PickupType; cover: string; metal: boolean }
    | {
        slot: "finish";
        color: string;
        top: string | null;
        burst: boolean;
        burstColor: string | null;
        style: FinishStyle;
      }
    | { slot: "pickguard"; color: string }
    | { slot: "sticker"; stickerKey: string }
  );

export type ComponentOf<S extends ComponentSlot> = Extract<
  ComponentDef,
  { slot: S }
>;

/** One copy in the stash: the level is rolled once, when it drops. */
export interface OwnedComponent {
  uid: string;
  defId: string;
  level: number;
  /** Epoch ms it dropped. Absent on demo stashes. */
  acquiredAt?: number;
  /** Not yet seen in the Builder tab. */
  isNew?: boolean;
}

/**
 * What a built guitar is made of, stored on its inventory item. The parts
 * travel with the guitar — a rebuild hands them back to the stash first.
 */
export interface CustomGuitarRecord {
  /** Sum of the parts' levels (best stickers only) — the guitar's level. */
  level: number;
  parts: OwnedComponent[];
  loadout: Loadout;
  stickers: PlacedSticker[];
}

/** What is bolted onto the guitar — owned component uids per slot. */
export interface Loadout {
  body: string | null;
  neck: string | null;
  head: string | null;
  pickups: string | null;
  finish: string | null;
  pickguard: string | null;
}
