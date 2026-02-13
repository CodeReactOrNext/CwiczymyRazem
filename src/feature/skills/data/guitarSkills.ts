import type { GuitarSkill, } from "feature/skills/skills.types";
import {
  GiBrain,
  GiCompactDisc,
  GiDrum,
  GiGClef,
  GiGuitarHead,
  GiHand,
  GiHeadphones,
  GiLightBulb,
  GiMetronome,
  GiMicrophone,
  GiMusicalNotes,
  GiMusicalScore,
  GiOpenBook,
  GiPaintBrush,
  GiPickOfDestiny,
  GiQuillInk,
  GiRadarSweep,
  GiSoundOn,
  GiSoundWaves,
  GiStairsGoal,
  GiSteelClaws,
  GiVibratingBall
} from "react-icons/gi";

export const guitarSkills: GuitarSkill[] = [
  {
    id: "alternate_picking",
    category: "technique",
    icon: GiGuitarHead,
  },
  {
    id: "phrasing",
    category: "creativity",
    icon: GiPaintBrush,
  },
  {
    id: "finger_independence",
    category: "technique",
    icon: GiHand,
  },
  {
    id: "legato",
    category: "technique",
    icon: GiMusicalNotes,
  },
  {
    id: "sweep_picking",
    category: "technique",
    icon: GiRadarSweep,
  },
  {
    id: "chords",
    category: "theory",
    icon: GiMusicalScore,
  },
  {
    id: "scales",
    category: "theory",
    icon: GiStairsGoal,
  },
  {
    id: "rhythm",
    category: "technique",
    icon: GiMetronome,
  },
  {
    id: "bending",
    category: "technique",
    icon: GiSoundWaves,
  },
  {
    id: "tapping",
    category: "technique",
    icon: GiSteelClaws,
  },
  {
    id: "improvisation",
    category: "creativity",
    icon: GiLightBulb,
  },
  {
    id: "ear_training",
    category: "hearing",
    icon: GiBrain,
  },
  {
    id: "composition",
    category: "creativity",
    icon: GiQuillInk,
  },
  {
    id: "articulation",
    category: "technique",
    icon: GiMicrophone,
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
    id: "rythm-recognition",
    category: "hearing",
    icon: GiDrum,
  },
  {
    id: "harmony",
    category: "theory",
    icon: GiGClef,
  },
  {
    id: "vibrato",
    category: "technique",
    icon: GiVibratingBall,
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
    icon: GiPickOfDestiny,
  },


];
