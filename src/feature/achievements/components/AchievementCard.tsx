import type { AchievementList } from "../achievementsData";
import { achievementsData } from "../achievementsData";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "./AchievementCard.module.css";
import { cn } from "../../../assets/lib/utils";

export const AchievementCard = ({ id }: { id: AchievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsData.find((achiv) => achiv.id === id);
  const { Icon, rarity, description, name } = achievementData!;
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [20, -20]);
  const rotateY = useTransform(x, [-100, 100], [-45, 45]);

  // const [cssVars, setCssVars] = useState<React.CSSProperties>({}); // REMOVED for performance

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    // Original physics logic (keep framer motion for tilt)
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((event.clientX - centerX) * 1.5);
    y.set((event.clientY - centerY) * 1.5);

    // Added Holo logic - Imperative update for 60fps 
    const width = rect.width;
    const height = rect.height;
    
    // Normalized 0-1
    const xPct = (event.clientX - rect.left) / width;
    const yPct = (event.clientY - rect.top) / height;

    const pointerX = xPct * 100;
    const pointerY = yPct * 100;
    
    // Move background twice as fast for parallax feel
    const backgroundX = 50 + (xPct - 0.5) * 100; 
    const backgroundY = 50 + (yPct - 0.5) * 15;

    ref.current.style.setProperty("--pointer-x", `${pointerX}%`);
    ref.current.style.setProperty("--pointer-y", `${pointerY}%`);
    ref.current.style.setProperty("--background-x", `${backgroundX}%`);
    ref.current.style.setProperty("--background-y", `${backgroundY}%`);
    ref.current.style.setProperty("--card-opacity", "1");
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setShowTooltip(false);
    
    if (ref.current) {
        ref.current.style.setProperty("--pointer-x", "50%");
        ref.current.style.setProperty("--pointer-y", "50%");
        ref.current.style.setProperty("--background-x", "50%");
        ref.current.style.setProperty("--background-y", "50%");
        ref.current.style.setProperty("--card-opacity", "0");
    }
  };

  const handleCardClick = () => {
    setShowTooltip((prev) => !prev);
  };

  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const getEpicCardStyle = () => {
    if (rarity !== "epic") return {};

    return {
      background: "linear-gradient(135deg, #0f0518 0%, #1a0b2e 50%, #2d1b4e 100%)",
      // Removed outer glow, kept subtle inset
      boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.1)", 
    };
  };

  const baseCardClasses =
    "relative cursor-help overflow-hidden border-2 border-opacity-20 p-2 shadow-inset-cool radius-default";

  // Helper for CSS module rarity mapping (for materials)
  const rarityModuleClass = `rarity-${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`;

  return (
    <div className='group relative' ref={ref}>
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          perspective: "1000px",
          ...(rarity === "epic" ? getEpicCardStyle() : {}),
        }}
        whileHover={{ scale: 2, zIndex: 50 }} // Restored scale: 2
        onClick={handleCardClick}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`${baseCardClasses} ${
          rarity === "common"
            ? "border-achievements-common bg-second-200 text-achievements-common"
            : rarity === "rare"
            ? "border-achievements-rare bg-achievements-rare text-main-opposed-800"
            : rarity === "veryRare"
            ? "border-achievements-veryRare bg-achievements-veryRare text-main-opposed-800"
            : rarity === "epic"
            ? "border-achievements-epic text-white"
            : ""
        } ${styles.card} ${styles[rarityModuleClass]}`} 
        // We append styles.card to hook into CSS module, but rely on base classes for structure
      >
        
        {/* --- ADDED HOLO LAYERS --- */}
        <div className={styles.holo} /> 
        <div className={styles.glare} />

        {/* Content Layer */}
        <div className={styles.cardContent}>
           {/* Icon moved to bottom for z-index layering with holo */}
           <Icon className='relative text-lg md:text-3xl' />
        </div>
      </motion.div>

      {/* User's Tooltip */}
      {showTooltip && (
        <div
          onClick={() => setShowTooltip(false)}
          className='absolute bottom-full left-1/2 z-50 mb-6 w-max max-w-[200px] -translate-x-1/2 rounded-lg bg-white/90 p-3 text-black shadow-lg pointer-events-none'>
          <h3 className='mb-1 font-semibold text-sm'>{t(name as any)}</h3>
          <p className='text-xs text-black'>{t(description as any)}</p>
        </div>
      )}
    </div>
  );
};
