import { motion, useMotionValue, useTransform } from "framer-motion";
import React, { forwardRef, useImperativeHandle,useRef } from "react";
import type { IconType } from "react-icons/lib";

import { achievementsRarity } from "../../data/achievementsRarity";
import styles from "./AchievementCard.module.css";

interface AchievementPhysicalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  Icon: IconType;
  rarity: "common" | "rare" | "veryRare" | "epic";
  isMobileView?: boolean;
  customStyle?: React.CSSProperties;
  cardSize?: "sm" | "lg";
}

const getEpicCardStyle = (rarity: string) => {
  if (rarity !== "epic") return {};
  return {
    background: "linear-gradient(135deg, #0f0518 0%, #1a0b2e 50%, #2d1b4e 100%)",
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
  };
};

const baseCardClasses = "relative overflow-hidden border p-2 shadow-inset-cool flex items-center justify-center aspect-square transition-colors duration-200";

export const AchievementPhysicalCard = forwardRef<HTMLDivElement, AchievementPhysicalCardProps>(
  (
    {
      Icon,
      rarity,
      isMobileView,
      customStyle,
      cardSize = "sm",
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
    }

    const getTextColor = () => {
        if (rarity === "common") return "#fff";
        if (rarity === "epic") return "#fff";
        return "#18181b";
    }

    return (
      <div 
        {...props}
        className={`group relative inline-flex items-center justify-center shrink-0 flex-none ${isMobileView ? "cursor-pointer" : "cursor-help"} ${props.className || ""}`} 
        ref={innerRef}
        onMouseMove={(e) => {
            handleMouseMove(e);
            props.onMouseMove?.(e);
        }}
        onMouseLeave={(e) => {
            handleMouseLeaveInternal();
            props.onMouseLeave?.(e);
        }}
      >
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
          whileHover={isMobileView ? {} : { 
            scale: 2.0, 
            zIndex: 50,
            transition: { duration: 0.1 }
          }}
          className={`${baseCardClasses} w-full h-full rounded-[inherit] ${styles.card} ${styles[rarityModuleClass]}`}
        >
          <div className={styles.holo} />
          <div className={styles.glare} />

          <div className={styles.cardContent}>
            <Icon className={`relative ${cardSize === "lg" ? "text-5xl" : "text-lg md:text-2xl"}`} />
          </div>
        </motion.div>
      </div>
    );
  }
);

AchievementPhysicalCard.displayName = "AchievementPhysicalCard";
