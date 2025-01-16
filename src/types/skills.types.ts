import { IconType } from "react-icons";

export interface GuitarSkill {
  id: string;
  name: string;
  description: string;
  category: "technique" | "theory" | "hearing" | "creativity";
  icon?: IconType;
  pointsCost?: number;
  maxLevel?: number;
  prerequisites?: string[];
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