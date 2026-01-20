import MainContainer from "components/MainContainer";
import { SkillDashboard } from "feature/skills/components/SkillDashboard";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";

import nextI18nextConfig from "../../../next-i18next.config";

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

  return (
    <MainContainer title={"Skills"}>
    { userSkills ? <SkillDashboard
        userSkills={userSkills as UserSkills}
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
