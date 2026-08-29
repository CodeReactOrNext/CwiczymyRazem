import type { EffectType } from "feature/arsenal/types/arsenal.types";
import type { GearKind } from "feature/gearProposals/types/gearProposal.types";
import {
  Activity,
  AudioWaveform,
  Flame,
  Gauge,
  Guitar,
  Layers,
  type LucideIcon,
  Minimize2,
  Radio,
  Repeat,
  SlidersHorizontal,
  TrendingUp,
  Volume2,
  Waves,
  Wind,
  Zap,
} from "lucide-react";

/**
 * A face per pedal type. The Arsenal draws its own pedals as artwork, but a
 * proposal has no artwork yet — often not even a link — so the type needs
 * something to read as at a glance instead of another grey word chip.
 */
const EFFECT_ICONS: Record<EffectType, LucideIcon> = {
  Overdrive: Zap,
  Distortion: Flame,
  Fuzz: Radio,
  Boost: TrendingUp,
  Delay: Repeat,
  Reverb: Waves,
  Chorus: Layers,
  Phaser: Wind,
  Flanger: AudioWaveform,
  Vibrato: Activity,
  Wah: Volume2,
  Compressor: Minimize2,
  EQ: SlidersHorizontal,
  Tuner: Gauge,
};

export const renderEffectIcon = (
  effectType: EffectType | null,
  size = 13,
): React.ReactNode => {
  if (!effectType) return null;
  const Icon = EFFECT_ICONS[effectType] ?? Zap;
  return <Icon size={size} />;
};

export const renderKindIcon = (kind: GearKind, size = 22): React.ReactNode => {
  const Icon = kind === "guitar" ? Guitar : Zap;
  return <Icon size={size} />;
};
