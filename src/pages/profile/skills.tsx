import { guitarSkills } from "feature/skills/data/guitarSkills";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import { updateUserSkills } from "feature/skills/services/updateUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { SkillDashboard } from "feature/skills/components/SkillDashboard";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import nextI18nextConfig from "../../../next-i18next.config";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import AppLayout from "layouts/AppLayout";
import MainContainer from "components/MainContainer";
import { LoaderPinwheel } from "lucide-react";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const ProfileSkillsPage: NextPageWithLayout = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const [userSkills, setUserSkills] = useState<UserSkills>();

  useEffect(() => {
    if (userAuth) {
      getUserSkills(userAuth).then((skills) => setUserSkills(skills));
    }
  }, [userAuth]);

  const handleUpgradeSkill = async (skillId: string, points: number) => {
    if (!userAuth || !userStats || !userSkills) {
      return;
    }

    const skill = guitarSkills.find((s) => s.id === skillId);
    if (!skill) {
      return;
    }

      // Optimistic update with proper immutability
      const skillKey = skill.id as keyof typeof userSkills.unlockedSkills;
      
      const updatedSkills = { 
        ...userSkills,
        unlockedSkills: {
            ...userSkills.unlockedSkills,
            [skillKey]: (userSkills.unlockedSkills[skillKey] || 0) + points
        },
        availablePoints: {
            ...userSkills.availablePoints,
            [skill.category]: userSkills.availablePoints[skill.category] - points
        }
      };
      setUserSkills(updatedSkills);

      await updateUserSkills(userAuth, skill.id, points);
      // We can fetch in background to sync, but optimistic should be enough for UI responsiveness
      getUserSkills(userAuth).then((serverSkills) => {
          if (serverSkills) setUserSkills(serverSkills);
      });
  };


  return (
    <MainContainer title={"Skills"}>
    { userSkills ? <SkillDashboard
        userSkills={userSkills as UserSkills}
        onSkillUpgrade={handleUpgradeSkill}
      /> : null}
    </MainContainer>
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

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "pl",
        ["common", "profile", "skills"],
        nextI18nextConfig
      )),
    },
  };
}
