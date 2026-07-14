import { cn } from "assets/lib/utils";
import { DashboardSection } from "components/Layout";
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
import { useEffect, useState } from "react";

interface ChangelogGroup {
  category: string | null;
  items: string[];
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

const groupItemsByCategory = (rawItems: string[]): ChangelogGroup[] => {
  const groups: ChangelogGroup[] = [];
  const groupIndexByCategory = new Map<string, number>();

  rawItems.forEach((raw) => {
    const { category, text } = parseItem(raw);
    const key = category ?? "";
    const existingIndex = groupIndexByCategory.get(key);

    if (existingIndex !== undefined) {
      groups[existingIndex].items.push(text);
      return;
    }

    groupIndexByCategory.set(key, groups.length);
    groups.push({ category, items: [text] });
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
          No entries this month
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection compact>
      <div className='space-y-3'>
        {changelog.entries.map((entry) => {
          const unread = isEntryUnread(entry.date, lastViewedDate);

          return (
            <div key={entry.date} className='rounded-lg bg-zinc-900/40 p-4'>
              <div className='mb-3 flex items-center gap-2'>
                {unread && (
                  <span
                    className='h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400'
                    aria-hidden
                  />
                )}
                <p
                  className={cn(
                    "text-sm font-semibold",
                    unread ? "text-cyan-400" : "text-zinc-500",
                  )}>
                  {entry.date}
                </p>
              </div>
              <div className='space-y-3'>
                {entry.groups.map((group, groupIdx) => {
                  const CategoryIcon = getCategoryIcon(group.category);

                  return (
                    <div key={groupIdx}>
                      {group.category && (
                        <p className='mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-300'>
                          <CategoryIcon
                            className='h-3.5 w-3.5 flex-shrink-0 text-zinc-500'
                            aria-hidden
                          />
                          {group.category}
                        </p>
                      )}
                      <ul className='space-y-1'>
                        {group.items.map((item, itemIdx) => {
                          const isBug = isBugFixItem(item);

                          return (
                            <li
                              key={itemIdx}
                              className='flex items-start gap-2 text-sm leading-relaxed text-zinc-400'>
                              {isBug ? (
                                <Bug
                                  className='mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400/80'
                                  aria-label='Bug fix'
                                />
                              ) : (
                                <span className='flex-shrink-0 text-zinc-600'>
                                  •
                                </span>
                              )}
                              <span>{item}</span>
                            </li>
                          );
                        })}
                      </ul>
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
