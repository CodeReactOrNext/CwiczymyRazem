import {
  Activity,
  AudioLines,
  BookOpen,
  Brain,
  Compass,
  Crown,
  Drum,
  Dumbbell,
  Flame,
  Gauge,
  GraduationCap,
  Guitar,
  Hand,
  Headphones,
  Heart,
  Hexagon,
  type LucideIcon,
  Mic,
  Music,
  Music2,
  Piano,
  Rocket,
  Sparkles,
  Star,
  Swords,
  Target,
  Timer,
  Trophy,
  Waves,
  Zap,
} from "lucide-react";

/**
 * Visual appearance options a user can pick for a custom plan (last step of the
 * create/edit wizard). Stored on the plan as `icon` / `color` ids and resolved
 * back to Tailwind classes / icon components by PlanCard.
 *
 * NOTE: every Tailwind class below is written out in full (no string
 * interpolation) so the JIT compiler can see and generate them.
 */

export interface PlanColor {
  id: string;
  label: string;
  /** Solid swatch shown in the picker. */
  swatch: string;
  gradient: string;
  iconTile: string;
  text: string;
  badge: string;
  glow: string;
  cta: string;
}

export const PLAN_COLORS: PlanColor[] = [
  {
    id: "blue",
    label: "Blue",
    swatch: "bg-blue-500",
    gradient: "from-blue-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-blue-500/10 text-blue-400",
    text: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    glow: "bg-blue-500/25",
    cta: "group-hover:bg-blue-500 group-hover:text-zinc-950",
  },
  {
    id: "cyan",
    label: "Cyan",
    swatch: "bg-cyan-500",
    gradient: "from-cyan-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-cyan-500/10 text-cyan-400",
    text: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    glow: "bg-cyan-500/25",
    cta: "group-hover:bg-cyan-500 group-hover:text-zinc-950",
  },
  {
    id: "teal",
    label: "Teal",
    swatch: "bg-teal-500",
    gradient: "from-teal-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-teal-500/10 text-teal-400",
    text: "text-teal-400",
    badge: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    glow: "bg-teal-500/25",
    cta: "group-hover:bg-teal-500 group-hover:text-zinc-950",
  },
  {
    id: "emerald",
    label: "Emerald",
    swatch: "bg-emerald-500",
    gradient: "from-emerald-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-emerald-500/10 text-emerald-400",
    text: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    glow: "bg-emerald-500/25",
    cta: "group-hover:bg-emerald-500 group-hover:text-zinc-950",
  },
  {
    id: "lime",
    label: "Lime",
    swatch: "bg-lime-500",
    gradient: "from-lime-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-lime-500/10 text-lime-400",
    text: "text-lime-400",
    badge: "bg-lime-500/10 text-lime-400 border-lime-500/20",
    glow: "bg-lime-500/25",
    cta: "group-hover:bg-lime-500 group-hover:text-zinc-950",
  },
  {
    id: "amber",
    label: "Amber",
    swatch: "bg-amber-500",
    gradient: "from-amber-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-amber-500/10 text-amber-400",
    text: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    glow: "bg-amber-500/25",
    cta: "group-hover:bg-amber-500 group-hover:text-zinc-950",
  },
  {
    id: "orange",
    label: "Orange",
    swatch: "bg-orange-500",
    gradient: "from-orange-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-orange-500/10 text-orange-400",
    text: "text-orange-400",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    glow: "bg-orange-500/25",
    cta: "group-hover:bg-orange-500 group-hover:text-zinc-950",
  },
  {
    id: "red",
    label: "Red",
    swatch: "bg-red-500",
    gradient: "from-red-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-red-500/10 text-red-400",
    text: "text-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    glow: "bg-red-500/25",
    cta: "group-hover:bg-red-500 group-hover:text-zinc-950",
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "bg-rose-500",
    gradient: "from-rose-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-rose-500/10 text-rose-400",
    text: "text-rose-400",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    glow: "bg-rose-500/25",
    cta: "group-hover:bg-rose-500 group-hover:text-zinc-950",
  },
  {
    id: "pink",
    label: "Pink",
    swatch: "bg-pink-500",
    gradient: "from-pink-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-pink-500/10 text-pink-400",
    text: "text-pink-400",
    badge: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    glow: "bg-pink-500/25",
    cta: "group-hover:bg-pink-500 group-hover:text-zinc-950",
  },
  {
    id: "purple",
    label: "Purple",
    swatch: "bg-purple-500",
    gradient: "from-purple-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-purple-500/10 text-purple-400",
    text: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    glow: "bg-purple-500/25",
    cta: "group-hover:bg-purple-500 group-hover:text-zinc-950",
  },
  {
    id: "indigo",
    label: "Indigo",
    swatch: "bg-indigo-500",
    gradient: "from-indigo-500/15 via-zinc-900/60 to-zinc-950",
    iconTile: "bg-indigo-500/10 text-indigo-400",
    text: "text-indigo-400",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    glow: "bg-indigo-500/25",
    cta: "group-hover:bg-indigo-500 group-hover:text-zinc-950",
  },
];

export interface PlanIcon {
  id: string;
  label: string;
  Icon: LucideIcon;
}

export const PLAN_ICONS: PlanIcon[] = [
  { id: "guitar", label: "Guitar", Icon: Guitar },
  { id: "music", label: "Music", Icon: Music },
  { id: "music2", label: "Note", Icon: Music2 },
  { id: "piano", label: "Piano", Icon: Piano },
  { id: "drum", label: "Drums", Icon: Drum },
  { id: "mic", label: "Mic", Icon: Mic },
  { id: "headphones", label: "Headphones", Icon: Headphones },
  { id: "audio", label: "Waveform", Icon: AudioLines },
  { id: "waves", label: "Waves", Icon: Waves },
  { id: "activity", label: "Pulse", Icon: Activity },
  { id: "gauge", label: "Tempo", Icon: Gauge },
  { id: "timer", label: "Timer", Icon: Timer },
  { id: "zap", label: "Energy", Icon: Zap },
  { id: "flame", label: "Streak", Icon: Flame },
  { id: "target", label: "Focus", Icon: Target },
  { id: "brain", label: "Theory", Icon: Brain },
  { id: "graduation", label: "Learn", Icon: GraduationCap },
  { id: "book", label: "Study", Icon: BookOpen },
  { id: "compass", label: "Explore", Icon: Compass },
  { id: "hand", label: "Dexterity", Icon: Hand },
  { id: "dumbbell", label: "Workout", Icon: Dumbbell },
  { id: "swords", label: "Challenge", Icon: Swords },
  { id: "rocket", label: "Boost", Icon: Rocket },
  { id: "sparkles", label: "Creativity", Icon: Sparkles },
  { id: "star", label: "Star", Icon: Star },
  { id: "trophy", label: "Mastery", Icon: Trophy },
  { id: "crown", label: "Pro", Icon: Crown },
  { id: "heart", label: "Heart", Icon: Heart },
  { id: "hexagon", label: "Hexagon", Icon: Hexagon },
];

export const getPlanColor = (id?: string | null): PlanColor | undefined =>
  id ? PLAN_COLORS.find((c) => c.id === id) : undefined;

export const getPlanIcon = (id?: string | null): LucideIcon | undefined =>
  id ? PLAN_ICONS.find((i) => i.id === id)?.Icon : undefined;
