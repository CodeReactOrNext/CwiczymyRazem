import { doc, runTransaction } from "firebase/firestore";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { db } from "utils/firebase/client/firebase.utils";

export const updateUserSkills = async (
  userId: string,
  skillId: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);

    const skill = guitarSkills.find((s) => s.id === skillId);
    if (!skill) {
      throw new Error("Skill not found");
    }

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error("User document does not exist!");
      }

      const userData = userDoc.data();
      const availablePoints = userData.statistics?.availablePoints || {
        technique: 0,
        theory: 0,
        hearing: 0,
        creativity: 0,
      };
      const unlockedSkills = userData.skills?.unlockedSkills || {};

      // Check if user has enough points
      if (availablePoints[skill.category] < 1) {
        throw new Error(`Not enough ${skill.category} points available`);
      }

      // Update the skills and points
      const updatedAvailablePoints = {
        ...availablePoints,
        [skill.category]: availablePoints[skill.category] - 1,
      };

      const updatedUnlockedSkills = {
        ...unlockedSkills,
        [skillId]: (unlockedSkills[skillId] || 0) + 1,
      };

      // Update both statistics.availablePoints and skills
      transaction.update(userRef, {
        "statistics.availablePoints": updatedAvailablePoints,
        "skills.unlockedSkills": updatedUnlockedSkills,
      });
    });

    return true;
  } catch (error) {
    console.error("Error updating skills:", error);
    return false;
  }
};
