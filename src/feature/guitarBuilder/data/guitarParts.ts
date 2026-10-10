import type {
  BodyPart,
  GuitarPartsManifest,
  HeadPart,
  NeckPart,
  StickerArt,
  TopPart,
} from "../types/guitarBuilder.types";
import manifest from "./parts.generated.json";

/** Regenerate with `node scripts/guitarBuilder/extractParts.mjs`. */
export const GUITAR_PARTS: GuitarPartsManifest = manifest;

const sticker = (key: string, name: string): StickerArt => ({
  key,
  name,
  src: `/images/guitar-builder/stickers/${key}.svg`,
});

/** Placeholder vector stickers — swap for generated art, same keys. */
export const STICKERS: StickerArt[] = [
  sticker("bolt", "Bolt"),
  sticker("flame", "Flame"),
  sticker("heart", "Heart"),
  sticker("note", "Note"),
  sticker("shred", "Shred"),
  sticker("skull", "Skull"),
  sticker("smiley", "Smiley"),
  sticker("star", "Star"),
];

export const MAX_STICKERS = 12;
export const STICKER_SIZE = { min: 32, max: 240, initial: 96 };

/** Art drawn for a slot the loadout leaves empty, so the preview is never blank. */
export const STOCK_PARTS = {
  bodyKey: "t-style",
  neckKey: "maple-dots",
  headKey: "six-inline",
};

const byKey = <T extends { key: string }>(list: T[], key: string) =>
  list.find((item) => item.key === key) ?? list[0];

export const getBody = (key: string): BodyPart =>
  byKey(GUITAR_PARTS.bodies, key);
export const getNeck = (key: string): NeckPart =>
  byKey(GUITAR_PARTS.necks, key);
export const getHead = (key: string): HeadPart =>
  byKey(GUITAR_PARTS.heads, key);
export const getSticker = (key: string): StickerArt => byKey(STICKERS, key);
export const getTop = (key: string | null): TopPart | null =>
  key ? (GUITAR_PARTS.tops.find((top) => top.key === key) ?? null) : null;
