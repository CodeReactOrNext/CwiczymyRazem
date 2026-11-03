import { cn } from "assets/lib/utils";
import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import { SkillDashboard } from "feature/skills/components/SkillDashboard";
import type { UserSkills } from "feature/skills/skills.types";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useIsCompactViewport } from "hooks/useMediaQuery";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";

/**
 * The desktop map is the only tab that runs as a fixed-height, full-bleed view.
 * On a phone that tab is a list, so it scrolls like every other page.
 */
const isFullBleedMap = ({ query, isCompact }: { query: ParsedUrlQuery; isCompact: boolean }) =>
  ((query.tab as string) || "skill-tree") === "skill-tree" && !isCompact;

const HEADINGS: Record<string, { title: string; subtitle: string }> = {
  "skill-tree": {
    title: "Skills",
    subtitle: "See your progress by technique and pick what to practise next.",
  },
  browse: {
    title: "Exercises",
    subtitle: "Search by name, or pick how you want to practise to narrow the list.",
  },
  community: {
    title: "Community Exercises",
    subtitle: "Exercises other players made and shared.",
  },
};

const ProfileSkillsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const heading =
    HEADINGS[(router.query.tab as string) || "skill-tree"] ?? HEADINGS["skill-tree"];
  // The profile in the store already carries the skill points (AppLayout renders
  // nothing before it), so the page opens with its content instead of waiting on
  // a second read of the same user doc behind a placeholder. The browse and
  // community tabs don't use the points at all.
  const unlockedSkills = useAppSelector(selectCurrentUserStats)?.skills?.unlockedSkills;
  const userSkills = useMemo<UserSkills>(
    () => ({ unlockedSkills: unlockedSkills ?? {} }),
    [unlockedSkills],
  );
  const isMapTab = isFullBleedMap({ query: router.query, isCompact: useIsCompactViewport() });

  return (
    <div
      className={cn(
        "flex flex-col bg-second-600",
        isMapTab ? "h-full overflow-hidden" : "min-h-screen overflow-visible",
      )}>
      {/* A plain title that names the open tab — the menu links to each one
          separately, so "Exercises" should not land on a page called Skills. */}
      <header className='mx-auto w-full max-w-7xl shrink-0 space-y-3 px-4 pt-6 lg:px-6 lg:pt-8'>
        <Breadcrumbs
          items={[{ label: "Practice", href: "/timer" }, { label: heading.title }]}
        />
        <div>
          <h1 className='text-2xl font-bold leading-tight text-white md:text-3xl'>
            {heading.title}
          </h1>
          <p className='mt-1 text-sm text-zinc-400'>{heading.subtitle}</p>
        </div>
      </header>
      <div className='min-h-0 flex-1'>
        <SkillDashboard userSkills={userSkills} />
      </div>
    </div>
  );
};

// The map wants the full window, the exercise lists want the app's usual
// centred, scrolling page — so the layout variant follows the open tab.
ProfileSkillsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"profile"}
      subtitle='Skills'
      variant={(route) => (isFullBleedMap(route) ? "fullscreen" : "secondary")}>
      {page}
    </AppLayout>
  );
};

export default ProfileSkillsPage;
