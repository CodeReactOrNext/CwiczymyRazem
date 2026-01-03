import type { CategoryKeys } from "components/Charts/ActivityChart";
import type { IconType } from "react-icons";

export type GuitarSkillId =
  | "alternate_picking"
  | "legato"
  | "sweep_picking"
  | "chord_theory"
  | "scales"
  | "rhythm"
  | "ear_training"
  | "sight_reading"
  | "improvisation"
  | "composition"
  | "harmony"
  | "vibrato"
  | "music_theory"
  | "slide_guitar"
  | "audio_production"
  | "hybrid_picking"
  | "transcription"
  | "rythm_recognition"
  | "picking"
  | "finger_independence"
  | "string_skipping"
  | "technique"
  | "bending"
  | "tapping"
  | "pitch_recognition"
  | "fingerpicking"
  | "phrasing"
  | "articulation";

export interface GuitarSkill {
  id: GuitarSkillId;
  category: CategoryKeys
  icon?: IconType;
  name?: string;
}

export interface UserSkills {
  availablePoints: Record<CategoryKeys, number>;
  unlockedSkills: {
    [skillId in GuitarSkillId]?: number;
  };
}
