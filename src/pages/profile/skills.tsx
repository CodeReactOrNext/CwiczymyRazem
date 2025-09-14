import { guitarSkills } from "feature/skills/data/guitarSkills";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import { updateUserSkills } from "feature/skills/services/updateUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { SkillTreeAccordion } from "feature/skills/SkillTreeAccordion";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import { canUpgradeSkill } from "utils/firebase/client/firebase.utils";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const ProfileSkillsPage: NextPage = () => {
  const { t } = useTranslation("profile");
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const [userSkills, setUserSkills] = useState<UserSkills>();

  useEffect(() => {
    if (userAuth) {
      getUserSkills(userAuth).then((skills) => setUserSkills(skills));
    }
  }, [userAuth]);

  const handleUpgradeSkill = async (skillId: string) => {
    console.log("ProfileSkillsPage: handleUpgradeSkill called with:", skillId);
    console.log("userAuth:", userAuth);
    console.log("userStats:", userStats);
    console.log("userSkills:", userSkills);

    if (!userAuth || !userStats || !userSkills) {
      console.log("Missing required data, returning early");
      return;
    }

    const skill = guitarSkills.find((s) => s.id === skillId);
    console.log("Found skill:", skill);
    if (!skill) {
      console.log("Skill not found, returning");
      return;
    }

    const hasPoints =
      userSkills.availablePoints[
        skill.category as keyof typeof userSkills.availablePoints
      ] > 0;

    console.log(
      "Available points for category",
      skill.category,
      ":",
      userSkills.availablePoints[
        skill.category as keyof typeof userSkills.availablePoints
      ]
    );
    console.log("hasPoints:", hasPoints);

    if (hasPoints) {
      try {
        console.log("Calling updateUserSkills...");
        await updateUserSkills(userAuth, skillId);
        console.log("updateUserSkills completed, refreshing skills...");
        // Refresh skills data
        const updatedSkills = await getUserSkills(userAuth);
        console.log("Updated skills:", updatedSkills);
        setUserSkills(updatedSkills);
      } catch (error) {
        console.error("Error upgrading skill:", error);
      }
    } else {
      console.log("No points available for upgrade");
    }
  };

  const handleSkillUpgrade = async (skillId: string) => {
    if (!userSkills) return;

    const skill = guitarSkills.find((s) => s.id === skillId);
    if (!skill) return;

    if (!canUpgradeSkill(skill, userSkills)) {
      return;
    }
  };

  if (!userSkills) return null;

  return (
    <AuthLayoutWrapper pageId={"profile"} subtitle='Skills' variant='secondary'>
      <SkillTreeAccordion
        userSkills={userSkills as UserSkills}
        onSkillUpgrade={handleUpgradeSkill}
      />
    </AuthLayoutWrapper>
  );
};

export default ProfileSkillsPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "profile",
        "skills",
      ])),
    },
  };
}
