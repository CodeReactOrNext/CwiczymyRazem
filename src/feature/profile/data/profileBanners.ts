import { achievementsMap } from "feature/achievements/data/achievementsData";
import type { AchievementList } from "feature/achievements/types";

export const PROFILE_BANNER_IDS = [
  "classic",
  "midnight",
  "stage",
  "on-air",
  "ember",
  "golden-hour",
  "deep-water",
  "amethyst",
] as const;

export type ProfileBannerId = (typeof PROFILE_BANNER_IDS)[number];

export interface ProfileBannerDefinition {
  id: ProfileBannerId;
  label: string;
  /** Shown on a locked tile; "Free" when it is open to everyone. */
  requirement: string;
  isUnlocked: (earned: ReadonlySet<AchievementList>) => boolean;
  /**
   * CSS `background` layers, drawn as light rather than lines: a core, a
   * falloff, a dark edge. Null keeps the banner the app always drew.
   */
  layers: string | null;
}

/** Film grain over every scene, so the light reads as air, not a gradient. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")";

/** The left edge stays dark for every scene: that is where the name sits. */
const READABLE_EDGE =
  "linear-gradient(90deg, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.7) 35%, rgba(9,9,11,0) 70%)";

const scene = (...lights: string[]) =>
  [GRAIN, READABLE_EDGE, ...lights].join(", ");

const has =
  (...ids: AchievementList[]) =>
  (earned: ReadonlySet<AchievementList>) =>
    ids.some((id) => earned.has(id));

const hasRarity =
  (...rarities: string[]) =>
  (earned: ReadonlySet<AchievementList>) =>
    Array.from(earned).some((id) => {
      const rarity = achievementsMap.get(id)?.rarity;
      return !!rarity && rarities.includes(rarity);
    });

export const PROFILE_BANNERS: ProfileBannerDefinition[] = [
  {
    id: "classic",
    label: "Classic",
    requirement: "Free",
    isUnlocked: () => true,
    layers: null,
  },
  {
    id: "midnight",
    label: "Midnight",
    requirement: "Free",
    isUnlocked: () => true,
    layers: scene(
      "radial-gradient(ellipse 45% 80% at 80% 10%, rgba(56,189,248,0.22), transparent 70%)",
      "radial-gradient(ellipse 60% 90% at 100% 100%, rgba(30,58,138,0.35), transparent 70%)",
      "#09090b",
    ),
  },
  {
    id: "stage",
    label: "Stage lights",
    requirement: "Log a performance session (Stage Debut) or 100 sessions",
    isUnlocked: has("performance", "session_3"),
    layers: scene(
      "radial-gradient(ellipse 14% 95% at 62% 0%, rgba(255,247,237,0.2), transparent 75%)",
      "radial-gradient(ellipse 14% 95% at 86% 0%, rgba(254,215,170,0.18), transparent 75%)",
      "radial-gradient(ellipse 70% 40% at 75% 100%, rgba(251,146,60,0.18), transparent 70%)",
      "#0c0a09",
    ),
  },
  {
    id: "on-air",
    label: "On air",
    requirement: "Record your practice (Something was Recorded or Record Idea)",
    isUnlocked: has("record", "vinyl"),
    layers: scene(
      "radial-gradient(circle at 82% 30%, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0.08) 18%, transparent 40%)",
      "radial-gradient(ellipse 60% 100% at 90% 100%, rgba(127,29,29,0.35), transparent 70%)",
      "#0a0a0a",
    ),
  },
  {
    id: "ember",
    label: "Ember",
    requirement: "Earn 60 points in one report (Guitar Power)",
    isUnlocked: has("fire", "fireSession"),
    layers: scene(
      "radial-gradient(ellipse 50% 70% at 78% 110%, rgba(249,115,22,0.55), transparent 70%)",
      "radial-gradient(ellipse 30% 45% at 70% 100%, rgba(254,215,170,0.25), transparent 70%)",
      "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(127,29,29,0.3), transparent 70%)",
      "#0c0a09",
    ),
  },
  {
    id: "golden-hour",
    label: "Golden hour",
    requirement: "Practise 100 hours (1% – 10000h rule)",
    isUnlocked: has("time_3", "lvl100"),
    layers: scene(
      "radial-gradient(ellipse 55% 90% at 85% 20%, rgba(251,191,36,0.35), transparent 70%)",
      "radial-gradient(ellipse 40% 50% at 70% 100%, rgba(217,119,6,0.25), transparent 70%)",
      "#0c0a09",
    ),
  },
  {
    id: "deep-water",
    label: "Deep water",
    requirement: "Keep a 15-day streak or practise on 100 days",
    isUnlocked: has("100days", "day_3"),
    layers: scene(
      "radial-gradient(ellipse 60% 70% at 80% 0%, rgba(45,212,191,0.25), transparent 70%)",
      "radial-gradient(ellipse 70% 90% at 90% 100%, rgba(8,51,68,0.6), transparent 75%)",
      "#030712",
    ),
  },
  {
    id: "amethyst",
    label: "Amethyst",
    requirement: "Earn any epic achievement",
    isUnlocked: hasRarity("epic"),
    layers: scene(
      "radial-gradient(ellipse 45% 75% at 80% 25%, rgba(168,85,247,0.35), transparent 70%)",
      "radial-gradient(ellipse 60% 60% at 100% 100%, rgba(76,29,149,0.45), transparent 70%)",
      "#09090b",
    ),
  },
];

export const getProfileBanner = (id: ProfileBannerId): ProfileBannerDefinition =>
  PROFILE_BANNERS.find((banner) => banner.id === id) ?? PROFILE_BANNERS[0];

export const isProfileBannerId = (value: unknown): value is ProfileBannerId =>
  (PROFILE_BANNER_IDS as readonly unknown[]).includes(value);

export const isBannerUnlocked = (
  id: ProfileBannerId,
  earned: AchievementList[],
): boolean => getProfileBanner(id).isUnlocked(new Set(earned));
