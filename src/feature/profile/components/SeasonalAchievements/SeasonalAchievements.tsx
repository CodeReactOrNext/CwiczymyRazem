import { Card } from "assets/components/ui/card";
import type { SeasonalAchievement } from "feature/profile/services/seasonalAchievementsService";
import { getUserSeasonalAchievements } from "feature/profile/services/seasonalAchievementsService";
import { 
  Award as AwardIcon,
  Medal as MedalIcon,
  Trophy as TrophyIcon, 
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaCrown,
  FaExternalLinkAlt,
  FaRegStar as FaStar,
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
        return <TrophyIcon size={28} strokeWidth={1.2} />;
      case 2:
        return <MedalIcon size={26} strokeWidth={1.2} />;
      case 3:
        return <MedalIcon size={26} strokeWidth={1.2} />;
      case 4:
        return <AwardIcon size={24} strokeWidth={1.2} />;
      default:
        return <FaStar size={18} />;
    }
  };


  const getAchievementStyles = (place: number) => {
    switch (place) {
      case 1:
        return {
          iconColor: "text-amber-400",
          crown: true,
        };
      case 2:
        return {
          iconColor: "text-zinc-300",
          crown: false,
        };
      case 3:
        return {
          iconColor: "text-orange-400",
          crown: false,
        };
      case 4:
        return {
          iconColor: "text-blue-400",
          crown: false,
        };
      default:
        return {
          iconColor: "text-zinc-500",
          crown: false,
        };
    }
  };

  const visibleAchievements = getVisibleAchievements();

  if (!loading && achievements.length === 0) {
    return (
      <Card className='border-white/5 bg-zinc-900/60 p-6 backdrop-blur-md'>
        <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
          <div>
            <h4 className='text-lg font-bold text-white'>
              {String(t("seasonal_achievements.title", "Osiągnięcia Sezonowe"))}
            </h4>
            <p className='text-sm text-zinc-500'>
              {String(t("seasonal_achievements.no_achievements", "Brak osiągnięć. Walcz o miejsce w rankingu!"))}
            </p>
          </div>
          <Link
            href='/seasons'
            className='flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-6 py-2 text-sm font-bold text-cyan-400 transition-all hover:bg-cyan-500/20 hover:border-cyan-500/50'>
            CHECK SEASONS
            <FaExternalLinkAlt size={12} />
          </Link>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className='relative overflow-hidden border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl'>
        <h4 className='mb-4 text-lg font-bold text-white'>
          {String(t("seasonal_achievements.title", "Osiągnięcia Sezonowe"))}
        </h4>
        <div className='py-8 text-center text-sm text-white/50'>
          <span className='tracking-widest uppercase font-bold text-[10px]'>Synchronizing...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className='relative overflow-hidden border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl'>
      {/* Background decoration */}
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent)]' />

      <div className='relative mb-8 flex items-center justify-between'>
        <h4 className='text-lg font-bold text-white'>
          {String(t("seasonal_achievements.title", "Osiągnięcia Sezonowe"))}
        </h4>
        <div className='flex items-center gap-4'>
          <Link
            href='/seasons'
            className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors'>
            SEASONS TABLE
            <FaExternalLinkAlt size={10} />
          </Link>
        </div>
      </div>

      <div className='no-scrollbar relative flex gap-4 overflow-x-auto pb-4 pt-4'>
        {achievements.map((achievement, idx) => {
          const styles = getAchievementStyles(achievement.place);
          const displaySeasonName = formatSeasonId(achievement.seasonId);

          return (
            <div
              key={`${achievement.seasonId}-${idx}`}
              className='relative flex min-w-[110px] flex-col items-center'>
              
              {/* The Trophy Container - No overflow-hidden here to avoid clipping the seal */}
              <div className='relative flex h-28 w-full flex-col items-center justify-center'>
                
                {/* Pick Body with Shape and Background */}
                <div className='absolute inset-0 rounded-t-[1.2rem] rounded-b-[50%_25%] border border-white/10 bg-zinc-900/40 shadow-[0_10px_25px_-8px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden'>
                  {/* Metallic Shine Overlay */}
                  <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.05]' />
                  {/* Top highlight line */}
                  <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent' />
                  {/* Inner Bezel */}
                  <div className='absolute inset-1 rounded-t-[1.1rem] rounded-b-[48%_22%] border border-white/[0.02] bg-gradient-to-b from-white/[0.01] to-transparent' />
                </div>

                {/* Rank Seal - Outside the overflow-hidden body */}
                <div className='absolute -top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-zinc-950 shadow-[0_2px_10px_rgba(0,0,0,0.8)] z-20'>
                  <span className={`text-[11px] font-black leading-none drop-shadow-[0_0_5px_currentColor] ${styles.iconColor}`}>
                    {achievement.place}
                  </span>
                </div>

                {/* Trophy Content */}
                <div className='relative z-10 flex flex-col items-center justify-center pt-2'>
                  <div className={`${styles.iconColor} drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]`}>
                    {getAchievementIcon(achievement.place)}
                    {styles.crown && (
                      <FaCrown
                        className='absolute -right-2.5 -top-2.5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        size={12}
                      />
                    )}
                  </div>
                </div>

                {/* Vertical accent bars for podium - slightly larger and more prominent */}
                {achievement.place <= 3 && (
                  <div className={`absolute bottom-0 h-1 w-1/3 rounded-full blur-[3px] opacity-40 ${
                    achievement.place === 1 ? 'bg-amber-500' : achievement.place === 2 ? 'bg-zinc-300' : 'bg-orange-600'
                  }`} />
                )}
              </div>

              {/* Plaque / Label */}
              <div className='mt-3 flex w-full flex-col items-center text-center'>
                <div className='h-[1.5px] w-5 rounded-full bg-zinc-800' />
                <span className='mt-2 text-[8px] font-black uppercase tracking-[0.15em] text-zinc-500'>
                  {displaySeasonName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default SeasonalAchievements;
