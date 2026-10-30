import { cn } from "assets/lib/utils";
import {
  type ChangelogVideo,
  ChangelogVideoCard,
} from "components/Changelog/ChangelogVideoCard";
import { DashboardSection } from "components/Layout";
import { useTranslation } from "hooks/useTranslation";
import type { LucideIcon } from "lucide-react";
import {
  Bug,
  ClipboardList,
  Dumbbell,
  Flame,
  Guitar,
  History,
  Mail,
  Map as MapIcon,
  Music2,
  Music4,
  Palette,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";

interface ChangelogGroup {
  category: string | null;
  items: string[];
  /** From bare `- <YouTube link>` lines, see `parseVideoLink`. */
  videos?: ChangelogVideo[];
}

interface ChangelogEntry {
  date: string;
  groups: ChangelogGroup[];
}

interface ParsedChangelog {
  month: string;
  entries: ChangelogEntry[];
}

const MAX_CATEGORY_WORDS = 4;

const DEFAULT_CATEGORY_ICON: LucideIcon = Sparkles;

// Ordered by specificity — first matching keyword wins, so e.g. "guitar"
// is checked before the generic "ui" rule (which "Guitar" also contains).
const CATEGORY_ICON_RULES: Array<{ test: RegExp; icon: LucideIcon }> = [
  { test: /quest/i, icon: Target },
  { test: /roadmap/i, icon: MapIcon },
  { test: /guitar|arsenal|equipment|pedal/i, icon: Guitar },
  { test: /song|playlist|rating/i, icon: Music4 },
  { test: /session/i, icon: Music2 },
  { test: /plan/i, icon: ClipboardList },
  { test: /log|activity/i, icon: History },
  { test: /exercise/i, icon: Dumbbell },
  { test: /marketplace|shop|case/i, icon: ShoppingBag },
  { test: /email|notification/i, icon: Mail },
  { test: /community/i, icon: Users },
  { test: /milestone/i, icon: Trophy },
  { test: /streak/i, icon: Flame },
  { test: /point/i, icon: Star },
  { test: /metronome|timer/i, icon: Timer },
  { test: /import/i, icon: Upload },
  { test: /ui/i, icon: Palette },
];

export const getCategoryIcon = (category: string | null): LucideIcon => {
  if (!category) return DEFAULT_CATEGORY_ICON;

  const rule = CATEGORY_ICON_RULES.find(({ test }) => test.test(category));
  return rule ? rule.icon : DEFAULT_CATEGORY_ICON;
};

export const isBugFixItem = (text: string): boolean =>
  /^fix(ed)?\b/i.test(text) || /\bbugs?\b/i.test(text);

const parseItem = (raw: string): { category: string | null; text: string } => {
  const withoutEmoji = raw.replace(/^[^\p{L}0-9]+/u, "").trim();
  const separatorIndex = withoutEmoji.indexOf(" — ");

  if (separatorIndex === -1) {
    return { category: null, text: withoutEmoji };
  }

  const category = withoutEmoji.slice(0, separatorIndex).trim();
  const text = withoutEmoji.slice(separatorIndex + " — ".length).trim();

  if (category.split(" ").length > MAX_CATEGORY_WORDS) {
    return { category: null, text: withoutEmoji };
  }

  return { category, text };
};

const VIDEO_URL_RULES: Array<{ test: RegExp; vertical: boolean }> = [
  {
    test: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([\w-]{11})(?:[?#/]\S*)?$/,
    vertical: true,
  },
  {
    test: /^https?:\/\/youtu\.be\/([\w-]{11})(?:[?#]\S*)?$/,
    vertical: false,
  },
  {
    test: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:\S*&)?v=([\w-]{11})(?:[&#]\S*)?$/,
    vertical: false,
  },
];

export const parseVideoLink = (raw: string): ChangelogVideo | null => {
  const line = raw.trim();

  for (const { test, vertical } of VIDEO_URL_RULES) {
    const id = line.match(test)?.[1];
    if (id) return { id, vertical };
  }

  return null;
};

// `- 🎬 Title — <YouTube link>`: a video with a title and no description. The
// title has no word limit, unlike a category in front of text.
const parseTitledVideo = (
  raw: string,
): { title: string | null; video: ChangelogVideo } | null => {
  const separatorIndex = raw.lastIndexOf(" — ");
  if (separatorIndex === -1) return null;

  const video = parseVideoLink(raw.slice(separatorIndex + " — ".length));
  if (!video) return null;

  const title = raw
    .slice(0, separatorIndex)
    .replace(/^[^\p{L}0-9]+/u, "")
    .trim();
  return { title: title || null, video };
};

// A video link on its own line belongs to the item right above it, so it is
// rendered under that item's category instead of as a line of text. A group
// that already has a video is closed: the next item opens a new block, so
// every video stays with the text it illustrates.
const groupItemsByCategory = (rawItems: string[]): ChangelogGroup[] => {
  const groups: ChangelogGroup[] = [];
  const groupIndexByCategory = new Map<string, number>();
  let lastGroup: ChangelogGroup | null = null;

  const getOrCreateGroup = (category: string | null): ChangelogGroup => {
    const key = category ?? "";
    const existingIndex = groupIndexByCategory.get(key);
    if (existingIndex !== undefined && !groups[existingIndex].videos) {
      return groups[existingIndex];
    }

    groupIndexByCategory.set(key, groups.length);
    const group: ChangelogGroup = { category, items: [] };
    groups.push(group);
    return group;
  };

  rawItems.forEach((raw) => {
    const video = parseVideoLink(raw);

    if (video) {
      const group = lastGroup ?? getOrCreateGroup(null);
      group.videos = [...(group.videos ?? []), video];
      return;
    }

    const titledVideo = parseTitledVideo(raw);

    if (titledVideo) {
      lastGroup = {
        category: titledVideo.title,
        items: [],
        videos: [titledVideo.video],
      };
      groups.push(lastGroup);
      return;
    }

    const { category, text } = parseItem(raw);
    lastGroup = getOrCreateGroup(category);
    lastGroup.items.push(text);
  });

  return groups;
};

export const parseChangelog = (markdown: string): ParsedChangelog => {
  const lines = markdown.split("\n").filter((line) => line.trim());
  const entries: ChangelogEntry[] = [];
  let currentDate = "";
  let currentItems: string[] = [];

  const pushCurrentEntry = () => {
    if (currentDate && currentItems.length > 0) {
      entries.push({
        date: currentDate,
        groups: groupItemsByCategory(currentItems),
      });
    }
  };

  lines.forEach((line) => {
    if (line.startsWith("# ")) {
      return;
    }

    if (line.startsWith("## ")) {
      pushCurrentEntry();
      currentDate = line.replace("## ", "").trim();
      currentItems = [];
    } else if (line.startsWith("- ")) {
      currentItems.push(line.replace("- ", "").trim());
    }
  });

  pushCurrentEntry();

  return {
    month: "",
    entries,
  };
};

const parseChangelogDate = (date: string): Date | null => {
  const [day, month, year] = date.split(".").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

export const hasRecentChanges = (entries: ChangelogEntry[]): boolean => {
  if (!entries || entries.length === 0) return false;

  const latestDate = entries[0]?.date;
  if (!latestDate) return false;

  const lastViewed = localStorage.getItem("changelog_last_viewed");

  if (lastViewed === latestDate) return false;

  const lastChangeDate = parseChangelogDate(latestDate);
  if (!lastChangeDate) return false;

  const now = new Date();
  const daysDiff =
    (now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff < 3;
};

export const isEntryUnread = (
  date: string,
  lastViewed: string | null,
): boolean => {
  const entryDate = parseChangelogDate(date);
  if (!entryDate) return false;

  if (!lastViewed) {
    const now = new Date();
    const daysDiff =
      (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff < 3;
  }

  const lastViewedDate = parseChangelogDate(lastViewed);
  if (!lastViewedDate) return false;

  return entryDate.getTime() > lastViewedDate.getTime();
};

export const markChangelogAsViewed = (entries: ChangelogEntry[]) => {
  const latestDate = entries[0]?.date;
  if (latestDate) {
    localStorage.setItem("changelog_last_viewed", latestDate);
  }
};

export const useChangelogData = (month: string = "2026-05") => {
  const [changelog, setChangelog] = useState<ParsedChangelog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await fetch(`/changelogs/${month}.md`);
        const text = await response.text();
        const parsed = parseChangelog(text);
        setChangelog(parsed);
      } catch (error) {
        console.error("Failed to load changelog:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChangelog();
  }, [month]);

  return { changelog, isLoading };
};

const Changelog = ({ month = "2026-05" }: { month?: string }) => {
  const { t } = useTranslation("ui");
  const { changelog, isLoading } = useChangelogData(month);
  const [lastViewedDate] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : localStorage.getItem("changelog_last_viewed"),
  );

  useEffect(() => {
    if (changelog?.entries && changelog.entries.length > 0) {
      markChangelogAsViewed(changelog.entries);
    }
  }, [changelog?.entries]);

  if (isLoading) {
    return (
      <DashboardSection compact>
        <div className='h-64 animate-pulse rounded-lg bg-zinc-800/50' />
      </DashboardSection>
    );
  }

  if (!changelog || changelog.entries.length === 0) {
    return (
      <DashboardSection compact>
        <div className='py-8 text-center text-zinc-400'>
          {t("changelog.empty")}
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection compact>
      <div className='space-y-5'>
        {changelog.entries.map((entry) => {
          const unread = isEntryUnread(entry.date, lastViewedDate);

          return (
            <div
              key={entry.date}
              className={cn(
                "rounded-lg bg-zinc-900/40 p-5 sm:p-6",
                unread && "bg-cyan-500/5 ring-1 ring-cyan-500/15",
              )}>
              <div className='mb-5 flex items-center gap-2.5'>
                <p
                  className={cn(
                    "font-display text-sm font-semibold tabular-nums tracking-wide",
                    unread ? "text-cyan-400" : "text-zinc-400",
                  )}>
                  {entry.date}
                </p>
                {unread && (
                  <span className='rounded bg-cyan-500/10 px-1.5 py-0.5 text-[11px] font-medium text-cyan-400'>
                    {t("changelog.new")}
                  </span>
                )}
              </div>
              {/* Text blocks take a full row; videos with only a title flow
                  next to each other, like a shelf of covers. */}
              <div className='flex flex-wrap gap-x-4 gap-y-6'>
                {entry.groups.map((group, groupIdx) => {
                  if (group.items.length === 0 && group.videos) {
                    return (
                      <Fragment key={groupIdx}>
                        {group.videos.map((video) => (
                          <figure
                            key={video.id}
                            className={
                              video.vertical
                                ? "w-[calc(50%-0.5rem)] sm:w-56"
                                : "w-full sm:max-w-2xl"
                            }>
                            <ChangelogVideoCard
                              video={video}
                              title={group.category ?? "YouTube"}
                              className='w-full'
                            />
                            {group.category && (
                              <figcaption className='mt-3 text-sm font-semibold leading-snug text-zinc-100'>
                                {group.category}
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </Fragment>
                    );
                  }

                  const CategoryIcon = getCategoryIcon(group.category);
                  // Shorts are tall: beside the text they read like a post
                  // in a feed, under it they stack into a tower.
                  const videosBesideText =
                    group.videos?.every((video) => video.vertical) ?? false;

                  return (
                    <div key={groupIdx} className='w-full'>
                      {group.category && (
                        <div className='mb-2.5 flex items-center gap-3'>
                          <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-zinc-800/60'>
                            <CategoryIcon
                              className='h-3.5 w-3.5 text-zinc-400'
                              aria-hidden
                            />
                          </span>
                          <p className='text-sm font-semibold text-zinc-100'>
                            {group.category}
                          </p>
                        </div>
                      )}
                      <div
                        className={cn(
                          group.category && "pl-9",
                          videosBesideText &&
                            "flex flex-col gap-4 sm:flex-row-reverse sm:items-start sm:gap-8",
                        )}>
                        <ul
                          className={cn(
                            "space-y-2",
                            videosBesideText && "min-w-0 flex-1",
                          )}>
                          {group.items.map((item, itemIdx) => {
                            const isBug = isBugFixItem(item);

                            return (
                              <li
                                key={itemIdx}
                                className='flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300'>
                                {isBug ? (
                                  <Bug
                                    className='mt-1 h-3.5 w-3.5 flex-shrink-0 text-red-400/80'
                                    aria-label={t("changelog.bug_fix")}
                                  />
                                ) : (
                                  <span
                                    className='mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-600'
                                    aria-hidden
                                  />
                                )}
                                <span>{item}</span>
                              </li>
                            );
                          })}
                        </ul>
                        {group.videos && (
                          <div
                            className={cn(
                              "flex flex-wrap gap-3",
                              videosBesideText ? "shrink-0" : "mt-4",
                            )}>
                            {group.videos.map((video) => (
                              <ChangelogVideoCard
                                key={video.id}
                                video={video}
                                title={
                                  group.category ?? group.items[0] ?? "YouTube"
                                }
                                className={
                                  video.vertical
                                    ? "w-48 sm:w-64"
                                    : "w-full max-w-2xl"
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardSection>
  );
};

export default Changelog;
