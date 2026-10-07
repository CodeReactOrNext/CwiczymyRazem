import { achievementsMap } from "feature/achievements/data/achievementsData";
import type { AchievementList } from "feature/achievements/types";
import type { WidgetSize } from "feature/dashboard/types/dashboard.types";
import type { ProfileBannerId } from "feature/profile/data/profileBanners";
import {
  isBannerUnlocked,
  isProfileBannerId,
} from "feature/profile/data/profileBanners";
import type {
  ProfileAccent,
  ProfileBadgeId,
  ProfileFactId,
  ProfileLayoutConfig,
  ProfileSectionId,
  ProfileSectionPlacement,
} from "feature/profile/types/profileLayout.types";
import {
  PROFILE_ACCENTS,
  PROFILE_BADGE_IDS,
  PROFILE_FACT_IDS,
  PROFILE_SECTION_IDS,
} from "feature/profile/types/profileLayout.types";
import type { Translate } from "lib/i18n/translate";
import { translateOr } from "lib/i18n/translate";

export const MAX_TAGLINE_LENGTH = 80;
export const MAX_ABOUT_LENGTH = 300;
export const MAX_TROPHIES = 5;
export const MAX_FEATURED_SONGS = 5;
/**
 * Slots on the profile. A cap makes the page a choice — six things the player
 * wants to be seen for — rather than everything the app can draw.
 */
export const MAX_SECTIONS = 6;

/** Sections that only work across the whole row (wide grids, heatmap, pedalboard). */
const FULL_WIDTH_ONLY: ReadonlySet<ProfileSectionId> = new Set([
  "insights",
  "activity",
  "statistics",
  "repertoire",
  "skills",
  "rig",
  "recordings",
]);

export const isSectionResizable = (id: ProfileSectionId): boolean =>
  !FULL_WIDTH_ONLY.has(id);

export const defaultSectionSize = (id: ProfileSectionId): WidgetSize =>
  id === "about" || id === "learning" ? "half" : "full";

/**
 * The profile exactly as it looked before it could be customised, so a player
 * who never opens Customize sees the page they always had.
 */
export const DEFAULT_PROFILE_LAYOUT: ProfileLayoutConfig = {
  version: 1,
  sections: [
    { id: "trophies", size: "full" },
    { id: "signature-songs", size: "full" },
    { id: "activity", size: "full" },
    { id: "statistics", size: "full" },
    { id: "repertoire", size: "full" },
    { id: "rig", size: "full" },
  ],
  facts: [...PROFILE_FACT_IDS],
  badges: [...PROFILE_BADGE_IDS],
  accent: "cyan",
  tagline: "",
  about: "",
  title: null,
  trophies: [],
  featuredSongs: [],
  banner: "classic",
  emblem: null,
};

const cloneDefault = (): ProfileLayoutConfig => ({
  ...DEFAULT_PROFILE_LAYOUT,
  sections: DEFAULT_PROFILE_LAYOUT.sections.map((s) => ({ ...s })),
  facts: [...DEFAULT_PROFILE_LAYOUT.facts],
  badges: [...DEFAULT_PROFILE_LAYOUT.badges],
  trophies: [],
  featuredSongs: [],
});

const isSectionId = (value: unknown): value is ProfileSectionId =>
  (PROFILE_SECTION_IDS as readonly unknown[]).includes(value);
const isFactId = (value: unknown): value is ProfileFactId =>
  (PROFILE_FACT_IDS as readonly unknown[]).includes(value);
const isBadgeId = (value: unknown): value is ProfileBadgeId =>
  (PROFILE_BADGE_IDS as readonly unknown[]).includes(value);
const isAccent = (value: unknown): value is ProfileAccent =>
  (PROFILE_ACCENTS as readonly unknown[]).includes(value);

const isAchievementId = (value: unknown): value is AchievementList =>
  typeof value === "string" && achievementsMap.has(value as AchievementList);

const normalizeTrophies = (raw: unknown): AchievementList[] =>
  Array.isArray(raw)
    ? Array.from(new Set(raw.filter(isAchievementId))).slice(0, MAX_TROPHIES)
    : [];

