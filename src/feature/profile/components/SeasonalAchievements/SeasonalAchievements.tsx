import type { SeasonalAchievement } from "feature/profile/services/seasonalAchievementsService";
import { getUserSeasonalAchievements } from "feature/profile/services/seasonalAchievementsService";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaAward,
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
  FaMedal,
  FaStar,
  FaTrophy,
} from "react-icons/fa";

interface SeasonalAchievementProps {
  userId?: string;
  className?: string;
}

const SeasonalAchievements = ({
  userId,
  className = "",
}: SeasonalAchievementProps) => {
  const { t, i18n } = useTranslation("profile");
  const [activeIndex, setActiveIndex] = useState(0);
  const [achievements, setAchievements] = useState<SeasonalAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const maxVisibleItems = 6;
  const totalItems = achievements.length;

  const formatSeasonId = (seasonId: string): string => {
    const parts = seasonId.split("-");
    if (parts.length === 2) {
      const [year, month] = parts;
      const monthNumber = parseInt(month);

      const monthNamesEn = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const monthNamesPl = [
        "Styczeń",
        "Luty",
        "Marzec",
        "Kwiecień",
        "Maj",
        "Czerwiec",
        "Lipiec",
        "Sierpień",
        "Wrzesień",
        "Październik",
        "Listopad",
        "Grudzień",
      ];

      const monthNames = i18n.language === "pl" ? monthNamesPl : monthNamesEn;
      const monthName = monthNames[monthNumber - 1];

      return `${monthName} ${year}`;
    }
    return seasonId;
  };

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const userAchievements = await getUserSeasonalAchievements(userId);
        setAchievements(userAchievements);
      } catch (error) {
        console.error("Failed to fetch seasonal achievements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [userId]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1 >= totalItems ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 < 0 ? totalItems - 1 : prev - 1));
  };

  const getVisibleAchievements = () => {
    const visibleItems = [];
    const itemsToShow = Math.min(maxVisibleItems, totalItems);

    for (let i = 0; i < itemsToShow; i++) {
      const index = (activeIndex + i) % totalItems;
      visibleItems.push(achievements[index]);
    }
    return visibleItems;
  };

  const getAchievementIcon = (place: number) => {
    switch (place) {
      case 1:
        return <FaTrophy size={22} />;
      case 2:
        return <FaMedal size={22} />;
      case 3:
        return <FaMedal size={22} />;
      case 4:
        return <FaAward size={20} />;
      case 5:
        return <FaStar size={20} />;
      default:
        return null;
    }
  };

  const getOrdinalSuffix = (place: number) => {
    if (place === 1) return "st";
    if (place === 2) return "nd";
    if (place === 3) return "rd";
    return "th";
  };

  const getAchievementStyles = (place: number) => {
    switch (place) {
      case 1:
        return {
          background:
            "bg-gradient-to-r from-amber-700/90 via-yellow-600 to-amber-700/90",
          glow: "after:absolute after:inset-0 after:rounded-md after:bg-yellow-500/20 after:blur-md after:opacity-70 after:-z-10",
          iconGlow: "shadow-[0_0_8px_rgba(252,211,77,0.7)]",
          iconBg: "bg-gradient-to-br from-amber-500/30 to-yellow-600/40",
          iconColor: "text-yellow-300",
          borderAccent: "border-amber-500/80",
          crown: true,
        };
      case 2:
        return {
          background:
            "bg-gradient-to-r from-gray-700/90 via-gray-600 to-gray-700/90",
          glow: "",
          iconGlow: "shadow-[0_0_6px_rgba(209,213,219,0.5)]",
          iconBg: "bg-gradient-to-br from-gray-500/30 to-gray-600/40",
          iconColor: "text-gray-200",
          borderAccent: "border-gray-400/70",
          crown: false,
        };
      case 3:
        return {
          background:
            "bg-gradient-to-r from-amber-900/90 via-amber-800 to-amber-900/90",
          glow: "",
          iconGlow: "shadow-[0_0_6px_rgba(217,119,6,0.5)]",
          iconBg: "bg-gradient-to-br from-amber-600/30 to-amber-700/40",
          iconColor: "text-amber-400",
          borderAccent: "border-amber-600/70",
          crown: false,
        };
      case 4:
        return {
          background:
            "bg-gradient-to-r from-blue-900/90 via-blue-800 to-blue-900/90",
          glow: "",
          iconGlow: "",
          iconBg: "bg-gradient-to-br from-blue-700/30 to-blue-800/40",
          iconColor: "text-blue-400",
          borderAccent: "border-blue-600/70",
          crown: false,
        };
      case 5:
        return {
          background:
            "bg-gradient-to-r from-blue-900/90 via-blue-800 to-blue-900/90",
          glow: "",
          iconGlow: "",
          iconBg: "bg-gradient-to-br from-blue-700/30 to-blue-800/40",
          iconColor: "text-blue-400",
          borderAccent: "border-blue-600/70",
          crown: false,
        };
      default:
        return {
          background:
            "bg-gradient-to-r from-zinc-800/90 via-zinc-700 to-zinc-800/90",
          glow: "",
          iconGlow: "",
          iconBg: "bg-gradient-to-br from-zinc-600/30 to-zinc-700/40",
          iconColor: "text-zinc-400",
          borderAccent: "border-zinc-500/70",
          crown: false,
        };
    }
  };

  const visibleAchievements = getVisibleAchievements();

  if (!loading && achievements.length === 0) {
    return (
      <div className={`content-box font-openSans ${className}`}>
        <h3 className='mb-4 text-sm font-semibold text-zinc-200'>
          {t("seasonal_achievements.title", "Osiągnięcia Sezonowe")}
        </h3>
        <div className='py-2 text-center text-sm text-zinc-400'>
          {t(
            "seasonal_achievements.no_achievements",
            "Brak osiągnięć sezonowych"
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`content-box font-openSans ${className}`}>
        <h3 className='mb-4 text-sm font-semibold text-zinc-200'>
          {t("seasonal_achievements.title", "Osiągnięcia Sezonowe")}
        </h3>
        <div className='py-2 text-center text-sm text-zinc-400'>
          <span className='animate-pulse'>Ładowanie...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`content-box   font-openSans ${className}`}>
      <div className='mb-3 flex items-center gap-2'>
        <h4 className='text-sm font-medium text-zinc-300'>
          {t("seasonal_achievements.title", "Osiągnięcia Sezonowe")}
        </h4>
        <div className='h-px flex-1 bg-second-400/20'></div>
      </div>

      <div className='flex flex-wrap gap-2'>
        {visibleAchievements.map((achievement, idx) => {
          const styles = getAchievementStyles(achievement.place);
          const displaySeasonName = formatSeasonId(achievement.seasonId);

          return (
            <div
              key={`${achievement.seasonId}-${idx}`}
              className='inline-flex items-center gap-2 rounded-md border border-second-400/15 bg-second-500/15 px-3 py-2 text-xs transition-all duration-200 hover:bg-second-500/25'>
              <div className='relative'>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${styles.iconBg} ${styles.iconColor}`}>
                  {getAchievementIcon(achievement.place)}
                </div>
                {styles.crown && (
                  <FaCrown
                    className='absolute -right-0.5 -top-0.5 text-yellow-400'
                    size={8}
                  />
                )}
              </div>

              <div className='flex items-center gap-1.5'>
                <span className={`font-semibold ${styles.iconColor}`}>
                  {achievement.place}
                  <sup className='text-[10px]'>
                    {getOrdinalSuffix(achievement.place)}
                  </sup>
                </span>
                <span className='text-zinc-400'>•</span>
                <span className='max-w-20 truncate font-medium text-zinc-200'>
                  {displaySeasonName}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalItems > maxVisibleItems && (
        <div className='mt-6 flex justify-center gap-3'>
          <button
            onClick={handlePrev}
            className='rounded-lg border border-second-400/30 bg-second-500/20 p-2.5 text-zinc-300 shadow-sm transition-all duration-200 hover:bg-second-500/40 hover:text-white'>
            <FaChevronLeft size={14} />
          </button>
          <button
            onClick={handleNext}
            className='rounded-lg border border-second-400/30 bg-second-500/20 p-2.5 text-zinc-300 shadow-sm transition-all duration-200 hover:bg-second-500/40 hover:text-white'>
            <FaChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SeasonalAchievements;
