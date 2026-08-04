import {
  ArrowDownLeft, ArrowUpDown, AudioWaveform,
  ClipboardCheck, Hammer,
  ListMusic, Music, Shuffle, SkipForward, Timer, TrendingUp,
  Waves, Zap,
} from "lucide-react";
import React from "react";
import {
  TbBook2, TbCopy, TbCrown, TbGlobe, TbGrid3X3, TbGuitarPick, TbMapPin, TbSparkles, TbTrophy,
} from "react-icons/tb";

const STEP_ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number }>> = {
  // Fundamentals-only
  ClipboardCheck,
  Music,
  Timer,
  Shuffle,
  AudioWaveform,
  ArrowUpDown,
  Hammer,
  ArrowDownLeft,
  SkipForward,
  Waves,
  TrendingUp,
  ListMusic,
  // Shared / Fretboard Mastery
  LayoutGrid: TbGrid3X3,
  BookOpen:   TbBook2,
  Target:     TbMapPin,   // fret 5/7/9 landmarks — a signpost you navigate by, not a bullseye
  Copy:       TbCopy,
  Globe:      TbGlobe,
  Sparkles:   TbSparkles,
  Trophy:     TbTrophy,
  Guitar:     TbGuitarPick, // matches the guitar-pick motif used elsewhere in the app
  Crown:      TbCrown,      // reserved for the whole-neck capstone exam
};

export function getStepIcon(name: string, size = 22): React.ReactNode {
  const Icon = STEP_ICON_COMPONENTS[name] ?? Zap;
  return <Icon size={size} />;
}