const normalizeFeaturedSongs = (raw: unknown): string[] =>
  Array.isArray(raw)
    ? Array.from(
        new Set(
          raw.filter(
            (id): id is string =>
              typeof id === "string" && id.length > 0 && id.length <= 128,
          ),
        ),
      ).slice(0, MAX_FEATURED_SONGS)
    : [];

const clampSize = (id: ProfileSectionId, size: WidgetSize): WidgetSize =>
  isSectionResizable(id) ? size : "full";

const normalizeSections = (raw: unknown): ProfileSectionPlacement[] => {
  if (!Array.isArray(raw)) return cloneDefault().sections;
  const seen = new Set<ProfileSectionId>();
  const sections: ProfileSectionPlacement[] = [];
  raw.forEach((entry) => {
    const id = typeof entry === "string" ? entry : entry?.id;
    if (!isSectionId(id) || seen.has(id)) return;
    seen.add(id);
    const size: WidgetSize =
      entry?.size === "half" || entry?.size === "full"
        ? entry.size
        : defaultSectionSize(id);
    sections.push({ id, size: clampSize(id, size) });
  });
  return sections.slice(0, MAX_SECTIONS);
};

/** Keeps known ids in canonical order, so the header never depends on click order. */
const normalizeSet = <T extends string>(
  raw: unknown,
  all: readonly T[],
  isId: (value: unknown) => value is T,
  fallback: T[],
): T[] => {
  if (!Array.isArray(raw)) return [...fallback];
  const picked = new Set(raw.filter(isId));
  return all.filter((id) => picked.has(id));
};

const normalizeText = (raw: unknown, max: number): string =>
  typeof raw === "string" ? raw.trim().slice(0, max) : "";

/**
 * Turns whatever is stored into a layout the page can render: unknown ids are
 * dropped, duplicates collapse, sizes are clamped to what the section allows,
 * texts are trimmed to their limits, and a missing field falls back to the
 * default rather than to "everything hidden".
 */
export const normalizeProfileLayout = (raw: unknown): ProfileLayoutConfig => {
  if (!raw || typeof raw !== "object") return cloneDefault();
  const data = raw as Record<string, unknown>;
  return {
    version: 1,
    sections: normalizeSections(data.sections),
    facts: normalizeSet(
      data.facts,
      PROFILE_FACT_IDS,
      isFactId,
      DEFAULT_PROFILE_LAYOUT.facts,
    ),
    badges: normalizeSet(
      data.badges,
      PROFILE_BADGE_IDS,
      isBadgeId,
      DEFAULT_PROFILE_LAYOUT.badges,
    ),
    accent: isAccent(data.accent) ? data.accent : DEFAULT_PROFILE_LAYOUT.accent,
    tagline: normalizeText(data.tagline, MAX_TAGLINE_LENGTH),
    about: normalizeText(data.about, MAX_ABOUT_LENGTH),
    title: isAchievementId(data.title) ? data.title : null,
    trophies: normalizeTrophies(data.trophies),
    featuredSongs: normalizeFeaturedSongs(data.featuredSongs),
    banner: isProfileBannerId(data.banner) ? data.banner : "classic",
    emblem: isAchievementId(data.emblem) ? data.emblem : null,
  };
};

export const hasSection = (
  layout: ProfileLayoutConfig,
  id: ProfileSectionId,
): boolean => layout.sections.some((s) => s.id === id);

export const isProfileFull = (layout: ProfileLayoutConfig): boolean =>
  layout.sections.length >= MAX_SECTIONS;

/** Appends the section at the bottom; a no-op when it is already shown. */
export const addSection = (
  layout: ProfileLayoutConfig,
  id: ProfileSectionId,
): ProfileLayoutConfig => {
  if (hasSection(layout, id) || isProfileFull(layout)) return layout;
  return {
    ...layout,
    sections: [...layout.sections, { id, size: defaultSectionSize(id) }],
  };
};

export const removeSection = (
  layout: ProfileLayoutConfig,
  id: ProfileSectionId,
): ProfileLayoutConfig => ({
  ...layout,
  sections: layout.sections.filter((s) => s.id !== id),
});

/** Moves the section at `from` to `to`; out-of-range indexes leave the layout alone. */
export const moveSection = (
  layout: ProfileLayoutConfig,
  from: number,
  to: number,
): ProfileLayoutConfig => {
  const { sections } = layout;
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= sections.length ||
    to >= sections.length
  ) {
    return layout;
  }
  const next = [...sections];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return { ...layout, sections: next };
};

