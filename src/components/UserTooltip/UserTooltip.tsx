import { buttonVariants } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { resolveLiveActivity } from "components/OnlineUsers/liveActivity";
import Avatar from "components/UI/Avatar";
import { AvatarDecoration } from "feature/cosmetics/components/AvatarDecoration";
import { findAvatarEffect } from "feature/cosmetics/data/cosmeticsCatalog";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import { useCommunityDrawer } from "feature/logsBox/hooks/useCommunityDrawer";
import { SupportBadge } from "feature/supportTeam/components/SupportBadge";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { useTranslation } from "hooks/useTranslation";
import type { ActivityPreview } from "layouts/LogsBoxLayout/components/Logs/ActivityStartModal";
import { Clock, ExternalLink, Flame, Leaf, Music, Trophy,X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useResponsiveStore } from "store/useResponsiveStore";
import type { CurrentActivityInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";
import type { UserTooltipData } from "utils/firebase/client/firebase.utils";
import { firebaseGetUserTooltipData } from "utils/firebase/client/firebase.utils";
import { getReconciledStreak, hasRestDays } from "utils/gameLogic";

const StatsBox = ({
  Icon,
  label,
  value,
}: {
  Icon: any;
  label: string;
  value: string | number;
}) => (
  <div className='flex items-center gap-2 rounded-lg bg-black/5 p-2'>
    {/* Not IconBox: its themer text colour is white, lost on the white card. */}
    <span className='m-1 mx-2 flex h-5 w-5 shrink-0 items-center justify-center text-sm text-black/70'>
      <Icon size='1em' />
    </span>
    <div>
      <p className='text-xs font-medium text-black/60'>{label}</p>
      <p className='text-sm font-bold'>{value}</p>
    </div>
  </div>
);
/** A name in the "Live now" card that opens what it names. */
const LIVE_LINK_CLASS =
  "block text-left underline decoration-black/30 decoration-dotted underline-offset-4 transition-colors hover:text-cyan-700 hover:decoration-cyan-600";

interface UserTooltipProps {
  userId: string | null;
  children: React.ReactNode;
  currentActivity?: CurrentActivityInterface | null;
  /** Opens what the player is practicing right now. Without it the card only names it. */
  onOpenActivity?: (preview: ActivityPreview) => void;
  /**
   * Id of the avatar decoration the player wears, where the opening row already
   * knows it (the activity feed). The card draws it round its own avatar.
   */
  avatarEffect?: string | null;
}

export const UserTooltip = ({
  userId,
  children,
  currentActivity,
  onOpenActivity,
  avatarEffect,
}: UserTooltipProps) => {
  const decoration = findAvatarEffect(avatarEffect);
  const [userData, setUserData] = useState<UserTooltipData | null>(null);
  const [reconciledStreak, setReconciledStreak] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation(["common", "ui"]);
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [open, setOpen] = useState(false);
  // The card is a hover/tap surface and the feeds using it render a dozen at a
  // time — fetching on mount meant a user doc plus that user's whole exerciseData
  // collection per row, for cards nobody opens. Load on first open instead.
  const [hasOpened, setHasOpened] = useState(false);
  const { getSupportMember } = useSupportTeam();
  const supportMember = getSupportMember(userId);

  useEffect(() => {
    if (!userId || !hasOpened) {
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
            restDays: hasRestDays(data.statistics),
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
  }, [userId, hasOpened]);

  if (!userId) return <>{children}</>;

  const live = currentActivity ? resolveLiveActivity(currentActivity) : null;
  const currentPreview =
    onOpenActivity && live?.current && "preview" in live.current
      ? live.current.preview
      : null;
  const currentHref =
    live?.current && "href" in live.current ? live.current.href : null;
  const planPreview = onOpenActivity ? (live?.plan ?? null) : null;
  // The card closes first: on a phone it sits above everything, the preview included.
  const openActivity = (preview: ActivityPreview) => {
    setOpen(false);
    onOpenActivity?.(preview);
  };

  const panel = (
    <>
      {loading ? (
            <Skeleton className='h-24 w-56 rounded-lg' />
          ) : userData ? (
            <div className='relative flex flex-col gap-5'>
               {/* Activity Section */}
               {currentActivity && (
                <div className="relative z-10 mb-2 p-3 rounded-lg bg-cyan-500/10">
                  <div className="flex items-center gap-2 text-cyan-700 font-bold text-xs mb-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    {t("ui:live_now")}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-cyan-500/10 text-cyan-700">
                      <Music className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-black/60 font-medium">Practicing:</p>
                      {currentPreview ? (
                        <button
                          type="button"
                          onClick={() => openActivity(currentPreview)}
                          className={cn("text-xs font-bold leading-tight", LIVE_LINK_CLASS)}>
                          {currentActivity.exerciseTitle}
                        </button>
                      ) : currentHref ? (
                        <Link
                          href={currentHref}
                          onClick={() => {
                            setOpen(false);
                            // The page would otherwise open under the Community drawer.
                            useCommunityDrawer.getState().setOpen(false);
                          }}
                          className={cn("text-xs font-bold leading-tight", LIVE_LINK_CLASS)}>
                          {currentActivity.exerciseTitle}
                        </Link>
                      ) : (
                        <p className="text-xs font-bold leading-tight">{currentActivity.exerciseTitle}</p>
                      )}
                      {/* A single exercise runs inside a plan named after it — no need to say it twice. */}
                      {currentActivity.planTitle !== currentActivity.exerciseTitle &&
                        (planPreview ? (
                          <button
                            type="button"
                            onClick={() => openActivity(planPreview)}
                            className={cn("mt-0.5 text-xs italic text-black/60", LIVE_LINK_CLASS)}>
                            {currentActivity.planTitle}
                          </button>
                        ) : (
                          <p className="text-xs text-black/60 italic mt-0.5">{currentActivity.planTitle}</p>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div className='relative z-10 flex items-center gap-8'>
                {/* The decoration overflows the avatar, so it gets a margin to grow into. */}
                <div className={cn("flex shrink-0", decoration && "m-3")}>
                  <AvatarDecoration item={decoration}>
                    {userData.avatar ? (
                      <Avatar
                        name={userData.displayName}
                        avatarURL={userData.avatar}
                        size='sm'
                      />
                    ) : (
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-lg font-bold'>
                        {userData.displayName?.[0] ?? "?"}
                      </div>
                    )}
                  </AvatarDecoration>
                </div>
                <div className='flex flex-col items-start gap-1.5'>
                  <h3 className='flex items-center gap-2 text-base font-bold'>
                    {userData.displayName}
                    {/* The card is portalled out of whatever row opened it, so
                        the tag may carry its own link here. */}
                    <GuildTagBadge badge={userData.guildBadge} />
                  </h3>
                  {supportMember && (
                    <SupportBadge member={supportMember} tone='light' />
                  )}
                </div>
              </div>
              <div className='relative z-10 grid grid-cols-2 gap-2'>
                <StatsBox
                  Icon={Clock}
                  label={t("tooltip.totalTime")}
                  value={convertMsToHM(
                    userData.statistics.totalPracticeTime
                  )}
                />
                <StatsBox
                  Icon={() => <img src="/images/tokens/pick.png" alt="points" className="h-5 w-5 object-contain" />}
                  label={t("tooltip.points")}
                  value={userData.statistics.totalPoints}
                />
                <StatsBox
                  Icon={Trophy}
                  label={"Lvl"}
                  value={userData.statistics.level}
                />
                <StatsBox
                  Icon={() => <img src="/images/tokens/coin.png" alt="coin" className="h-5 w-5 object-contain" />}
                  label={"Fame"}
                  value={userData.statistics.fame}
                />
                <StatsBox
                  Icon={Flame}
                  label={t("tooltip.actual_streak")}
                  value={reconciledStreak ?? userData.statistics.actualDayWithoutBreak}
                />
                <StatsBox
                  Icon={Music}
                  label={t("tooltip.sessions")}
                  value={userData.statistics.sessionCount}
                />
                <StatsBox
                  Icon={Leaf}
                  label={t("tooltip.habits")}
                  value={userData.statistics.habitCount}
                />
              </div>

              <Link
                href={`/user/${userId}`}
                className={cn(
                  buttonVariants({ variant: "subtle" }),
                  "relative z-10 w-full border-b-black/15 bg-black/5 font-bold text-black hover:bg-black/10 hover:text-black",
                )}
              >
                {t("tooltip.viewProfile")}
                <ExternalLink size='1em' className='text-[10px]' />
              </Link>
            </div>
          ) : (
            <div className='flex items-center gap-2 text-black/60'>
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
            setHasOpened(true);
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
                className="tooltip-ink relative w-full max-w-[340px] overflow-hidden rounded-lg bg-white p-4 text-black"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setOpen(false)}
                  aria-label={t("ui:close")}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "absolute right-2 top-2 z-30 bg-black/5 text-black/70 hover:bg-black/10 hover:text-black",
                  )}
                >
                  <X />
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
      <Tooltip
        delayDuration={200}
        // Controlled, so opening a live activity can shut the card — it sits above dialogs.
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (isOpen) setHasOpened(true);
        }}>
        <TooltipTrigger
          asChild
          // The 200ms open delay would otherwise be dead time — start fetching as
          // soon as the pointer lands, so the card is usually filled in on open.
          onPointerEnter={() => setHasOpened(true)}
          onFocus={() => setHasOpened(true)}>
          {children}
        </TooltipTrigger>
        <TooltipContent className='tooltip-ink overflow-visible p-3'>
          {panel}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
