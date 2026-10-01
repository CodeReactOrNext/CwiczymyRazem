import styles from "feature/achievements/components/Card/AchievementCard.module.css";
import { Music } from "lucide-react";
import type { CSSProperties } from "react";
import { useRef } from "react";

type Holo = "Common" | "Rare" | "VeryRare" | "Epic";

/** Harder songs get a louder foil: S-tier shines like an epic achievement. */
const HOLO_BY_TIER: Record<string, Holo> = {
  S: "Epic",
  A: "VeryRare",
  B: "Rare",
};

interface ShinyCoverProps {
  src?: string;
  alt: string;
  tier: string;
  className?: string;
}

/**
 * A song cover printed like an achievement card: it tilts toward the pointer
 * and a holographic foil and glare slide across it. The foil and glare are the
 * achievement card's own CSS, driven by the same pointer variables — only the
 * face is a cover instead of an icon.
 */
export const ShinyCover = ({ src, alt, tier, className }: ShinyCoverProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const holo = HOLO_BY_TIER[tier] ?? "Common";

  const setPointer = (xPct: number, yPct: number, opacity: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--pointer-x", `${xPct * 100}%`);
    el.style.setProperty("--pointer-y", `${yPct * 100}%`);
    el.style.setProperty("--background-x", `${50 + (xPct - 0.5) * 100}%`);
    el.style.setProperty("--background-y", `${50 + (yPct - 0.5) * 15}%`);
    el.style.setProperty("--rotate-x", `${(0.5 - yPct) * 16}deg`);
    el.style.setProperty("--rotate-y", `${(xPct - 0.5) * 22}deg`);
    el.style.setProperty("--card-opacity", `${opacity}`);
  };

  return (
    <div
      ref={ref}
      aria-hidden
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPointer(
          (e.clientX - rect.left) / rect.width,
          (e.clientY - rect.top) / rect.height,
          1,
        );
      }}
      onMouseLeave={() => setPointer(0.5, 0.5, 0)}
      // The card's CSS pops it to 2.2x on hover — right for a 44px badge,
      // wrong for a cover. Pinned here; the tilt alone does the work.
      style={{ "--scale": 1 } as CSSProperties}
      className={`${styles.card} ${styles[`rarity-${holo}`]} relative overflow-hidden bg-zinc-800 ${className ?? ""}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className='absolute inset-0 h-full w-full object-cover'
        />
      ) : (
        <div className='absolute inset-0 flex items-center justify-center'>
          <Music className='h-10 w-10 text-zinc-500' />
        </div>
      )}
      <div className={styles.holo} />
      <div className={styles.glare} />
    </div>
  );
};
