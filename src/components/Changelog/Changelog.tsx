import { useEffect, useState } from "react";
import { DashboardSection } from "components/Layout";

interface ChangelogEntry {
  date: string;
  items: string[];
}

interface ParsedChangelog {
  month: string;
  entries: ChangelogEntry[];
}

const parseChangelog = (markdown: string): ParsedChangelog => {
  const lines = markdown.split("\n").filter(line => line.trim());
  const entries: ChangelogEntry[] = [];
  let currentDate = "";
  let currentItems: string[] = [];

  lines.forEach(line => {
    if (line.startsWith("# ")) {
      return;
    }

    if (line.startsWith("## ")) {
      if (currentDate && currentItems.length > 0) {
        entries.push({
          date: currentDate,
          items: [...currentItems],
        });
      }
      currentDate = line.replace("## ", "").trim();
      currentItems = [];
    } else if (line.startsWith("- ")) {
      const item = line.replace("- ", "").trim();
      currentItems.push(item);
    }
  });

  if (currentDate && currentItems.length > 0) {
    entries.push({
      date: currentDate,
      items: currentItems,
    });
  }

  return {
    month: "",
    entries,
  };
};

export const hasRecentChanges = (entries: ChangelogEntry[]): boolean => {
  if (!entries || entries.length === 0) return false;

  const latestDate = entries[0]?.date;
  if (!latestDate) return false;

  const lastViewed = localStorage.getItem('changelog_last_viewed');

  if (lastViewed === latestDate) return false;

  try {
    const [day, month, year] = latestDate.split(".").map(Number);
    const lastChangeDate = new Date(year, month - 1, day);
    const now = new Date();
    const daysDiff = (now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff < 3;
  } catch {
    return false;
  }
};

export const markChangelogAsViewed = (entries: ChangelogEntry[]) => {
  const latestDate = entries[0]?.date;
  if (latestDate) {
    localStorage.setItem('changelog_last_viewed', latestDate);
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

  useEffect(() => {
    if (changelog?.entries && changelog.entries.length > 0) {
      markChangelogAsViewed(changelog.entries);
    }
  }, [changelog?.entries]);

  if (isLoading) {
    return (
      <DashboardSection compact>
        <div className="h-64 bg-zinc-800/50 rounded-lg animate-pulse" />
      </DashboardSection>
    );
  }

  if (!changelog || changelog.entries.length === 0) {
    return (
      <DashboardSection compact>
        <div className="text-center py-8 text-zinc-400">
         No entries this month
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection compact>
      <div className="space-y-4">
        <div className="space-y-4">
          {changelog.entries.map((entry, idx) => (
            <div key={idx} className="border-l-2 border-cyan-500/50 pl-4 pb-4">
              <p className="text-sm font-medium text-cyan-400">{entry.date}</p>
              <ul className="mt-2 space-y-1">
                {entry.items.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    className="text-sm text-zinc-300 flex items-start gap-2"
                  >
                    <span className="text-cyan-400 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </DashboardSection>
  );
};

export default Changelog;
