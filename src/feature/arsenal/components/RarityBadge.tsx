import { cn } from "assets/lib/utils";
import type { GuitarRarity } from "../types/arsenal.types";

export const RARITY_STYLES: Record<GuitarRarity, { 
  badge: string; 
  text: string; 
  glow: string; 
  border: string; 
  bg: string;
  baseColor: string;
  rpgGradient: string;
}> = {
  Common:    { 
    badge: "bg-zinc-800/80 border-zinc-500", text: "text-zinc-300", glow: "shadow-[0_0_15px_rgba(161,161,170,0.1)]", border: "border-b-zinc-400", bg: "from-zinc-400/10 to-transparent",
    baseColor: "#a1a1aa", rpgGradient: "from-zinc-500 to-zinc-700"
  },
  Uncommon:  { 
    badge: "bg-emerald-950/80 border-emerald-700", text: "text-emerald-400", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]", border: "border-b-emerald-400", bg: "from-emerald-400/10 to-transparent",
    baseColor: "#10b981", rpgGradient: "from-emerald-400 via-emerald-600 to-emerald-900"
  },
  Rare:      { 
    badge: "bg-blue-950/80 border-blue-700", text: "text-blue-400", glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]", border: "border-b-blue-500", bg: "from-blue-500/10 to-transparent",
    baseColor: "#3b82f6", rpgGradient: "from-blue-400 via-blue-600 to-blue-900"
  },
  Epic:      { 
    badge: "bg-purple-950/80 border-purple-700", text: "text-purple-400", glow: "shadow-[0_0_25px_rgba(168,85,247,0.5)]", border: "border-b-purple-500", bg: "from-purple-500/10 to-transparent",
    baseColor: "#a855f7", rpgGradient: "from-purple-400 via-purple-600 to-purple-900"
  },
  Legendary: { 
    badge: "bg-rose-950/80 border-rose-700", text: "text-rose-400", glow: "shadow-[0_0_30px_rgba(244,63,94,0.6)]", border: "border-b-rose-500", bg: "from-rose-500/10 to-transparent",
    baseColor: "#f43f5e", rpgGradient: "from-rose-400 via-rose-600 to-rose-900"
  },
  Mythic:    { 
    badge: "bg-amber-950/80 border-amber-600", text: "text-amber-400", glow: "shadow-[0_0_40px_rgba(251,191,36,0.7)]", border: "border-b-amber-400", bg: "from-amber-400/10 to-transparent",
    baseColor: "#fbbf24", rpgGradient: "from-amber-300 via-amber-500 to-orange-700"
  },
};

interface RarityBadgeProps {
  rarity: GuitarRarity;
  size?: "sm" | "md" | "lg";
}

export const RarityBadge = ({ rarity, size = "sm" }: RarityBadgeProps) => {
  const styles = RARITY_STYLES[rarity];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm font-black uppercase tracking-widest relative overflow-hidden",
        size === "sm" ? "px-2.5 py-0.5 text-[9px]" : size === "md" ? "px-4 py-1.5 text-xs" : "px-6 py-2 text-sm",
        size === "sm" ? styles.text : "text-white"
      )}
      style={{
        background: size !== "sm" ? `linear-gradient(45deg, ${styles.baseColor}40, transparent)` : undefined,
        borderBottom: `2px solid ${styles.baseColor}`,
        textShadow: "0 2px 4px rgba(0,0,0,0.8)"
      }}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
      {rarity}
    </span>
  );
};

export const RARITY_GLOW_CLASS: Record<GuitarRarity, string> = {
  Common:    "shadow-[0_0_15px_rgba(161,161,170,0.15)]",
  Uncommon:  "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
  Rare:      "shadow-[0_0_25px_rgba(59,130,246,0.4)]",
  Epic:      "shadow-[0_0_30px_rgba(168,85,247,0.5)]",
  Legendary: "shadow-[0_0_40px_rgba(244,63,94,0.6)]",
  Mythic:    "shadow-[0_0_50px_rgba(251,191,36,0.7)]",
};
