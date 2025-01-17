import { GuitarSkill } from "feature/skills/skills.types";
import {
  GiMusicalScore,
  GiMetronome,
  GiMusicSpell,
  GiSoundWaves,
  GiMusicalNotes,
  GiHandOk,
  GiSpellBook,
  GiHeadShot,
  GiCompactDisc,
  GiGuitarHead,
  GiPencilBrush,
  GiVibratingBall,
  GiBookmarklet,
  GiDrumKit,
  GiQuillInk,
  GiSteelClaws,
  GiAbstract010,
  GiSoundOn,
  GiMusicalKeyboard,
} from "react-icons/gi";

export const guitarSkills: GuitarSkill[] = [
  {
    id: "alternate_picking",
    category: "technique",
    icon: GiGuitarHead,
  },
  {
    id: "legato",
    category: "technique", 
    icon: GiMusicalNotes,
  },
  {
    id: "sweep_picking",
    category: "technique",
    icon: GiMusicSpell,
  },
  {
    id: "chord_theory",
    category: "theory",
    icon: GiMusicalScore,
  },
  {
    id: "scales",
    category: "theory",
    icon: GiSpellBook,
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
    icon: GiHandOk,
  },
  {
    id: "improvisation",
    category: "creativity",
    icon: GiMusicSpell,
  },
  {
    id: "ear_training",
    category: "hearing",
    icon: GiHeadShot,
  },
  {
    id: "sight_reading",
    category: "theory",
    icon: GiMusicalScore,
  },
  {
    id: "fingerpicking",
    category: "technique",
    icon: GiGuitarHead,
  },
  {
    id: "music_composition",
    category: "creativity",
    icon: GiQuillInk,
  },
  {
    id: "pitch_recognition",
    category: "hearing",
    icon: GiSoundOn,
  },
  {
    id: "harmony",
    category: "theory",
    icon: GiMusicalNotes,
  },
  {
    id: "vibrato",
    category: "technique",
    icon: GiVibratingBall,
  },
  {
    id: "music_theory",
    category: "theory",
    icon: GiBookmarklet,
  },
  {
    id: "songwriting",
    category: "creativity",
    icon: GiPencilBrush,
  },
  {
    id: "slide_guitar",
    category: "technique",
    icon: GiSteelClaws,
  },

  {
    id: "audio_production",
    category: "creativity",
    icon: GiCompactDisc,
  },
  {
    id: "hybrid_picking",
    category: "technique",
    icon: GiMusicalKeyboard,
  },
  {
    id: "transcription",
    category: "hearing",
    icon: GiMusicalScore,
  },
  {
    id: "rythm_recognition",
    category: "hearing",
    icon: GiMetronome,
  },
  {
    id: "picking",
    category: "technique",
    icon: GiGuitarHead,
  }
];
