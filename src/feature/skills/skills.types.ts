import type { CategoryKeys } from "components/Charts/ActivityChart";
import type { IconType } from "react-icons";

export type GuitarSkillId =
  | "alternate_picking"
  | "legato"
  | "sweep_picking"
  | "chords"
  | "scales"
  | "rhythm"
  | "ear_training"
  | "improvisation"
  | "composition"
  | "harmony"
  | "vibrato"
  | "music_theory"
  | "audio_production"
  | "hybrid_picking"
  | "finger_independence"
  | "string_skipping"
  | "bending"
  | "tapping"
  | "phrasing"
  | "harmony-ear"
  | "transcription"
  | "rythm-recognition"
  | "articulation";

export interface GuitarSkill {
  id: GuitarSkillId;
  category: CategoryKeys
  icon?: IconType;
  name?: string;
}

export interface UserSkills {
  unlockedSkills: {
    [skillId in GuitarSkillId]?: number;
  } & { [key: string]: number };
}
