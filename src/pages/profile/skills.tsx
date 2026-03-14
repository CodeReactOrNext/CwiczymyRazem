import { HeroBanner } from "components/UI/HeroBanner";
import { SkillDashboard } from "feature/skills/components/SkillDashboard";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";



const ProfileSkillsPage: NextPageWithLayout = () => {
  const userAuth = useAppSelector(selectUserAuth);
  const [userSkills, setUserSkills] = useState<UserSkills>();

  useEffect(() => {
    if (userAuth) {
      getUserSkills(userAuth).then((skills) => setUserSkills(skills));
    }
  }, [userAuth]);

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      <HeroBanner
        title="Skills"
        subtitle="Track and develop your guitar playing skills"
        eyebrow="Skill Tree"
        characterImage="/images/3d/skills.png"
        className="w-full !rounded-none !shadow-none min-h-[160px] md:min-h-[140px] lg:min-h-[180px]"
      />
      {userSkills ? (
        <SkillDashboard userSkills={userSkills as UserSkills} />
      ) : (
        <div className="flex flex-1 items-center justify-center py-24">
          <PageLoadingLayout />
        </div>
      )}
    </div>
  );
};

ProfileSkillsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"profile"} subtitle='Skills' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ProfileSkillsPage;


