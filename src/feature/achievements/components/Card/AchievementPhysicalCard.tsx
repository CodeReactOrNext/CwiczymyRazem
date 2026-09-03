import { cn } from "assets/lib/utils";
import { motion, useMotionValue, useTransform } from "framer-motion";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import type { IconType } from "react-icons/lib";

import { achievementsRarity } from "../../data/achievementsRarity";
import styles from "./AchievementCard.module.css";

type AchievementRarity = "common" | "rare" | "veryRare" | "epic";

interface AchievementPhysicalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  Icon: IconType;
  rarity: AchievementRarity;
  isMobileView?: boolean;
  customStyle?: React.CSSProperties;
  cardSize?: "sm" | "lg";
  /**
   * `holo` is the collectible: a tilting, foiled card with a noise filter, two
   * blend-mode layers and a 2.2x hover — the right treatment for the one badge a
   * post-session popup is celebrating.
   *
   * `flat` is the same badge at rest. A grid of 77 holo cards is ~300 blended and
   * filtered layers plus 77 framer-motion instances and 77 mousemove handlers,
   * and the light rarity fills (`rare` is #b1f9ff) turn a dark page into a field
   * of white chiclets. Flat drops all of it for the app's own signature —
   * translucent tint of the hue, the same hue at full strength on the glyph —
   * which is what STYLEGUIDE section 4 asks for in place of a saturated fill.
   */
  variant?: "holo" | "flat";
  /** `flat` only: neutral zinc instead of the rarity colour, for a locked badge. */
  muted?: boolean;
}

const getEpicCardStyle = (rarity: string) => {
  if (rarity !== "epic") return {};
  return {
    background: "linear-gradient(135deg, #0f0518 0%, #1a0b2e 50%, #2d1b4e 100%)",
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
  };
};

const FLAT_TONE: Record<AchievementRarity, string> = {
  common: "bg-zinc-700/40 text-zinc-200",
  rare: "bg-cyan-500/10 text-achievements-rare",
  veryRare: "bg-amber-500/10 text-achievements-veryRare",
  epic: "bg-purple-500/15 text-purple-300",
};

const FLAT_MUTED = "bg-white/[0.03] text-zinc-600";

const baseCardClasses =
  "relative overflow-hidden border p-2 shadow-inset-cool flex items-center justify-center aspect-square transition-colors duration-200";

/**
 * The holo treatment, kept in its own component so that its hooks — and the
 * motion values behind them — only exist for the cards that actually tilt.
 */
const HoloCard = forwardRef<HTMLDivElement, AchievementPhysicalCardProps>(
  (
    {
      Icon,
      rarity,
      isMobileView,
      customStyle,
      cardSize = "sm",
      // Variant props are the dispatcher's business; spreading them onto a div
      // would put `variant` and `muted` in the DOM.
      variant: _variant,
      muted: _muted,
      ...props
    },
    forwardedRef
  ) => {
    const rarityModuleClass = `rarity-${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`;
    const innerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(forwardedRef, () => innerRef.current!);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [20, -20]);
    const rotateY = useTransform(x, [-100, 100], [-45, 45]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      if (isMobileView || !innerRef.current) return;
      const rect = innerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set((event.clientX - centerX) * 1.5);
      y.set((event.clientY - centerY) * 1.5);

      const width = rect.width;
      const height = rect.height;
      const xPct = (event.clientX - rect.left) / width;
      const yPct = (event.clientY - rect.top) / height;

      innerRef.current.style.setProperty("--pointer-x", `${xPct * 100}%`);
      innerRef.current.style.setProperty("--pointer-y", `${yPct * 100}%`);
      innerRef.current.style.setProperty("--background-x", `${50 + (xPct - 0.5) * 100}%`);
      innerRef.current.style.setProperty("--background-y", `${50 + (yPct - 0.5) * 15}%`);
      innerRef.current.style.setProperty("--card-opacity", "1");
    };

    const handleMouseLeaveInternal = () => {
      if (isMobileView) return;
      x.set(0);
      y.set(0);
      if (innerRef.current) {
        innerRef.current.style.setProperty("--pointer-x", "50%");
        innerRef.current.style.setProperty("--pointer-y", "50%");
        innerRef.current.style.setProperty("--background-x", "50%");
        innerRef.current.style.setProperty("--background-y", "50%");
        innerRef.current.style.setProperty("--card-opacity", "0");
      }
    };

    const getBaseBgColor = () => {
      if (rarity === "common") return "#3f3f46";
      return achievementsRarity[rarity].color;
    };

    const getTextColor = () => {
      if (rarity === "common") return "#fff";
      if (rarity === "epic") return "#fff";
      return "#18181b";
    };

    return (
      <div
        {...props}
        className={`group relative inline-flex shrink-0 flex-none items-center justify-center ${
          isMobileView ? "cursor-pointer" : "cursor-help"
        } ${props.className || ""}`}
        ref={innerRef}
        onMouseMove={(e) => {
          handleMouseMove(e);
          props.onMouseMove?.(e);
        }}
        onMouseLeave={(e) => {
          handleMouseLeaveInternal();
          props.onMouseLeave?.(e);
        }}>
        <motion.div
          style={{
            rotateX: isMobileView ? 0 : rotateX,
            rotateY: isMobileView ? 0 : rotateY,
            transformStyle: "preserve-3d",
            perspective: "1000px",
            backgroundColor: getBaseBgColor(),
            color: getTextColor(),
            borderColor: "rgba(255,255,255,0.15)",
            ...getEpicCardStyle(rarity),
            ...customStyle,
          }}
          whileHover={
            isMobileView
              ? {}
              : {
                  scale: 2.0,
                  zIndex: 50,
                  transition: { duration: 0.1 },
                }
          }
          className={`${baseCardClasses} h-full w-full rounded-[inherit] ${styles.card} ${styles[rarityModuleClass]}`}>
          <div className={styles.holo} />
          <div className={styles.glare} />

          <div className={styles.cardContent}>
            <Icon
              className={`relative ${cardSize === "lg" ? "text-5xl" : "text-lg md:text-2xl"}`}
            />
          </div>
        </motion.div>
      </div>
    );
  }
);

HoloCard.displayName = "HoloCard";

/** One div and one glyph: no motion values, no filters, no blend modes. */
const FlatCard = forwardRef<HTMLDivElement, AchievementPhysicalCardProps>(
  (
    {
      Icon,
      rarity,
      cardSize = "sm",
      muted = false,
      // Holo-only props, pulled out so they never reach the DOM.
      isMobileView: _isMobileView,
      customStyle: _customStyle,
      variant: _variant,
      ...props
    },
    forwardedRef
  ) => (
    <div
      {...props}
      ref={forwardedRef}
      className={cn(
        "inline-flex aspect-square shrink-0 items-center justify-center rounded-lg",
        muted ? FLAT_MUTED : FLAT_TONE[rarity],
        props.className
      )}>
      <Icon className={cardSize === "lg" ? "text-4xl" : "text-lg md:text-xl"} aria-hidden />
    </div>
  )
);

FlatCard.displayName = "FlatCard";

export const AchievementPhysicalCard = forwardRef<HTMLDivElement, AchievementPhysicalCardProps>(
  (props, ref) =>
    props.variant === "flat" ? (
      <FlatCard {...props} ref={ref} />
    ) : (
      <HoloCard {...props} ref={ref} />
    )
);

AchievementPhysicalCard.displayName = "AchievementPhysicalCard";
