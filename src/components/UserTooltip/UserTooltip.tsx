import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { IconBox } from "components/IconBox/IconBox";
import Avatar from "components/UI/Avatar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
  FaClock,
  FaExternalLinkAlt,
  FaFire,
  FaLeaf,
  FaMusic,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import { convertMsToHM } from "utils/converter";
import type { UserTooltipData } from "utils/firebase/client/firebase.utils";
import { firebaseGetUserTooltipData } from "utils/firebase/client/firebase.utils";

const StatsBox = ({
  Icon,
  label,
  value,
}: {
  Icon: any;
  label: string;
  value: string | number;
}) => (
  <div className='flex items-center gap-2 rounded-lg bg-gray-100 p-2'>
    <IconBox small Icon={Icon} />
    <div>
      <p className='text-xs font-medium text-gray-500'>{label}</p>
      <p className='text-sm font-bold text-gray-900'>{value}</p>
    </div>
  </div>
);
interface UserTooltipProps {
  userId: string | null;
  children: React.ReactNode;
}

export const UserTooltip = ({ userId, children }: UserTooltipProps) => {
  const [userData, setUserData] = useState<UserTooltipData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation("common");

  useEffect(() => {
    if (!userId) {
      return;
    }
    const fetchData = async () => {
      const data = await firebaseGetUserTooltipData(userId);
      setUserData(data);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  if (!userId) return <>{children}</>;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className='rounded-xl bg-white/90 p-4 shadow-2xl'>
          {loading ? (
            <div className='h-24 w-56 animate-pulse rounded-lg bg-gray-100' />
          ) : userData ? (
            <div className='flex flex-col gap-5 text-gray-900'>
              <div className='flex items-center gap-8'>
                {userData.avatar ? (
                  <Avatar
                    name={userData.displayName}
                    avatarURL={userData.avatar}
                    size='sm'
                    lvl={userData.statistics.level}
                  />
                ) : (
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-900'>
                    {userData.displayName[0]}
                  </div>
                )}
                <div>
                  <h3 className='flex items-center gap-2 text-base font-bold text-gray-900'>
                    {userData.displayName}
                    <Link href={`/user/${userId}`} className="cursor-pointer hover:text-cyan-500 transition-colors">
                      <FaExternalLinkAlt className='text-xs text-gray-400 hover:text-cyan-500' />
                    </Link>
                  </h3>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <StatsBox
                  Icon={FaClock}
                  label={t("tooltip.totalTime")}
                  value={`${convertMsToHM(
                    userData.statistics.totalPracticeTime
                  )}h`}
                />
                <StatsBox
                  Icon={FaStar}
                  label={t("tooltip.points")}
                  value={userData.statistics.totalPoints}
                />
                <StatsBox
                  Icon={FaTrophy}
                  label={"Lvl"}
                  value={userData.statistics.level}
                />
                <StatsBox
                  Icon={FaFire}
                  label={t("tooltip.actual_streak")}
                  value={userData.statistics.actualDayWithoutBreak}
                />
                <StatsBox
                  Icon={FaMusic}
                  label={t("tooltip.sessions")}
                  value={userData.statistics.sessionCount}
                />
                <StatsBox
                  Icon={FaLeaf}
                  label={t("tooltip.habits")}
                  value={userData.statistics.habitCount}
                />
              </div>
            </div>
          ) : (
            <div className='flex items-center gap-2 text-gray-500'>
              <svg
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
              <p>{t("tooltip.userNotFound")}</p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
