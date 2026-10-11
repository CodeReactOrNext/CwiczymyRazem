import {
  OFFSET_FLOATING_P90,
  OFFSET_TOM,
  S_TYPE,
  S_TYPE_MODERN_HSH,
  SEMI_HOLLOW,
  SET_NECK_TOM,
  SET_NECK_WRAP_P90,
  SUPERSTRAT_HH,
  T_TYPE,
} from "feature/arsenal/data/guitarSpecs";
import type {
  GuitarDefinition,
  GuitarRarity,
  GuitarSpec,
} from "feature/arsenal/types/arsenal.types";

import { COMPONENTS_BY_ID } from "../data/components";
import type { ComponentRarity } from "../types/guitarBuilder.types";
import { RARITY_ORDER } from "./components";

/**
 * A guitar built in the Guitar Builder lives in the ordinary inventory, next
 * to the ones from cases, so the rig, the profile wall and every card can show
 * it. It has no entry in `GUITAR_DEFINITIONS` — instead its `guitarId` carries
 * just enough to rebuild a definition on the spot:
 *
 *   custom:<rarity>:<bodyKey>:<token>[:<name>]
 *
 * The optional name is the one the player gave the guitar, URI-encoded so it
 * can't break the colon-separated fields. Renaming mints a new id with the
 * same token — the picture doesn't change, so it isn't re-rendered.
 *
 * The token names the rendered image in Storage. A rebuild mints a new one,
 * so a changed guitar never shows a cached picture of the old.
 */
export const CUSTOM_GUITAR_PREFIX = "custom:";

/** Storage folder the rendered builds are uploaded to. */
export const CUSTOM_GUITAR_FOLDER = "custom-guitars";

const CUSTOM_YEAR = 2026;

/** What the build's body physically is, for mod rules and the rig's specs. */
const BODY_SPECS: Record<string, GuitarSpec> = {
  "t-style": T_TYPE,
  "t-style-coral": T_TYPE,
  "s-style": S_TYPE,
  "s-style-green": S_TYPE,
  superstrat: S_TYPE_MODERN_HSH,
  "superstrat-flame": S_TYPE_MODERN_HSH,
  "single-cut": SET_NECK_TOM,
  junior: SET_NECK_WRAP_P90,
  "double-cut": SET_NECK_TOM,
  "carved-double-cut": SET_NECK_TOM,
  offset: OFFSET_TOM,
  "offset-seafoam": OFFSET_FLOATING_P90,
  "semi-hollow": SEMI_HOLLOW,
  "v-style": SET_NECK_TOM,
  "x-style": SUPERSTRAT_HH,
};

export interface CustomGuitarRef {
  rarity: ComponentRarity;
  bodyKey: string;
  token: string;
  /** The player's own name for it; absent reads as "Custom <Body>". */
  name?: string | null;
}

/** Longest name a build can carry. */
export const GUITAR_NAME_MAX = 32;

/**
 * A player-given name, made safe to store and show: control characters out,
 * runs of whitespace collapsed, trimmed, capped. Empty comes back as null —
 * the guitar then goes by its body's name.
 */
export function cleanGuitarName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const CONTROL = new RegExp("[\\u0000-\\u001f\\u007f]", "g");
  const name = raw.replace(CONTROL, "").replace(/\s+/g, " ").trim();
  return name ? name.slice(0, GUITAR_NAME_MAX).trim() : null;
}

export const isCustomGuitarId = (id: unknown): id is string =>
  typeof id === "string" && id.startsWith(CUSTOM_GUITAR_PREFIX);

export const customGuitarId = ({
  rarity,
  bodyKey,
  token,
  name,
}: CustomGuitarRef) => {
  const base = `${CUSTOM_GUITAR_PREFIX}${rarity}:${bodyKey}:${token}`;
  const clean = cleanGuitarName(name);
  return clean ? `${base}:${encodeURIComponent(clean)}` : base;
};

