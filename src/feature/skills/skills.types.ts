import { IconType } from "react-icons";

export interface GuitarSkill {
  id: string;
  category: "technique" | "theory" | "hearing" | "creativity";
  icon?: IconType;
}

export interface UserSkills {
  availablePoints: {
    technique: number;
    theory: number;
    hearing: number;
    creativity: number;
  };
  unlockedSkills: {
    [skillId: string]: number;
  };
}