export const setSectionSize = (
  layout: ProfileLayoutConfig,
  id: ProfileSectionId,
  size: WidgetSize,
): ProfileLayoutConfig => {
  if (!isSectionResizable(id)) return layout;
  return {
    ...layout,
    sections: layout.sections.map((s) => (s.id === id ? { ...s, size } : s)),
  };
};

const toggleIn = <T extends string>(list: T[], all: readonly T[], id: T) => {
  const picked = new Set(list);
  if (picked.has(id)) picked.delete(id);
  else picked.add(id);
  return all.filter((item) => picked.has(item));
};

export const toggleFact = (
  layout: ProfileLayoutConfig,
  id: ProfileFactId,
): ProfileLayoutConfig => ({
  ...layout,
  facts: toggleIn(layout.facts, PROFILE_FACT_IDS, id),
});

export const toggleBadge = (
  layout: ProfileLayoutConfig,
  id: ProfileBadgeId,
): ProfileLayoutConfig => ({
  ...layout,
  badges: toggleIn(layout.badges, PROFILE_BADGE_IDS, id),
});

export const hiddenSections = (layout: ProfileLayoutConfig) =>
  PROFILE_SECTION_IDS.filter((id) => !hasSection(layout, id));

/** Texts, title and trophies are the player's writing, not layout — they never make a layout "custom". */
export const isDefaultProfileLayout = (layout: ProfileLayoutConfig): boolean =>
  JSON.stringify(
    normalizeProfileLayout({
      ...layout,
      tagline: "",
      about: "",
      title: null,
      trophies: [],
      featuredSongs: [],
      emblem: null,
    }),
  ) === JSON.stringify(cloneDefault());

/** Human "last practice" text; null when the player never practised. */
export const formatDaysAgo = (
  date: Date | null | undefined,
  now: Date = new Date(),
  t?: Translate,
): string | null => {
  if (!date || Number.isNaN(date.getTime())) return null;
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (days <= 0) return translateOr(t, "profile:days_ago.today", "Today");
  if (days === 1) return translateOr(t, "profile:days_ago.yesterday", "Yesterday");
  if (days < 30) return translateOr(t, "profile:days_ago.days", "{{count}} days ago", { count: days });
  const months = Math.floor(days / 30);
  if (months < 12)
    return months === 1
      ? translateOr(t, "profile:days_ago.month", "A month ago")
      : translateOr(t, "profile:days_ago.months", "{{count}} months ago", { count: months });
  const years = Math.floor(days / 365);
  return years <= 1
    ? translateOr(t, "profile:days_ago.year", "A year ago")
    : translateOr(t, "profile:days_ago.years", "{{count}} years ago", { count: years });
};

/** Pins or unpins a trophy; pinning past the limit leaves the case as it was. */
export const toggleTrophy = (
  layout: ProfileLayoutConfig,
  id: AchievementList,
): ProfileLayoutConfig => {
  if (layout.trophies.includes(id)) {
    return { ...layout, trophies: layout.trophies.filter((t) => t !== id) };
  }
  if (layout.trophies.length >= MAX_TROPHIES) return layout;
  return { ...layout, trophies: [...layout.trophies, id] };
};

const RARITY_RANK = { common: 0, rare: 1, veryRare: 2, epic: 3 } as const;

/** Earned achievements, rarest first — ties broken by id so the order is stable. */
export const sortByRarity = (earned: AchievementList[]): AchievementList[] =>
  earned
    .filter((id) => achievementsMap.has(id))
    .sort((a, b) => {
      const ra = RARITY_RANK[achievementsMap.get(a)!.rarity];
      const rb = RARITY_RANK[achievementsMap.get(b)!.rarity];
      return rb - ra || a.localeCompare(b);
    });

/**
 * What the trophy case shows. Pins are honoured only for achievements the
 * player actually holds — the layout is client-written, so a pin is a wish,
 * the achievement list is the proof. Without pins, the rarest ones.
 */
export const resolveTrophies = (
  layout: ProfileLayoutConfig,
  earned: AchievementList[],
): AchievementList[] => {
  const owned = new Set(earned);
  const pinned = layout.trophies.filter((id) => owned.has(id));
  if (pinned.length > 0) return pinned;
  return sortByRarity(earned).slice(0, MAX_TROPHIES);
};