export function parseCustomGuitarId(id: unknown): CustomGuitarRef | null {
  if (!isCustomGuitarId(id)) return null;
  const [rarity, bodyKey, token, encoded] = id
    .slice(CUSTOM_GUITAR_PREFIX.length)
    .split(":");
  if (!RARITY_ORDER.includes(rarity as ComponentRarity) || !bodyKey || !token) {
    return null;
  }
  let name: string | null = null;
  if (encoded) {
    try {
      name = cleanGuitarName(decodeURIComponent(encoded));
    } catch {
      name = null;
    }
  }
  return { rarity: rarity as ComponentRarity, bodyKey, token, name };
}

/** Public download URL of a build's render; the token doubles as its access token. */
export function customGuitarImageSrc(token: string) {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET ?? "";
  const object = encodeURIComponent(`${CUSTOM_GUITAR_FOLDER}/${token}.webp`);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${object}?alt=media&token=${token}`;
}

/** `imageId` of a custom definition — `getRankBadgeSrc` turns it into the URL. */
export const CUSTOM_IMAGE_PREFIX = "custom/";

export const customBodyName = (bodyKey: string) => {
  const def = COMPONENTS_BY_ID.get(`body:${bodyKey}`);
  return def ? def.name : "Guitar";
};

/**
 * A build's definition from its image id alone — all an avatar or a profile
 * banner is given (`selectedGuitar`). Knows rarity and picture, not the name.
 */
export function customDefinitionFromImageId(
  imageId: unknown,
): GuitarDefinition | undefined {
  if (typeof imageId !== "string" || !imageId.startsWith(CUSTOM_IMAGE_PREFIX)) {
    return undefined;
  }
  const [rarity, token] = imageId.slice(CUSTOM_IMAGE_PREFIX.length).split("/");
  if (!token || !RARITY_ORDER.includes(rarity as ComponentRarity)) return undefined;
  return {
    id: imageId,
    imageId,
    name: "Custom guitar",
    brand: "Custom build",
    rarity: rarity as GuitarRarity,
    yearFrom: CUSTOM_YEAR,
    yearTo: CUSTOM_YEAR,
    countries: ["USA"],
    spec: S_TYPE,
  };
}

/** The stand-in definition every card, rack and log reads a build through. */
export function customGuitarDefinition(
  id: unknown,
): GuitarDefinition | undefined {
  const ref = parseCustomGuitarId(id);
  if (!ref) return undefined;
  return {
    id: id as string,
    imageId: `${CUSTOM_IMAGE_PREFIX}${ref.rarity}/${ref.token}`,
    name: ref.name ?? `Custom ${customBodyName(ref.bodyKey)}`,
    brand: "Custom build",
    rarity: ref.rarity as GuitarRarity,
    yearFrom: CUSTOM_YEAR,
    yearTo: CUSTOM_YEAR,
    countries: ["USA"],
    spec: BODY_SPECS[ref.bodyKey] ?? S_TYPE,
  };
}

// ─── Fame ────────────────────────────────────────────────────────────────────

/**
 * What putting a guitar together costs: a flat bench fee plus a curve on the
 * build's level, so a set of Commons is pocket money (~170 Fame at level 14)
 * and a full Mythic build is a real goal (~1500 at level 63, ~2300 at 80).
 */
export function buildFameCost(level: number) {
  const raw = 100 + 0.35 * level * level;
  return Math.round(raw / 10) * 10;
}

/** Cheapest a rebuild ever gets — the bench still has to strip and refit it. */
export const REBUILD_MIN_FAME = 50;

/**
 * Swapping parts on a guitar that already exists: pay for the level the
 * guitar gains, never less than the bench fee. A downgrade costs the fee.
 */
export function rebuildFameCost(oldLevel: number, newLevel: number) {
  return Math.max(
    REBUILD_MIN_FAME,
    buildFameCost(newLevel) - buildFameCost(oldLevel),
  );
}
