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
          iconBg: "bg-gradient-to-br from-yellow-500/20 to-amber-500/20",
          iconColor: "text-yellow-400",
          crown: true,
        };
      case 2:
        return {
          iconBg: "bg-gradient-to-br from-gray-500/20 to-slate-500/20",
          iconColor: "text-gray-300",
          crown: false,
        };
      case 3:
        return {
          iconBg: "bg-gradient-to-br from-amber-600/20 to-orange-600/20",
          iconColor: "text-amber-400",
          crown: false,
        };
      case 4:
        return {
          iconBg: "bg-gradient-to-br from-blue-600/20 to-indigo-600/20",
          iconColor: "text-blue-400",
          crown: false,
        };
      case 5:
        return {
          iconBg: "bg-gradient-to-br from-purple-600/20 to-violet-600/20",
          iconColor: "text-purple-400",
          crown: false,
        };
      default:
        return {
          iconBg: "bg-gradient-to-br from-white/10 to-white/5",
          iconColor: "text-white/60",
          crown: false,
        };
    }
  };

  const visibleAchievements = getVisibleAchievements();

  if (!loading && achievements.length === 0) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70 p-6 shadow-lg backdrop-blur-xl ${className}`}>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-transparent to-zinc-800/20'></div>
        <div className='relative'>
          <h3 className='mb-4 text-lg font-bold text-white'>
            {t("seasonal_achievements.title", "Osiągnięcia Sezonowe")}
          </h3>
          <div className='py-4 text-center text-sm text-white/70'>
            {t(
              "seasonal_achievements.no_achievements",
              "Brak osiągnięć sezonowych"
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70 p-6 shadow-lg backdrop-blur-xl ${className}`}>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-transparent to-zinc-800/20'></div>
        <div className='relative'>
          <h3 className='mb-4 text-lg font-bold text-white'>
            {t("seasonal_achievements.title", "Osiągnięcia Sezonowe")}
          </h3>
          <div className='py-4 text-center text-sm text-white/70'>
            <span className='animate-pulse'>Ładowanie...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70 p-6 shadow-lg backdrop-blur-xl ${className}`}>
      {/* Background effects */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-transparent to-zinc-800/20'></div>

      <div className='relative'>
        <div className='mb-6 flex items-center justify-between'>
          <h4 className='text-lg font-bold text-white'>
            {t("seasonal_achievements.title", "Osiągnięcia Sezonowe")}
          </h4>
          <div className='text-xs text-white/70'>
            {achievements.length} osiągnięć
          </div>
        </div>

        <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8'>
          {visibleAchievements.map((achievement, idx) => {
            const styles = getAchievementStyles(achievement.place);
            const displaySeasonName = formatSeasonId(achievement.seasonId);

            return (
              <div
                key={`${achievement.seasonId}-${idx}`}
                className='group relative overflow-hidden rounded-lg border border-zinc-700/30 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-2 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-zinc-600/40 hover:shadow-lg'>
                {/* Background gradient based on place */}
                <div
                  className={`pointer-events-none absolute inset-0 opacity-15 ${
                    achievement.place === 1
                      ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/20"
                      : achievement.place === 2
                      ? "bg-gradient-to-br from-gray-400/20 to-slate-400/20"
                      : achievement.place === 3
                      ? "bg-gradient-to-br from-amber-600/20 to-orange-600/20"
                      : "bg-gradient-to-br from-blue-500/10 to-purple-500/10"
                  }`}></div>

                <div className='relative flex flex-col items-center gap-1'>
                  <div className='relative'>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md ${styles.iconBg} ${styles.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                      {getAchievementIcon(achievement.place)}
                    </div>
                    {styles.crown && (
                      <FaCrown
                        className='absolute -right-0.5 -top-0.5 text-yellow-400 drop-shadow-sm'
                        size={10}
                      />
                    )}
                    {/* Glow effect for top 3 */}
                    {achievement.place <= 3 && (
                      <div
                        className={`absolute inset-0 rounded-full opacity-20 blur-sm ${
                          achievement.place === 1
                            ? "bg-yellow-400"
                            : achievement.place === 2
                            ? "bg-gray-300"
                            : "bg-amber-500"
                        }`}></div>
                    )}
                  </div>

                  <div className='text-center'>
                    <div
                      className={`text-sm font-bold ${styles.iconColor} drop-shadow-sm`}>
                      {achievement.place}
                      <sup className='text-[10px] opacity-80'>
                        {getOrdinalSuffix(achievement.place)}
                      </sup>
                    </div>
                    <div className='truncate text-[10px] font-medium text-white/70 drop-shadow-sm'>
                      {displaySeasonName}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalItems > maxVisibleItems && (
          <div className='mt-4 flex justify-center gap-2'>
            <button
              onClick={handlePrev}
              className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/40 bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 text-white/70 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-zinc-600/50 hover:bg-gradient-to-br hover:from-zinc-700/60 hover:to-zinc-800/60 hover:text-white'>
              <FaChevronLeft size={12} />
            </button>
            <button
              onClick={handleNext}
              className='flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/40 bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 text-white/70 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-zinc-600/50 hover:bg-gradient-to-br hover:from-zinc-700/60 hover:to-zinc-800/60 hover:text-white'>
              <FaChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalAchievements;
