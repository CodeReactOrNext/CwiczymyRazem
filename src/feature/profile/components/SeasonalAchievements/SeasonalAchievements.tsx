import { Card } from "assets/components/ui/card";
import { Button } from "assets/components/ui/button";
import type { SeasonalAchievement } from "feature/profile/services/seasonalAchievementsService";
import { getUserSeasonalAchievements } from "feature/profile/services/seasonalAchievementsService";
import { useTranslation } from "hooks/useTranslation";
import { 
  Award as AwardIcon,
  Medal as MedalIcon,
  Trophy as TrophyIcon, 
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaCrown,
  FaExternalLinkAlt,
  FaRegStar as FaStar,
} from "react-icons/fa";

interface SeasonalAchievementProps {
  userId?: string;
}

const SeasonalAchievements = ({
  userId,
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


  if (!loading && achievements.length === 0) {
    return (
      <Card className='border-white/5 bg-zinc-800/40 p-6 backdrop-blur-md'>
        <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
          <div className='text-left'>
            <h4 className='text-lg font-bold text-white'>
              {String(t("seasonal_achievements.title", "Osiągnięcia Sezonowe"))}
            </h4>
            <p className='text-sm text-zinc-500'>
              {String(t("seasonal_achievements.no_achievements", "Brak osiągnięć. Walcz o miejsce w rankingu!"))}
            </p>
          </div>
          <Button
             asChild
             variant='outline'
             >
            <Link href='/seasons' className='flex items-center gap-2'>
              Check Seasons
              <FaExternalLinkAlt size={12} />
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className='relative overflow-hidden border-white/10 bg-zinc-800/40 p-6 backdrop-blur-xl'>
        <h4 className='mb-4 text-lg font-bold text-white'>
          {String(t("seasonal_achievements.title", "Osiągnięcia Sezonowe"))}
        </h4>
        <div className='py-8 text-left text-sm text-white/50'>
          <span className='tracking-widest uppercase font-bold text-[10px]'>Synchronizing...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className='relative overflow-hidden border-white/10 bg-zinc-800/40 p-6 backdrop-blur-xl'>
      {/* Background decoration */}
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent)]' />

      <div className='relative mb-6 flex items-center justify-between'>
        <h4 className='text-lg font-bold text-white'>
          {String(t("seasonal_achievements.title", "Osiągnięcia Sezonowe"))}
        </h4>
      </div>

      <div className='relative flex gap-4 overflow-x-auto pb-6 pt-4'>
        {achievements.map((achievement, idx) => {
          const styles = getAchievementStyles(achievement.place);
          const displaySeasonName = formatSeasonId(achievement.seasonId);

          return (
            <div
              key={`${achievement.seasonId}-${idx}`}
              className='relative flex min-w-[110px] flex-col items-center'>
              
              {/* The Trophy Container */}
              <div className='relative flex h-[100px] w-full flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-300'>
                
                {/* Body with Shape and Background */}
                <div className='absolute inset-0 rounded-[1.2rem] border border-white/10 bg-zinc-900/60 shadow-lg backdrop-blur-md overflow-hidden'>
                  {/* Metallic Shine Overlay */}
                  <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.08]' />
                  {/* Top highlight line */}
                  <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent' />
                  {/* Inner Bezel */}
                  <div className='absolute inset-1 rounded-[1.1rem] border border-white/[0.03] bg-gradient-to-b from-white/[0.02] to-transparent' />
                </div>

                {/* Rank Seal - Outside the overflow-hidden body */}
                <div className='absolute -top-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-zinc-800 shadow-md z-20'>
                  <span className={`text-[12px] font-bold leading-none ${styles.iconColor}`}>
                    {achievement.place}
                  </span>
                </div>

                {/* Trophy Content */}
                <div className='relative z-10 flex flex-col items-center justify-center pt-1'>
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

                {/* Vertical accent bars for podium */}
                {achievement.place <= 3 && (
                  <div className={`absolute bottom-0 h-[2px] w-1/2 rounded-t-lg blur-[2px] opacity-60 ${
                    achievement.place === 1 ? 'bg-amber-400' : achievement.place === 2 ? 'bg-zinc-300' : 'bg-orange-400'
                  }`} />
                )}
              </div>

              {/* Plaque / Label */}
              <div className='mt-3 flex w-full flex-col items-center text-center'>
                <span className='text-[10px] font-medium tracking-wide text-zinc-400 capitalize'>
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