/** The title worn under the name, or null when it is not backed by an earned achievement. */
export const resolveTitle = (
  layout: ProfileLayoutConfig,
  earned: AchievementList[],
): AchievementList | null =>
  layout.title && earned.includes(layout.title) ? layout.title : null;

interface AccentUnlock {
  /** Shown on a locked swatch. */
  requirement: string;
  isUnlocked: (earned: ReadonlySet<AchievementList>) => boolean;
}

const hasRarity = (
  earned: ReadonlySet<AchievementList>,
  rarities: string[],
): boolean =>
  Array.from(earned).some((id) => {
    const rarity = achievementsMap.get(id)?.rarity;
    return !!rarity && rarities.includes(rarity);
  });

/** Colours are earned: the rarer the achievements, the more of the palette opens. */
export const ACCENT_UNLOCKS: Record<ProfileAccent, AccentUnlock> = {
  cyan: { requirement: "Free", isUnlocked: () => true },
  emerald: { requirement: "Free", isUnlocked: () => true },
  orange: {
    requirement: "Keep a 15-day streak (Infinity)",
    isUnlocked: (earned) => earned.has("day_3") || earned.has("100days"),
  },
  amber: {
    requirement: "Earn any very rare achievement",
    isUnlocked: (earned) => hasRarity(earned, ["veryRare", "epic"]),
  },
  purple: {
    requirement: "Earn any epic achievement",
    isUnlocked: (earned) => hasRarity(earned, ["epic"]),
  },
};

export const isAccentUnlocked = (
  accent: ProfileAccent,
  earned: AchievementList[],
): boolean => ACCENT_UNLOCKS[accent].isUnlocked(new Set(earned));

/** The accent the header is drawn in: a locked choice falls back to cyan. */
export const resolveAccent = (
  layout: ProfileLayoutConfig,
  earned: AchievementList[],
): ProfileAccent =>
  isAccentUnlocked(layout.accent, earned) ? layout.accent : "cyan";

/** Pins or unpins a song; pinning past the limit leaves the case as it was. */
export const toggleFeaturedSong = (
  layout: ProfileLayoutConfig,
  id: string,
): ProfileLayoutConfig => {
  if (layout.featuredSongs.includes(id)) {
    return {
      ...layout,
      featuredSongs: layout.featuredSongs.filter((s) => s !== id),
    };
  }
  if (layout.featuredSongs.length >= MAX_FEATURED_SONGS) return layout;
  return { ...layout, featuredSongs: [...layout.featuredSongs, id] };
};

/** Learned songs, hardest first — ties broken by id so the order is stable. */
export const sortByDifficulty = <
  T extends { id: string; avgDifficulty?: number },
>(
  songs: T[],
): T[] =>
  [...songs].sort(
    (a, b) =>
      (b.avgDifficulty ?? 0) - (a.avgDifficulty ?? 0) ||
      a.id.localeCompare(b.id),
  );

/**
 * What the song case shows: pins that are still on the learned list (a song
 * moved back to "learning" drops out), else the hardest learned songs.
 */
export const resolveFeaturedSongs = <
  T extends { id: string; avgDifficulty?: number },
>(
  layout: ProfileLayoutConfig,
  learned: T[],
): T[] => {
  const byId = new Map(learned.map((song) => [song.id, song]));
  const pinned = layout.featuredSongs
    .map((id) => byId.get(id))
    .filter((song): song is T => Boolean(song));
  if (pinned.length > 0) return pinned;
  return sortByDifficulty(learned).slice(0, MAX_FEATURED_SONGS);
};

/** The scene the header is drawn in: a locked choice falls back to classic. */
export const resolveBanner = (
  layout: ProfileLayoutConfig,
  earned: AchievementList[],
): ProfileBannerId =>
  isBannerUnlocked(layout.banner, earned) ? layout.banner : "classic";

/** The emblem printed in the header, only when its achievement is earned. */
export const resolveEmblem = (
  layout: ProfileLayoutConfig,
  earned: AchievementList[],
): AchievementList | null =>
  layout.emblem && earned.includes(layout.emblem) ? layout.emblem : null;
