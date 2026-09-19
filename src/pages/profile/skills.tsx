import { cn } from "assets/lib/utils";
import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { SkillDashboard } from "feature/skills/components/SkillDashboard";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useIsCompactViewport } from "hooks/useMediaQuery";
import AppLayout from "layouts/AppLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import { useRouter } from "next/router";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";

/**
 * The desktop map is the only tab that runs as a fixed-height, full-bleed view.
 * On a phone that tab is a list, so it scrolls like every other page.
 */
const useIsFullBleedMap = () => {
  const router = useRouter();
  const isCompact = useIsCompactViewport();
  const isMapTab = ((router.query.tab as string) || "skill-tree") === "skill-tree";
  return isMapTab && !isCompact;
};

const ProfileSkillsPage: NextPageWithLayout = () => {
  const userAuth = useAppSelector(selectUserAuth);
  const [userSkills, setUserSkills] = useState<UserSkills>();
  const isMapTab = useIsFullBleedMap();

  useEffect(() => {
    if (userAuth) {
      getUserSkills(userAuth).then((skills) => setUserSkills(skills));
    }
  }, [userAuth]);

  return (
    <div
      className={cn(
        "flex flex-col bg-second-600",
        isMapTab ? "h-full overflow-hidden" : "min-h-screen overflow-visible",
      )}>
      <HeroBanner
        title='Skills'
        subtitle='Track and develop your guitar playing skills'
        eyebrowContent={
          <Breadcrumbs
            items={[{ label: "Practice", href: "/timer" }, { label: "Skills" }]}
          />
        }
        backgroundContent={<HeroPattern />}
        className='min-h-[100px] w-full shrink-0 !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
      />
      {userSkills ? (
        <div className='min-h-0 flex-1'>
          <SkillDashboard userSkills={userSkills as UserSkills} />
        </div>
      ) : (
        <div className='flex min-h-0 flex-1 items-center justify-center py-24'>
          <PageLoadingLayout />
        </div>
      )}
    </div>
  );
};

/**
 * The map wants the full window, the exercise lists want the app's usual
 * centred, scrolling page — so the layout variant follows the open tab.
 */
const SkillsPageLayout = ({ children }: { children: ReactNode }) => {
  const isMapTab = useIsFullBleedMap();
  return (
    <AppLayout
      pageId={"profile"}
      subtitle='Skills'
      variant={isMapTab ? "fullscreen" : "secondary"}>
      {children}
    </AppLayout>
  );
};

ProfileSkillsPage.getLayout = function getLayout(page: ReactElement) {
  return <SkillsPageLayout>{page}</SkillsPageLayout>;
};

export default ProfileSkillsPage;
