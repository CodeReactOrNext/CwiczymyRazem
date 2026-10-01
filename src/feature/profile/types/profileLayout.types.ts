import type { AchievementList } from "feature/achievements/types";
import type { WidgetSize } from "feature/dashboard/types/dashboard.types";
import type { ProfileBannerId } from "feature/profile/data/profileBanners";

/** Every block the profile page can show under the header. */
export const PROFILE_SECTION_IDS = [
  "trophies",
  "signature-songs",
  "about",
  "insights",
  "activity",
  "statistics",
  "repertoire",
  "learning",
  "skills",
  "rig",
  "recordings",
  "seasonal",
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

export interface ProfileSectionPlacement {
  id: ProfileSectionId;
  size: WidgetSize;
}

/** Facts printed under the name in the header, each one switchable. */
export const PROFILE_FACT_IDS = [
  "last-practice",
  "streak",
  "joined",
  "playing-for",
  "band",
  "guild",
  "links",
] as const;

export type ProfileFactId = (typeof PROFILE_FACT_IDS)[number];

/** The big markers on the right side of the header. */
export const PROFILE_BADGE_IDS = ["level", "song-tier"] as const;

export type ProfileBadgeId = (typeof PROFILE_BADGE_IDS)[number];

export const PROFILE_ACCENTS = [
  "cyan",
  "emerald",
  "amber",
  "orange",
  "purple",
] as const;

export type ProfileAccent = (typeof PROFILE_ACCENTS)[number];

/**
 * How a player arranged their own profile. Stored on the user document as
 * `profileLayout`, because everyone who opens the profile already reads that
 * document — a separate settings doc would cost every visitor one more read.
 */
export interface ProfileLayoutConfig {
  version: 1;
  /** Visible sections in order; a section not listed is hidden. */
  sections: ProfileSectionPlacement[];
  facts: ProfileFactId[];
  badges: ProfileBadgeId[];
  accent: ProfileAccent;
  /** One line under the name. */
  tagline: string;
  /** Free text for the About section. */
  about: string;
  /** Achievement whose title is worn under the name; ignored unless earned. */
  title: AchievementList | null;
  /** Achievements pinned to the trophy case, in order; empty = rarest ones. */
  trophies: AchievementList[];
  /** Learned song ids pinned to the song case, in order; empty = hardest ones. */
  featuredSongs: string[];
  /** Background scene of the header; locked scenes fall back to classic. */
  banner: ProfileBannerId;
  /** Achievement whose icon is printed large in the header; ignored unless earned. */
  emblem: AchievementList | null;
}
