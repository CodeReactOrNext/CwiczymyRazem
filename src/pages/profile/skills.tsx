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
import { AuthLayoutWrapper } from "wrappers/AuthLayoutWrapper";

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

  return (
    <AuthLayoutWrapper
      pageId={"profile"}
      subtitle={t("skills", "Skills")}
      variant='secondary'>
      <div className='relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-950/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl backdrop-blur-xl'>
        {/* Enhanced gradient overlay */}
        <div className='from-red-600/8 to-red-500/8 absolute inset-0 -z-10 bg-gradient-to-br via-transparent'></div>

        {/* Background pattern */}
        <div className='absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_75%,rgba(239,68,68,0.08)_0%,transparent_50%)] opacity-25'></div>

        <div className='relative border-b border-white/10 p-6'>
          <h1 className='text-center font-display text-2xl font-semibold tracking-tight text-white'>
            {t("skills", "Skills")}
          </h1>
          <div className='mx-auto mt-2 h-px w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent'></div>
        </div>

        <div className='relative p-6'>
          {/* Enhanced gradient overlay */}
          <div className='absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5'></div>

          {userSkills && (
            <SkillTree
              userSkills={userSkills}
              userPoints={userStats?.points || 0}
              onUpgradeSkill={handleUpgradeSkill}
            />
          )}
        </div>
      </div>
    </AuthLayoutWrapper>
  );
};

export default ProfileSkillsPage;
