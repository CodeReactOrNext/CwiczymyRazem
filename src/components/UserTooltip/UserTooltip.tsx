import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { IconBox } from "components/IconBox/IconBox";
import Avatar from "components/UI/Avatar";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import { useTranslation } from "hooks/useTranslation";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaClock,
  FaExternalLinkAlt,
  FaFire,
  FaLeaf,
  FaMusic,
  FaTrophy,
} from "react-icons/fa";
import { useResponsiveStore } from "store/useResponsiveStore";
import { convertMsToHM } from "utils/converter";
import type { UserTooltipData } from "utils/firebase/client/firebase.utils";
import { firebaseGetUserTooltipData } from "utils/firebase/client/firebase.utils";
import { getReconciledStreak } from "utils/gameLogic";

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
  currentActivity?: {
    planTitle: string;
    exerciseTitle: string;
  } | null;
}

export const UserTooltip = ({ userId, children, currentActivity }: UserTooltipProps) => {
  const [userData, setUserData] = useState<UserTooltipData | null>(null);
  const [reconciledStreak, setReconciledStreak] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation("common");
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }
    let cancelled = false;
    const fetchData = async () => {
      const data = await firebaseGetUserTooltipData(userId);
      if (cancelled) return;
      setUserData(data);
      setLoading(false);

      // The stored `actualDayWithoutBreak` counter can drift from the truth in
      // either direction after a timezone slip; the activity log (local time) is
      // authoritative once loaded, so reconcile against it exactly like the
      // header StreakBox / profile do (see getReconciledStreak).
      if (data) {
        try {
          const logs = await firebaseGetUserRaprotsLogs(userId, "all");
          if (cancelled) return;
          const { dayWithoutBreak } = getReconciledStreak({
            actualDayWithoutBreak: data.statistics.actualDayWithoutBreak,
            lastReportDate: data.statistics.lastReportDate,
            reportDates: logs.map((log) =>
              log?.reportDate?.seconds
                ? new Date(log.reportDate.seconds * 1000)
                : null
            ),
          });
          setReconciledStreak(dayWithoutBreak);
        } catch (error) {
          console.error("Failed to reconcile tooltip streak:", error);
        }
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return <>{children}</>;

  const panel = (
    <>
      {loading ? (
            <div className='h-24 w-56 animate-pulse rounded-lg bg-gray-100' />
          ) : userData ? (
            <div className='relative flex flex-col gap-5 text-gray-900'>
               {/* Activity Section */}
               {currentActivity && (
                <div className="relative z-10 mb-2 p-3 rounded-lg bg-cyan-50 border border-cyan-100">
                  <div className="flex items-center gap-2 text-cyan-600 font-bold text-[12px]  mb-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    Live Now
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-cyan-100 text-cyan-600">
                      <FaMusic className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium">Practicing:</p>
                      <p className="text-xs font-bold text-gray-900 leading-tight">{currentActivity.exerciseTitle}</p>
                      <p className="text-[10px] text-gray-400 italic mt-0.5">{currentActivity.planTitle}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className='relative z-10 flex items-center gap-8'>
                {userData.avatar ? (
                  <Avatar
                    name={userData.displayName}
                    avatarURL={userData.avatar}
                    size='sm'
                    lvl={userData.statistics.level}
                    selectedGuitar={userData.selectedGuitar}
                    guitarYear={userData.selectedGuitarYear}
                    guitarCountry={userData.selectedGuitarCountry}
                  />
                ) : (
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-900'>
                    {userData.displayName?.[0] ?? "?"}
                  </div>
                )}
                <div>
                  <h3 className='text-base font-bold text-gray-900'>
                    {userData.displayName}
                  </h3>
                </div>
              </div>
              <div className='relative z-10 grid grid-cols-2 gap-2'>
                <StatsBox
                  Icon={FaClock}
                  label={t("tooltip.totalTime")}
                  value={`${convertMsToHM(
                    userData.statistics.totalPracticeTime
                  )}h`}
                />
                <StatsBox
                  Icon={() => <img src="/images/points.png" alt="points" className="h-5 w-5 object-contain" />}
                  label={t("tooltip.points")}
                  value={userData.statistics.totalPoints}
                />
                <StatsBox
                  Icon={FaTrophy}
                  label={"Lvl"}
                  value={userData.statistics.level}
                />
                <StatsBox
                  Icon={() => <img src="/images/coin.png" alt="coin" className="h-5 w-5 object-contain" />}
                  label={"Fame"}
                  value={userData.statistics.fame}
                />
                <StatsBox
                  Icon={FaFire}
                  label={t("tooltip.actual_streak")}
                  value={reconciledStreak ?? userData.statistics.actualDayWithoutBreak}
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

              <Link
                href={`/user/${userId}`}
                className='relative z-10 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-700'
              >
                {t("tooltip.viewProfile")}
                <FaExternalLinkAlt className='text-[10px]' />
              </Link>

              {/* Guitar Absolute */}
              {(() => {
                const lvl = userData.statistics.level ?? 0;
                const imgPath = userData.selectedGuitar ?? (lvl >= IMG_RANKS_NUMBER ? IMG_RANKS_NUMBER : lvl);
                const isSpecial = typeof imgPath === "string" && imgPath.includes("special/");

                if (isSpecial) {
                  return (
                    <img
                      className='absolute top-1/2 -right-[143px] -translate-y-1/2 w-64 h-64 object-contain -rotate-90 drop-shadow-2xl z-20 pointer-events-none'
                      src={getRankBadgeSrc(imgPath, "small")}
                      alt='equipped guitar'
                    />
                  );
                }
                return null;
              })()}
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
    </>
  );

  // Touch devices: tap opens the stats card in a centered modal instead of
  // navigating straight to the profile (hover tooltips don't fire on touch).
  if (isMobile) {
    return (
      <>
        <span
          className="contents"
          onClickCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {children}
        </span>
        {open && typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            >
              <div
                className="relative w-full max-w-[340px] overflow-hidden rounded-xl border border-gray-100 bg-white/95 p-4 shadow-2xl backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900/80 text-gray-200 shadow-lg hover:text-white"
                >
                  <X size={15} />
                </button>
                {panel}
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className='rounded-xl bg-white/95 p-4 shadow-2xl border border-gray-100 backdrop-blur-md overflow-visible'>
          {panel}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
