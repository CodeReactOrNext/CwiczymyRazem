import { SkillDashboard } from "feature/skills/components/SkillDashboard";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
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
    <div className="bg-second-600 radius-default overflow-hidden flex flex-col border-none shadow-sm min-h-screen">
      {userSkills ? (
        <SkillDashboard userSkills={userSkills as UserSkills} />
      ) : null}
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


