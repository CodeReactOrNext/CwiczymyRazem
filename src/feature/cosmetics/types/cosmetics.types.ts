import type { BannerParticleKind } from "feature/cosmetics/data/bannerParticles";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";

/** The two slots a player can dress: the card behind their activity and the art round their avatar. */
export type CosmeticKind = "banner" | "avatar";

/** How an avatar decoration moves. Banners all share one slow push-in. */
export type AvatarMotion =
  | "spin"
  | "spinReverse"
  | "pulse"
  | "float"
  | "shine"
  /** Art that reads best held still — no animation class at all. */
  | "still";

interface CosmeticBase {
  /** Stable id — stored on the player and in the public lookup, so never rename one. */
  id: string;
  /** Supporter tokens it costs, once. */
  price: number;
}

/** The banners drawn in code rather than painted; see DrawnBanner.tsx. */
export type DrawnLook =
  | "holo"
  | "bokeh"
  | "vinyl"
  | "led"
  | "halftone"
  | "dust"
  | "pattern";

/** The paintings with a light of their own moving in them. */
export type BannerLights = "spotlights" | "moon" | "sun";

export interface BannerCosmetic extends CosmeticBase {
  kind: "banner";
  /**
   * Set on a banner drawn in code. Those sit on the player's normal card and
   * work in both themes; the rest are paintings on a card kept dark.
   */
  drawn?: DrawnLook;
  /** What drifts across a painting. */
  particles?: BannerParticleKind;
  /** A lightning flash every few seconds — the storm pictures. */
  flash?: boolean;
  /** Light placed by hand on one particular painting; see BannerLights.tsx. */
  lights?: BannerLights;
}

export interface AvatarCosmetic extends CosmeticBase {
  kind: "avatar";
  /**
   * The avatar's radius as a share of the art's half-width. Rings are cut to
   * 0.6, the pieces that sit *on* the avatar to 0.5 — see the art pipeline
   * note in `cosmeticsCatalog.ts`.
   */
  inner: number;
  motion: AvatarMotion;
  /** Seconds one cycle of the motion takes. */
  duration: number;
}

export type Cosmetic = BannerCosmetic | AvatarCosmetic;

/** What a player is wearing. A missing slot is simply bare. */
export interface EquippedCosmetics {
  banner?: string | null;
  avatar?: string | null;
}

/** A player's own wardrobe, as `/api/cosmetics/state` returns it. */
export interface CosmeticsState {
  owned: string[];
  equipped: EquippedCosmetics;
}

/** Everyone's equipped cosmetics, keyed by uid — one cached read dresses the whole feed. */
export type EquippedLookup = Record<string, EquippedCosmetics>;

export interface BuyCosmeticResult extends CosmeticsState {
  /** The token wallet after the charge, for the panel's header. */
  wallet: SupporterWallet;
}
