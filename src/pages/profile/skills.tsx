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
