
import type { Exercise } from "../types/exercise.types";




export const getRelatedSkills = (exercise: Exercise) => {
  return exercise?.relatedSkills?.map(skillId => ({
    id: skillId,
  }));
};
