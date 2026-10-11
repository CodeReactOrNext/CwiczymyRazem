import {
  AlternatePickingIcon,
  ArticulationIcon,
  BendingIcon,
  ChordsIcon,
  EarTrainingIcon,
  HarmonyIcon,
  HybridPickingIcon,
  LegatoIcon,
  PhrasingIcon,
  ScalesIcon,
  SweepPickingIcon,
  TappingIcon,
  VibratoIcon,
} from "feature/skills/icons/skillIcons";
import type { GuitarSkill } from "feature/skills/skills.types";
import {
  GiCompactDisc,
  GiHand,
  GiHeadphones,
  GiJumpAcross,
  GiLightBulb,
  GiMetronome,
  GiOpenBook,
  GiQuillInk,
  GiSoundOn,
} from "react-icons/gi";

export const guitarSkills: GuitarSkill[] = [
  {
    id: "alternate_picking",
    category: "technique",
    icon: AlternatePickingIcon,
  },
  {
    id: "phrasing",
    category: "creativity",
    icon: PhrasingIcon,
  },
  {
    id: "finger_independence",
    category: "technique",
    icon: GiHand,
  },
  {
    id: "legato",
    category: "technique",
    icon: LegatoIcon,
  },
  {
    id: "sweep_picking",
    category: "technique",
    icon: SweepPickingIcon,
  },
  {
    id: "chords",
    category: "theory",
    icon: ChordsIcon,
  },
  {
    id: "scales",
    category: "theory",
    icon: ScalesIcon,
  },
  {
    id: "rhythm",
    category: "technique",
    icon: GiMetronome,
  },
  {
    id: "bending",
    category: "technique",
    icon: BendingIcon,
  },
  {
    id: "tapping",
    category: "technique",
    icon: TappingIcon,
  },
  {
    id: "improvisation",
    category: "creativity",
    icon: GiLightBulb,
  },
  {
    id: "ear_training",
    category: "hearing",
    icon: EarTrainingIcon,
  },
  {
    id: "composition",
    category: "creativity",
    icon: GiQuillInk,
  },
  {
    id: "articulation",
    category: "technique",
    icon: ArticulationIcon,
  }, {
    id: "harmony-ear",
    category: "hearing",
    icon: GiSoundOn,
  },
  {
    id: "transcription",
    category: "hearing",
    icon: GiHeadphones,
  },
  {
    id: "harmony",
    category: "theory",
    icon: HarmonyIcon,
  },
  {
    id: "vibrato",
    category: "technique",
    icon: VibratoIcon,
  },
  {
    id: "music_theory",
    category: "theory",
    icon: GiOpenBook,
  },
  {
    id: "audio_production",
    category: "creativity",
    icon: GiCompactDisc,
  },
  {
    id: "hybrid_picking",
    category: "technique",
    icon: HybridPickingIcon,
  },
  {
    id: "string_skipping",
    category: "technique",
    icon: GiJumpAcross,
  },


];
