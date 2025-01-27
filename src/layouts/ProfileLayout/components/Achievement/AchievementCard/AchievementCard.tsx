import type { AchievementList } from "feature/achievements/achievementsData";
import { achievementsData } from "feature/achievements/achievementsData";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const AchievementCard = ({ id }: { id: AchievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsData.find((achiv) => achiv.id === id);
  const { Icon, rarity, description, name } = achievementData!;
  const [showTooltip, setShowTooltip] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [45, -45]);
  const rotateY = useTransform(x, [-100, 100], [-45, 45]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((event.clientX - centerX) * 1.5);
    y.set((event.clientY - centerY) * 1.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setShowTooltip(false);
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

  return (
    <div className='group relative'>
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
        whileHover={{ scale: 2 }}
        onClick={handleCardClick}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`
       ${
         rarity === "common"
           ? "border-achievements-common bg-second-200 text-achievements-common"
           : ""
       }
        ${
          rarity === "rare"
            ? "border-achievements-rare bg-achievements-rare text-main-opposed-800"
            : ""
        }
        ${
          rarity === "veryRare"
            ? " border-achievements-veryRare bg-achievements-veryRare text-main-opposed-800"
            : ""
        }
        relative cursor-help overflow-hidden border-2 border-opacity-20 p-2 shadow-inset-cool radius-default`}>
        <motion.div
          className='absolute inset-0 opacity-0 group-hover:opacity-100'
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%)",
            transform: "skewX(-25deg) translateX(-200%)",
            width: "200%",
            height: "100%",
          }}
          animate={{
            translateX: ["-200%", "200%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "linear",
            repeatDelay: 1.5,
          }}
        />
        <motion.div
          className='absolute inset-0 opacity-0 group-hover:opacity-60'
          style={{
            background:
              rarity === "veryRare"
                ? "radial-gradient(circle, rgba(255,229,76,0.6) 0%, transparent 70%)"
                : rarity === "rare"
                ? "radial-gradient(circle, rgba(177,249,255,0.6) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.5, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
          }}
        />
        <Icon className='relative z-10 text-lg drop-shadow-lg md:text-3xl' />
      </motion.div>
      {showTooltip && (
        <div
          onClick={() => setShowTooltip(false)}
          className='absolute bottom-full left-1/2 z-50 mb-6 w-max max-w-[200px] -translate-x-1/2 rounded-lg bg-white/90 p-3 text-black shadow-lg'>
          <h3 className='mb-1 font-semibold'>{t(name) as string}</h3>
          <p className='text-sm text-black'>{t(description) as string}</p>
        </div>
      )}
    </div>
  );
};

export default AchievementCard;
