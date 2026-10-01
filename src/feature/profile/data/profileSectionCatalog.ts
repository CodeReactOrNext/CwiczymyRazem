import type {
  ProfileAccent,
  ProfileBadgeId,
  ProfileFactId,
  ProfileSectionId,
} from "feature/profile/types/profileLayout.types";
import { PROFILE_SECTION_IDS } from "feature/profile/types/profileLayout.types";
import { isSectionResizable } from "feature/profile/utils/profileLayout";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  CalendarDays,
  Disc3,
  Gauge,
  Guitar,
  ListMusic,
  Medal,
  Music2,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";

export interface ProfileSectionDefinition {
  id: ProfileSectionId;
  title: string;
  description: string;
  icon: LucideIcon;
  resizable: boolean;
  /** Renders nothing when the player has nothing there yet. */
  mayBeEmpty?: boolean;
  /** Keeps its own controls clickable while the profile is being customised. */
  editable?: boolean;
}

const DEFINITIONS: Record<
  ProfileSectionId,
  Omit<ProfileSectionDefinition, "id" | "resizable">
> = {
  trophies: {
    title: "Trophy case",
    description:
      "Up to five achievements you are proudest of, with how rare they are.",
    icon: Award,
    mayBeEmpty: true,
  },
  "signature-songs": {
    title: "Signature songs",
    description: "Up to five learned songs you want to be known for.",
    icon: Disc3,
    mayBeEmpty: true,
  },
  about: {
    title: "About me",
    description: "A few words about you, your gear or your goals.",
    icon: UserRound,
    mayBeEmpty: true,
  },
  insights: {
    title: "Practice insights",
    description: "Average session length, points per hour, strongest area.",
    icon: Gauge,
  },
  activity: {
    title: "Activity",
    description: "The year-long practice heatmap.",
    icon: CalendarDays,
    editable: true,
  },
  statistics: {
    title: "Statistics",
    description: "Total time, points, sessions and skill split.",
    icon: BarChart3,
  },
  repertoire: {
    title: "Song repertoire",
    description: "Learned songs grouped by difficulty tier.",
    icon: Music2,
  },
  learning: {
    title: "Currently learning",
    description: "Songs you are working on right now.",
    icon: ListMusic,
    mayBeEmpty: true,
  },
  skills: {
    title: "Skills",
    description: "Unlocked skills and their levels.",
    icon: Sparkles,
    mayBeEmpty: true,
  },
  rig: {
    title: "Rig",
    description: "Your guitars and pedalboard.",
    icon: Guitar,
    mayBeEmpty: true,
  },
  recordings: {
    title: "Recordings",
    description: "Covers and practice videos you uploaded.",
    icon: Video,
    editable: true,
  },
  seasonal: {
    title: "Seasonal achievements",
    description: "Badges from monthly seasons.",
    icon: Medal,
    mayBeEmpty: true,
  },
};

export const PROFILE_SECTION_CATALOG: ProfileSectionDefinition[] =
  PROFILE_SECTION_IDS.map((id) => ({
    id,
    resizable: isSectionResizable(id),
    ...DEFINITIONS[id],
  }));

export const getProfileSectionDefinition = (
  id: ProfileSectionId,
): ProfileSectionDefinition =>
  PROFILE_SECTION_CATALOG.find((definition) => definition.id === id) ??
  PROFILE_SECTION_CATALOG[0];

export const PROFILE_FACT_LABELS: Record<ProfileFactId, string> = {
  "last-practice": "Last practice",
  streak: "Streak",
  joined: "Joined",
  "playing-for": "Playing for",
  band: "Band",
  guild: "Guild",
  links: "YouTube / SoundCloud",
};

export const PROFILE_BADGE_LABELS: Record<ProfileBadgeId, string> = {
  level: "Level ring",
  "song-tier": "Song tier",
};

/** Accent drives the level ring and the header glow. */
export const PROFILE_ACCENT_COLORS: Record<
  ProfileAccent,
  { label: string; light: string; base: string }
> = {
  cyan: { label: "Cyan", light: "#a5f3fc", base: "#0891b2" },
  emerald: { label: "Emerald", light: "#a7f3d0", base: "#059669" },
  amber: { label: "Amber", light: "#fde68a", base: "#d97706" },
  orange: { label: "Orange", light: "#fed7aa", base: "#ea580c" },
  purple: { label: "Purple", light: "#e9d5ff", base: "#9333ea" },
};
