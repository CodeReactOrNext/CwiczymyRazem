import {
  AlertCircle, ArrowDownLeft, ArrowUpDown, AudioWaveform,
  ChevronDown, ClipboardCheck, Compass, Copy, Dot, Drum,
  Ear, Eye, Footprints, GitMerge, GraduationCap, Grid3x3, Guitar,
  Hammer, Hand, Hash, Info, Layers, Lightbulb,
  ListMusic, MessageSquare, Mic2, Milestone, Minimize2, MousePointerClick,
Move,   Music, Music2, Repeat, Shuffle, SkipForward, SlidersHorizontal,
  TableProperties, Timer, TrendingUp, Trophy, Users, Volume2,
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

// Icons referenced by contentBlocks (callouts) and checklist items — a wider,
// flatter set than STEP_ICON_COMPONENTS since authors pick a fresh icon per callout.
const CONTENT_ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  AlertCircle, ArrowUpDown, AudioWaveform, ChevronDown, Compass, Copy, Dot, Drum,
  Ear, Eye, Footprints, GitMerge, GraduationCap, Grid3x3, Guitar,
  Hammer, Hand, Hash, Info, Layers, Lightbulb,
  MessageSquare, Mic2, Milestone, Minimize2, Move, MousePointerClick,
  Music, Music2, Repeat, SlidersHorizontal,
  TableProperties, Timer, TrendingUp, Trophy, Users, Volume2,
};

export function getContentIcon(name?: string, size = 16, className?: string): React.ReactNode {
  if (!name) return null;
  const Icon = CONTENT_ICON_COMPONENTS[name];
  return Icon ? <Icon size={size} className={className} /> : null;
}
