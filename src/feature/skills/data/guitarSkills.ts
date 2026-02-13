import type { GuitarSkill, } from "feature/skills/skills.types";
import {
  GiBookmarklet,
  GiCompactDisc,
  GiGuitarHead,
  GiHand,
  GiHandOk,
  GiHeadShot,
  GiMetronome,
  GiMusicalKeyboard,
  GiMusicalNotes,
  GiMusicalScore,
  GiMusicSpell,
  GiQuillInk,
  GiSoundOn,
  GiSoundWaves,
  GiSpellBook,
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
    icon: GiGuitarHead,
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
    icon: GiMusicSpell,
  },
  {
    id: "chords",
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
    id: "composition",
    category: "creativity",
    icon: GiQuillInk,
  },
  {
    id: "articulation",
    category: "technique",
    icon: GiSoundWaves,
  }, {
    id: "harmony-ear",
    category: "hearing",
    icon: GiSoundOn,
  },
  {
    id: "transcription",
    category: "hearing",
    icon: GiMusicalScore,
  },
  {
    id: "rythm-recognition",
    category: "hearing",
    icon: GiMetronome,
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
    id: "audio_production",
    category: "creativity",
    icon: GiCompactDisc,
  },
  {
    id: "hybrid_picking",
    category: "technique",
    icon: GiMusicalKeyboard,
  },


];
