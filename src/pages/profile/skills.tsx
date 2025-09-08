import { guitarSkills } from "feature/skills/data/guitarSkills";
import { getUserSkills } from "feature/skills/services/getUserSkills";
import { updateUserSkills } from "feature/skills/services/updateUserSkills";
import type { UserSkills } from "feature/skills/skills.types";
import { SkillTree } from "feature/skills/SkillTree";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import { canUpgradeSkill } from "utils/firebase/client/firebase.utils";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const ProfileSkillsPage = () => {
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
    if (!userAuth || !userStats || !userSkills) return;

    const skill = guitarSkills.find((s) => s.id === skillId);
    if (!skill) return;

    const canUpgrade = canUpgradeSkill(
      userStats.points,
      userSkills[skillId as keyof UserSkills] || 0,
      skill.cost
    );

    if (canUpgrade) {
      try {
        await updateUserSkills(userAuth, skillId);
        // Refresh skills data
        const updatedSkills = await getUserSkills(userAuth);
        setUserSkills(updatedSkills);
      } catch (error) {
        console.error("Error upgrading skill:", error);
      }
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
    <AuthLayoutWrapper
      pageId={"profile"}
      subtitle={t("skills", "Skills")}
      variant='secondary'>
      <SkillTree
        userSkills={userSkills as UserSkills}
        onSkillUpgrade={handleSkillUpgrade}
      />
    </AuthLayoutWrapper>
  );
};

export default ProfileSkillsPage;
