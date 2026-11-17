import type { BannerParticleKind } from "feature/cosmetics/data/bannerParticles";
import type {
  AvatarCosmetic,
  BannerCosmetic,
  Cosmetic,
  CosmeticKind,
  DrawnLook,
} from "feature/cosmetics/types/cosmetics.types";

/**
 * Everything the supporter shop sells for the activity feed.
 *
 * Bought with supporter tokens, beside the pedalboard and cable skins, and
 * purely cosmetic — nothing here changes a score, a drop or a rank.
 *
 * Priced against those skins (cables 30–60, boards 80–120 tokens): an avatar
 * effect sits with the cables, a banner — the biggest thing anyone sees of
 * you in the feed — from a board's price up. Three steps per slot, by how much
 * is going on in the picture. At 10 tokens a dollar, a top banner is $16.
 *
 * Art lives in `public/images/cosmetics/{banners,avatars}/<id>.webp`. Banners
 * are 1440×360 with the subject in the right third and the left half falling
 * to black. Avatar art is 448×448 and already normalised: the avatar's circle
 * is centred, with a radius of `inner` × the half-width.
 */

const banner = (
  id: string,
  price: number,
  particles: BannerParticleKind,
  flash = false,
): BannerCosmetic => ({
  id: `banner:${id}`,
  kind: "banner",
  price,
  particles,
  ...(flash ? { flash } : {}),
});

const drawn = (look: DrawnLook, price: number): BannerCosmetic => ({
  id: `banner:${look}`,
  kind: "banner",
  price,
  drawn: look,
});

const avatar = (
  id: string,
  price: number,
  rest: Pick<AvatarCosmetic, "inner" | "motion" | "duration">,
): AvatarCosmetic => ({ id: `avatar:${id}`, kind: "avatar", price, ...rest });

/** A ring keyed to a common hole; a sticker sits on the avatar and overlaps it. */
const RING = 0.6;
const STICKER = 0.5;

export const BANNERS: BannerCosmetic[] = [
  // Drawn in code: lighter on the eye than a painting, and the only ones that
  // keep the player's own card in the light theme. The entry price, kept under
  // a $5 coffee (60 tokens) so backing a few ideas never locks a supporter out
  // of every banner.
  drawn("holo", 45),
  drawn("bokeh", 45),
  drawn("vinyl", 45),
  drawn("led", 45),
  drawn("halftone", 45),
  drawn("dust", 45),
  drawn("pattern", 45),
  // Paintings.
  banner("storm", 80, "rain", true),
  banner("neon", 80, "stars"),
  banner("astronaut", 80, "stars"),
  banner("mech", 80, "dust"),
  banner("rider", 80, "dust"),
  banner("wolf", 120, "snow"),
  banner("dragon", 120, "green"),
  banner("viking", 120, "snow"),
  banner("kraken", 120, "rain"),
  banner("angel", 120, "dust"),
  banner("reaper", 160, "embers"),
  banner("samurai", 160, "petals"),
  banner("phoenix", 160, "embers"),
  banner("mariachi", 160, "marigold"),
  { ...banner("lineage", 160, "dust"), lights: "spotlights" },
  { ...banner("crossroads", 160, "dust"), lights: "moon" },
  { ...banner("anubis", 160, "dust"), lights: "sun" },
];

export const AVATAR_EFFECTS: AvatarCosmetic[] = [
  avatar("fire", 40, { inner: RING, motion: "still", duration: 0 }),
  avatar("frost", 40, { inner: RING, motion: "spin", duration: 60 }),
  avatar("smoke", 40, { inner: RING, motion: "spinReverse", duration: 30 }),
  avatar("chain", 40, { inner: RING, motion: "spin", duration: 40 }),
  avatar("uroboros", 60, { inner: RING, motion: "spin", duration: 18 }),
  avatar("vinyl", 60, { inner: RING, motion: "spin", duration: 6 }),
  // A wreath, not a clean ring: the hole is cut a little small so the flowers
  // and skulls lap over the avatar's edge.
  avatar("marigold", 60, { inner: 0.54, motion: "spin", duration: 90 }),
  avatar("horns", 60, { inner: STICKER, motion: "float", duration: 3.4 }),
  avatar("sombrero", 60, { inner: STICKER, motion: "float", duration: 3.4 }),
  avatar("dragon", 100, { inner: STICKER, motion: "float", duration: 3.4 }),
  avatar("crown", 100, { inner: STICKER, motion: "shine", duration: 3 }),
];

export const COSMETICS: Cosmetic[] = [...BANNERS, ...AVATAR_EFFECTS];

const BY_ID = new Map(COSMETICS.map((item) => [item.id, item]));

export const findCosmetic = (
  id: string | null | undefined,
): Cosmetic | undefined => (id ? BY_ID.get(id) : undefined);

export const findBanner = (
  id: string | null | undefined,
): BannerCosmetic | undefined => {
  const item = findCosmetic(id);
  return item?.kind === "banner" ? item : undefined;
};

export const findAvatarEffect = (
  id: string | null | undefined,
): AvatarCosmetic | undefined => {
  const item = findCosmetic(id);
  return item?.kind === "avatar" ? item : undefined;
};

/** `banner:wolf` → `wolf`: the file name and the translation key. */
export const cosmeticSlug = (id: string): string =>
  id.slice(id.indexOf(":") + 1);

export const cosmeticImage = (item: Pick<Cosmetic, "id" | "kind">): string =>
  `/images/cosmetics/${item.kind === "banner" ? "banners" : "avatars"}/${cosmeticSlug(item.id)}.webp`;

export const COSMETIC_KINDS: CosmeticKind[] = ["banner", "avatar"];
