import { Chip, getChipCustomStyle } from "assets/components/ui/chip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { OnlineUsers } from "components/OnlineUsers/OnlineUsers";
import Avatar from "components/UI/Avatar";
import { HeroPattern } from "components/UI/HeroBanner";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { formatDistanceToNow } from "date-fns";
import AchievementIcon from "feature/achievements/components/AchievementIcon";
import { EffectCard } from "feature/arsenal/components/GuitarInventory/EffectCard";
import { GuitarCard } from "feature/arsenal/components/GuitarInventory/GuitarCard";
import { EFFECT_DEFINITIONS, EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectLevel } from "feature/arsenal/data/effectStats";
import { GUITAR_DEFINITIONS, GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemLevel } from "feature/arsenal/data/itemStats";
import type { EffectInventoryItem, InventoryItem } from "feature/arsenal/types/arsenal.types";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
// challengesList removed
import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";
import { EarTrainingLeaderboardDialog } from "feature/exercisePlan/components/EarTrainingLeaderboardDialog";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { LEGACY_EXERCISE_TITLES } from "feature/exercisePlan/data/legacyExerciseTitles";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { LogReaction } from "feature/logs/components/LogReaction";
import { useUnreadMessages } from "feature/logs/hooks/useUnreadMessages";
import type {
  FirebaseLogsCaseOpenInterface,
  FirebaseLogsDailyQuestInterface,
  FirebaseLogsDonationInterface,
  FirebaseLogsExamPassedInterface,
  FirebaseLogsInterface,
  FirebaseLogsMarketplaceInterface,
  FirebaseLogsMarketplacePurchaseInterface,
  FirebaseLogsPlaylistInterface,
  FirebaseLogsRecordingsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsSupportAskInterface,
  FirebaseLogsTopPlayersInterface,
} from "feature/logs/types/logs.type";
import { calculateGroupFame } from "feature/logs/utils/activityFame";
import {
  type AnyFirebaseLog,
  getLogActivityType,
  groupConsecutiveLogs,
  type LogActivityType,
  type LogGroup,
} from "feature/logs/utils/groupConsecutiveLogs";
import {
  getGroupAwardedFame,
  getGroupReactionAnchor,
  getGroupReactors,
} from "feature/logs/utils/groupReactions";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import { type SongTierInfo, useSongTiers } from "feature/songs/hooks/useSongTiers";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { getSupportVariantCopy } from "feature/support/content/supportVariants";
import { SupportAvatarRing } from "feature/supportTeam/components/SupportAvatarRing";
import { SupportBadge } from "feature/supportTeam/components/SupportBadge";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { useTranslation } from "hooks/useTranslation";
import { ActivityStartModal } from "layouts/LogsBoxLayout/components/Logs/ActivityStartModal";
import {
  Clock,
  Coffee,
  Dumbbell,
  Ear,
  ExternalLink,
  Gift,
  GraduationCap,
  Heart,
  ListChecks,
  Music,
  PartyPopper,
  ShoppingCart,
  Star,
  Tag,
  Target,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FaTrophy,
} from "react-icons/fa";
import { IoCalendarOutline } from "react-icons/io5";
import { useResponsiveStore } from "store/useResponsiveStore";
import { addZeroToTime } from "utils/converter";

/** Compact practice duration shown next to the points in a feed row — "1h 20m", "45m",
 * or seconds for sub-minute sessions (so a short drill never reads as "0m"). */
const formatSessionTime = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return `${Math.round(ms / 1000)}s`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const getLogTimestampMs = (log: AnyFirebaseLog): number =>
  new Date((log as any).timestamp ?? (log as any).data).getTime();

/** Splits a rolled inventory instance into its guitar/effect shape and resolves its level,
 * so arsenal feed rows can hand the full card to `ItemPill`. */
const resolveRolledItem = (rolled: InventoryItem | EffectInventoryItem | undefined) => {
  const rolledGuitar = rolled && "guitarId" in rolled ? rolled : null;
  const rolledEffect = rolled && "effectId" in rolled ? rolled : null;
  let level: number | null = null;

  if (rolledGuitar) {
    const def = GUITARS_BY_ID.get(rolledGuitar.guitarId);
    if (def) level = getItemLevel(rolledGuitar, def);
  } else if (rolledEffect) {
    const def = EFFECTS_BY_ID.get(rolledEffect.effectId);
    if (def) level = getEffectLevel(rolledEffect, def);
  }

  return { rolledGuitar, rolledEffect, level };
};

const PLAYLIST_KIND_LABEL: Record<string, string> = {
  playlist: "playlist",
  path: "learning path",
  top: "top 10",
};

const RARITY_COLORS: Record<string, string> = {
  Common: "#9ca3af",
  Uncommon: "#4ade80",
  Rare: "#60a5fa",
  Epic: "#c084fc",
  Legendary: "#fb923c",
  Mythic: "#f43f5e",
};

const ItemTooltipCard = ({
  itemType,
  itemName,
  itemBrand,
  itemRarity,
  itemImageId,
}: {
  itemType: "guitar" | "effect";
  itemName: string;
  itemBrand: string;
  itemRarity: string;
  itemImageId: number | string;
}) => {
  const color = RARITY_COLORS[itemRarity] || RARITY_COLORS.Common;
  const imgSrc = itemType === "guitar"
    ? getRankBadgeSrc(itemImageId, "small")
    : `/static/images/effects/${itemImageId}.png`;

  const guitarDef = itemType === "guitar"
    ? GUITAR_DEFINITIONS.find((g) => g.imageId === itemImageId)
    : null;
  const effectDef = itemType === "effect"
    ? EFFECT_DEFINITIONS.find((e) => e.imageId === itemImageId)
    : null;

  return (
    <div
      className="flex flex-col w-44 overflow-hidden rounded-xl"
      style={{ border: `1px solid ${color}50`, background: "#111" }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-[10px] font-bold tracking-wide" style={{ color: `${color}cc` }}>{itemBrand}</p>
        <p className="text-sm font-bold text-white leading-tight">{itemName}</p>
        <span
          className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
          style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
        >
          {itemRarity}
        </span>
      </div>

      {/* Image */}
      <div className="relative flex items-end justify-center px-3 py-4 mx-2 my-2 rounded-lg overflow-hidden">
        {/* Subtle structural grid */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: [
              `linear-gradient(${color} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${color} 1px, transparent 1px)`,
            ].join(","),
            backgroundSize: "22px 22px",
            opacity: 0.04,
          }}
        />
        {/* Neutral spotlight so dark items separate from the background */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)` }}
        />
        {/* Rarity glow */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${color}18 0%, transparent 70%)` }}
        />
        <img
          src={imgSrc}
          alt={itemName}
          className={`relative z-10 object-contain drop-shadow-xl ${itemType === "guitar" ? "h-36 w-auto -rotate-90" : "h-24 w-24"}`}
        />
      </div>

      {/* Footer */}
      {(guitarDef || effectDef) && (
        <div
          className="flex items-center justify-between px-3 py-2 text-[10px] text-gray-400"
          style={{ borderTop: `1px solid ${color}20`, background: `${color}08` }}
        >
          {guitarDef && (
            <>
              <span className="font-semibold text-gray-300">{guitarDef.yearFrom}</span>
              <span className="text-gray-500 uppercase tracking-widest text-[9px]">
                {guitarDef.countries[0]}
              </span>
            </>
          )}
          {effectDef && (
            <>
              <span className="font-semibold text-gray-300">{effectDef.type}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/** Centered, tap-to-dismiss modal used on touch devices where hover tooltips don't fire. */
const CardModal = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full max-w-[320px]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-zinc-300 shadow-lg hover:text-white"
        >
          <X size={15} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

const ItemPill = ({
  itemType,
  itemName,
  itemBrand,
  itemRarity,
  itemImageId,
  level,
  rolledGuitar,
  rolledEffect,
}: {
  itemType: "guitar" | "effect";
  itemName: string;
  itemBrand: string;
  itemRarity: string;
  itemImageId: number | string;
  level: number | null;
  rolledGuitar: any;
  rolledEffect: any;
}) => {
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [open, setOpen] = useState(false);
  const color = RARITY_COLORS[itemRarity] || RARITY_COLORS.Common;
  const imgSrc = itemType === "guitar"
    ? getRankBadgeSrc(itemImageId, "small")
    : `/static/images/effects/${itemImageId}.png`;

  const cardContent = rolledGuitar ? (
    <div style={{ width: 250 }}>
      <GuitarCard item={rolledGuitar} readOnly />
    </div>
  ) : rolledEffect ? (
    <div style={{ width: 250 }}>
      <EffectCard item={rolledEffect} readOnly />
    </div>
  ) : (
    <ItemTooltipCard
      itemType={itemType}
      itemName={itemName}
      itemBrand={itemBrand}
      itemRarity={itemRarity}
      itemImageId={itemImageId}
    />
  );

  const pill = (
    <span className="inline-flex w-full cursor-pointer items-center gap-2.5 rounded-lg bg-white/5 p-2 sm:w-auto sm:gap-1.5 sm:rounded-none sm:bg-transparent sm:p-0">
            {/* Guitar/effect art — fixed size, never shrinks. Leads on mobile, trails on desktop. */}
            <img
              src={imgSrc}
              alt={itemName}
              className={`h-10 w-10 shrink-0 object-contain opacity-80 sm:order-last sm:h-7 sm:w-7 ${itemType === "guitar" ? "-rotate-45" : ""}`}
            />
            {/* Name + badges: stacked on mobile, inline on desktop */}
            <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-initial sm:flex-row sm:items-center sm:gap-1.5">
              <span className="order-1 min-w-0 break-words text-sm font-bold sm:order-2" style={{ color }}>
                {itemBrand} {itemName}
              </span>
              {/* Badges stay on one line and keep together */}
              <span className="order-2 flex shrink-0 items-center gap-1.5 sm:order-1">
                <Chip
                  color="custom"
                  className="whitespace-nowrap px-1.5 py-0.5 text-[10px] tracking-wide"
                  style={getChipCustomStyle(color)}
                >
                  {itemRarity}
                </Chip>
                {level !== null && (
                  <Chip
                    color="gray"
                    className="whitespace-nowrap px-1.5 py-0.5 text-[10px] tabular-nums tracking-wide"
                    title="Item level"
                  >
                    Lv {level}
                  </Chip>
                )}
              </span>
            </span>
          </span>
  );

  // Touch devices: tap opens the card in a centered modal (hover tooltips don't fire).
  if (isMobile) {
    return (
      <>
        <span onClick={() => setOpen(true)}>{pill}</span>
        {open && <CardModal onClose={() => setOpen(false)}>{cardContent}</CardModal>}
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{pill}</TooltipTrigger>
        <TooltipContent
          className="p-0 border-0 bg-transparent shadow-2xl"
          side="top"
        >
          {cardContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface LogsBoxLayoutProps {
  logs: AnyFirebaseLog[];
  marksLogsAsRead: () => void;
  currentUserId: string;
  hasMoreLogs?: boolean;
  onLoadMoreLogs?: () => void;
}

const TimeStamp = ({ date }: { date: Date }) => (
  <p className='w-full sm:w-auto lg:mr-4 lg:pr-4 lg:border-r-2 border-main-opposed-400 py-1 text-[0.6rem] sm:text-[0.55rem] text-secondText lg:text-xs opacity-60 sm:opacity-100 mb-2 sm:mb-0 whitespace-nowrap'>
    {date.toLocaleDateString() +
      " " +
      addZeroToTime(date.getHours()) +
      ":" +
      addZeroToTime(date.getMinutes())}
  </p>
);

const UserLink = ({
  uid,
  userName,
  avatarUrl,
  lvl,
}: {
  uid: string | undefined;
  userName: string;
  avatarUrl?: string | null;
  lvl?: number;
}) => {
  const { getSupportMember } = useSupportTeam();

  if (!uid) return <span>{userName}</span>;

  const supportMember = getSupportMember(uid);

  const avatar = (
    <Avatar
      size="sm"
      name={userName}
      avatarURL={avatarUrl || undefined}
      lvl={lvl}
    />
  );

  return (
    <UserTooltip userId={uid}>
      <Link
        className='flex items-center gap-2 text-white hover:underline'
        href={`/user/${uid}`}>
        <div className="scale-75 sm:scale-100 origin-left sm:mr-2">
          {supportMember ? (
            <SupportAvatarRing>{avatar}</SupportAvatarRing>
          ) : (
            avatar
          )}
        </div>
        <span>{userName}</span>
        {supportMember && <SupportBadge member={supportMember} />}
      </Link>
    </UserTooltip>
  );
};

const LogItem = ({
  isNew,
  children,
}: {
  isNew: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={`my-8 flex flex-col lg:flex-row flex-nowrap items-start lg:items-center bg-main-opposed-bg px-4 py-5 sm:px-6 transition-all duration-300 rounded-xl ${
      isNew ? "border border-white/30" : ""
    }`}>
    {children}
  </div>
);

const getSongStatusMessage = (status: string, t: any): string => {
  return t(`song_status.${status}`);
};

/** Compact tier square shown next to a song reference in the feed. Hidden while
 * the lookup is loading and for unrated/deleted songs. */
const SongTierChip = ({ info }: { info?: SongTierInfo }) => {
  if (!info) return null;
  const tier = getSongTier(
    !info.avgDifficulty ? "?" : info.tier || info.avgDifficulty
  );
  if (tier.tier === "?") return null;

  return (
    <span title={tier.label} className="inline-flex shrink-0">
      <TierBadge song={info} className="h-5 w-5 rounded text-[10px]" />
    </span>
  );
};

// Podkomponenty dla FirebaseLogsTopPlayersItem


const PlayerAvatar = ({ player }: { player: TopPlayerData }) => (
  <div className='relative flex flex-shrink-0 items-center justify-center'>
    <div className="scale-[0.8] origin-center -mx-1">
       <Avatar 
         size="sm" 
         name={player.displayName} 
         avatarURL={player.avatar ?? undefined} 
         lvl={(player as any).lvl ?? (player as any).level} 
       />
    </div>
  </div>
);

const SeasonHeader = ({
  seasonName,
  daysLeftInSeason,
  date,
  t,
}: {
  seasonName: string;
  daysLeftInSeason?: number;
  date: Date;
  t: (key: string) => string;
}) => (
  <div className='flex flex-wrap items-center gap-3 border-b border-white/5 bg-transparent px-3 py-3 sm:px-5 sm:py-4'>
    <div className='flex items-center gap-2'>
      <h3 className='text-sm font-bold text-white tracking-wide sm:text-base'>
        {t("logsBox.top_players")}
      </h3>
    </div>
    
    <span className='text-xs font-semibold text-secondText tracking-wide'>
      {seasonName}
    </span>

    {/* Right side with date info - on larger screens */}
    <div className='ml-auto hidden items-center gap-3 text-xs text-secondText sm:flex'>
      {daysLeftInSeason !== undefined && (
        <Chip color="gray">
          <IoCalendarOutline className="h-3.5 w-3.5 shrink-0" />
          <span className="tabular-nums">{daysLeftInSeason}</span>
          <span>{t("logsBox.days_left")}</span>
        </Chip>
      )}
      <span className='opacity-60'>
        {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
        {addZeroToTime(date.getMinutes())}
      </span>
    </div>

    {/* Days left - on mobile only */}
    {daysLeftInSeason !== undefined && (
      <div className='mt-2 flex w-full items-center justify-end text-xs text-secondText sm:hidden'>
        <Chip color="gray">
          <IoCalendarOutline className="h-3.5 w-3.5 shrink-0" />
          <span className="tabular-nums">{daysLeftInSeason}</span>
          <span>{t("logsBox.days_left")}</span>
        </Chip>
      </div>
    )}
  </div>
);

const PlayerRow = ({
  player,
  index,
}: {
  player: TopPlayerData;
  index: number;
}) => {
  const isTop3 = index < 3;
  
  return (
    <div className='flex items-center gap-2 sm:gap-4 px-3 py-2 sm:px-5 sm:py-3'>
      <div className='w-6 flex-shrink-0 text-center font-bold text-white/50 text-sm'>
        #{index + 1}
      </div>

      {/* User info with photo */}
      <div className='flex items-center gap-1 sm:gap-2'>
        <PlayerAvatar player={player} />

        <UserTooltip userId={player.uid}>
          <Link
            className={`text-sm sm:text-base font-bold tracking-wide transition-colors ${
              index === 0 ? "text-yellow-500/90" : "text-white/90"
            } hover:text-white`}
            href={`/user/${player.uid}`}>
            {player.displayName}
          </Link>
        </UserTooltip>
      </div>

      <div className='ml-auto'>
        <div className='flex items-baseline gap-1.5'>
          <span className='text-[10px] sm:text-xs font-semibold text-secondText opacity-60'>pt:</span>
          <span className={`text-sm sm:text-base font-bold ${isTop3 ? 'text-cyan-400' : 'text-cyan-600'}`}>
            {player.points}
          </span>
        </div>
      </div>
    </div>
  );
};

const NoTopPlayersData = ({
  date,
  isNew,
  t,
}: {
  date: Date;
  isNew: boolean;
  t: (key: string) => string;
}) => (
  <div
    className={`my-6 flex flex-col lg:flex-row flex-nowrap items-start lg:items-center bg-main-opposed-bg px-4 py-5 sm:px-6 transition-all duration-300 rounded-xl ${
      isNew ? "border border-white/30" : ""
    }`}>
    <TimeStamp date={date} />
    <div className='flex w-full flex-col gap-2 sm:w-[80%]'>
      <h3 className='flex items-center gap-2 text-sm font-bold text-tertiary'>
        <FaTrophy className='text-yellow-400' />
        <span>{t("logsBox.top_players")}</span>
      </h3>
      <p className='text-secondText'>No top players data available.</p>
    </div>
  </div>
);

const FirebaseLogsTopPlayersItem = ({
  log,
  isNew,
}: {
  log: FirebaseLogsTopPlayersInterface;
  isNew: boolean;
}) => {
  const { t } = useTranslation("common");
  const { data, topPlayers, daysLeftInSeason } = log;
  const date = new Date(data);

  // Get current season information
  const currentMonth = date.toLocaleString("default", { month: "long" });
  const currentYear = date.getFullYear();
  const seasonName = `${currentMonth} ${currentYear}`;

  // Handle case where topPlayers might not be available
  if (!topPlayers || !Array.isArray(topPlayers) || topPlayers.length === 0) {
    return <NoTopPlayersData date={date} isNew={isNew} t={t} />;
  }

  return (
    <div
      className={`my-4 flex flex-col overflow-hidden bg-main-opposed-bg transition-all duration-300 rounded-xl ${
        isNew ? "border border-white/30 shadow-xl" : ""
      }`}>
      <SeasonHeader
        seasonName={seasonName}
        daysLeftInSeason={daysLeftInSeason}
        date={date}
        t={t}
      />

      <div className='divide-y divide-white/5'>
        {topPlayers.map((player, index) => (
          <PlayerRow key={player.uid} player={player} index={index} />
        ))}
      </div>
    </div>
  );
};
const FirebaseLogsSupportAskItem = ({
  log,
  isNew,
}: {
  log: FirebaseLogsSupportAskInterface;
  isNew: boolean;
}) => {
  const date = new Date(log.data);
  const copy = getSupportVariantCopy(log.variant, {
    raisedThisMonth: log.raisedThisMonth,
    monthlyGoal: log.monthlyGoal,
    totalRaised: log.totalRaised,
    supporters: log.supporters,
    nextTierLabel: log.nextTierLabel,
    nextTierAmountToGo: log.nextTierAmountToGo,
    tiersFunded: log.tiersFunded,
    tiersTotal: log.tiersTotal,
  });

  return (
    <div
      className={`relative my-4 flex flex-col overflow-hidden bg-main-opposed-bg transition-all duration-300 rounded-xl ${
        isNew ? "border border-white/30" : ""
      }`}>
      {/* Same tiled icon pattern and warm glow as the "Help build Riff Quest" banner
          (feature/dashboard/components/SupportBanner.tsx), so the funding story looks
          the same wherever it shows up. */}
      <HeroPattern
        className='opacity-[0.08]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent' />
      <div className='relative z-10 flex flex-wrap items-center gap-3 px-3 py-3 sm:px-5 sm:py-4'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10'>
          <Heart size={16} className='text-orange-400' fill='currentColor' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-orange-400/80'>
            {copy.eyebrow}
          </p>
          <h3 className='text-sm font-bold text-white sm:text-base'>{copy.headline}</h3>
        </div>
        <span className='ml-auto shrink-0 text-[11px] text-secondText opacity-60'>
          {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
          {addZeroToTime(date.getMinutes())}
        </span>
      </div>

      <div className='relative z-10 px-3 pb-4 sm:px-5'>
        <p className='text-sm text-secondText'>{copy.body}</p>
        <a
          href={BMC_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-amber-400 sm:text-sm'>
          <Coffee size={14} />
          Support Riff Quest
        </a>
      </div>
    </div>
  );
};

const FirebaseLogsDonationItem = ({
  log,
  isNew,
}: {
  log: FirebaseLogsDonationInterface;
  isNew: boolean;
}) => {
  const date = new Date(log.data);
  const name = log.supporterName?.trim() || "Someone";
  const headline =
    log.kind === "recurring"
      ? `${name} became a monthly supporter`
      : `${name} bought Riff Quest a $${log.amount} coffee`;

  return (
    <div
      className={`relative my-4 flex flex-col overflow-hidden rounded-xl bg-main-opposed-bg transition-all duration-300 ${
        isNew ? "border border-white/30" : ""
      }`}>
      <HeroPattern
        className='opacity-[0.1]'
        maskImage='linear-gradient(to right, black 0%, transparent 60%)'
      />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-500/15 via-transparent to-transparent' />
      <div className='relative z-10 flex flex-wrap items-center gap-3 px-3 py-3 sm:px-5 sm:py-4'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15'>
          <PartyPopper size={16} className='text-orange-400' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-orange-400'>
            New supporter
          </p>
          <h3 className='text-sm font-bold text-white sm:text-base'>{headline}</h3>
        </div>
        <span className='ml-auto shrink-0 text-[11px] text-secondText opacity-60'>
          {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
          {addZeroToTime(date.getMinutes())}
        </span>
      </div>
    </div>
  );
};

/** One activity line's content, wrapping in its own column. */
const GroupedLine = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-2">{children}</div>
  </div>
);

/** Purple "Song" chip shared by every feed row that references a song, so artist/title are always formatted the same way. */
const SongBadge = ({
  songId,
  songArtist,
  songTitle,
}: {
  songId?: string;
  songArtist: string;
  songTitle: string;
}) =>
  songId ? (
    <Link href={`/songs?view=management&songId=${songId}`} title="Click to open this song">
      <Chip color="purple" className="cursor-pointer">
        <Music className="h-3.5 w-3.5 shrink-0" />
        <span className="underline-offset-2 hover:underline">{songArtist} - {songTitle}</span>
        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
      </Chip>
    </Link>
  ) : (
    <Chip color="purple">
      <Music className="h-3.5 w-3.5 shrink-0" />
      {songArtist} - {songTitle}
    </Chip>
  );

/** Renders a single activity's description inside a grouped feed row — same detail as the standalone item, minus the avatar and reaction (those live once on the group). */
const GroupedLogLine = ({
  log,
  type,
  songTiers,
  onPreviewPlan,
  onPreviewExercise,
  onViewRecording,
  onOpenLeaderboard,
}: {
  log: AnyFirebaseLog;
  type: LogActivityType;
  songTiers: Record<string, SongTierInfo>;
  onPreviewPlan: (plan: ExercisePlan) => void;
  onPreviewExercise: (exercise: Exercise) => void;
  onViewRecording: (id: string) => void;
  onOpenLeaderboard: (exerciseId: string, exerciseTitle: string) => void;
}) => {
  const { t } = useTranslation(["common", "exercises"]);

  if (type === "song") {
    const songLog = log as FirebaseLogsSongsInterface;
    const message = getSongStatusMessage(songLog.status, t);
    const showRating = songLog.status === "difficulty_rate" && songLog.difficulty_rate !== undefined;
    const ratingTier = showRating ? getSongTier(songLog.difficulty_rate as number) : null;

    return (
      <GroupedLine>
        <p className="text-secondText text-sm flex flex-wrap items-center gap-1.5">
          {message}
          {songLog.songId && <SongTierChip info={songTiers[songLog.songId]} />}
          {songLog.songId ? (
            <Link
              href={`/songs?view=management&songId=${songLog.songId}`}
              className="text-white underline decoration-dotted decoration-white/40 underline-offset-4 transition-colors hover:text-cyan-400 hover:decoration-cyan-400/60">
              {songLog.songArtist} - {songLog.songTitle}
            </Link>
          ) : (
            <span className="text-white">
              {songLog.songArtist} - {songLog.songTitle}
            </span>
          )}
        </p>
        {showRating && ratingTier && (
          <Chip
            color="custom"
            style={getChipCustomStyle(ratingTier.color)}
            title={`Difficulty rated ${songLog.difficulty_rate}/10 (${ratingTier.label})`}
          >
            <Star className="h-3 w-3 shrink-0 fill-current" />
            {songLog.difficulty_rate}/10
          </Chip>
        )}
      </GroupedLine>
    );
  }

  if (type === "recording") {
    const recLog = log as FirebaseLogsRecordingsInterface;

    return (
      <GroupedLine>
        <p className="text-secondText text-sm">
          <Video className="mr-1.5 inline-block h-3 w-3 text-cyan-400" />
          added a new recording:{" "}
          {recLog.recordingId ? (
            <button
              onClick={() => onViewRecording(recLog.recordingId as string)}
              className="font-bold text-white hover:text-cyan-400 hover:underline transition-colors text-left"
            >
              {recLog.recordingTitle}
            </button>
          ) : (
            <a
              href={recLog.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-cyan-400 hover:underline transition-colors"
            >
              {recLog.recordingTitle}
            </a>
          )}
          {" "}
          {recLog.songTitle && (
            <span className="text-xs opacity-70">({recLog.songArtist} - {recLog.songTitle})</span>
          )}
        </p>
      </GroupedLine>
    );
  }

  if (type === "caseOpen") {
    const caseLog = log as FirebaseLogsCaseOpenInterface;
    const { rolledGuitar, rolledEffect, level } = resolveRolledItem(caseLog.rolledItem);

    return (
      <GroupedLine>
        <span className="text-secondText text-sm">opened</span>
        <span className="text-white font-bold text-sm">{caseLog.caseName}</span>
        <span className="text-secondText text-sm">and got</span>
        <ItemPill
          itemType={caseLog.itemType}
          itemName={caseLog.itemName}
          itemBrand={caseLog.itemBrand}
          itemRarity={caseLog.itemRarity}
          itemImageId={caseLog.itemImageId}
          level={level}
          rolledGuitar={rolledGuitar}
          rolledEffect={rolledEffect}
        />
      </GroupedLine>
    );
  }

  if (type === "marketplace") {
    const marketLog = log as FirebaseLogsMarketplaceInterface;
    const { rolledGuitar, rolledEffect, level } = resolveRolledItem(marketLog.rolledItem);

    return (
      <GroupedLine>
        <span className="text-secondText text-sm">listed</span>
        <ItemPill
          itemType={marketLog.itemType}
          itemName={marketLog.itemName}
          itemBrand={marketLog.itemBrand}
          itemRarity={marketLog.itemRarity}
          itemImageId={marketLog.itemImageId}
          level={level}
          rolledGuitar={rolledGuitar}
          rolledEffect={rolledEffect}
        />
        <Chip color="amber">
          <Tag className="h-3.5 w-3.5 shrink-0" />
          <span className="inline-flex items-center gap-1 tabular-nums">
            {marketLog.price}
            <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
          </span>
        </Chip>
      </GroupedLine>
    );
  }

  if (type === "marketplacePurchase") {
    const purchaseLog = log as FirebaseLogsMarketplacePurchaseInterface;
    const { rolledGuitar, rolledEffect, level } = resolveRolledItem(purchaseLog.rolledItem);

    return (
      <GroupedLine>
        <span className="text-secondText text-sm">
          <ShoppingCart className="mr-1.5 inline-block h-3.5 w-3.5 text-amber-400" />
          bought
        </span>
        <ItemPill
          itemType={purchaseLog.itemType}
          itemName={purchaseLog.itemName}
          itemBrand={purchaseLog.itemBrand}
          itemRarity={purchaseLog.itemRarity}
          itemImageId={purchaseLog.itemImageId}
          level={level}
          rolledGuitar={rolledGuitar}
          rolledEffect={rolledEffect}
        />
        <span className="text-secondText text-sm">
          from{" "}
          {purchaseLog.sellerId ? (
            <Link
              href={`/user/${purchaseLog.sellerId}`}
              className="font-bold text-white transition-colors hover:text-cyan-400 hover:underline">
              {purchaseLog.sellerName}
            </Link>
          ) : (
            <span className="font-bold text-white">{purchaseLog.sellerName}</span>
          )}
        </span>
        <Chip color="amber">
          <Tag className="h-3.5 w-3.5 shrink-0" />
          <span className="inline-flex items-center gap-1 tabular-nums">
            {purchaseLog.price}
            <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
          </span>
        </Chip>
      </GroupedLine>
    );
  }

  if (type === "playlist") {
    const playlistLog = log as FirebaseLogsPlaylistInterface;
    const kindLabel = PLAYLIST_KIND_LABEL[playlistLog.playlistKind] ?? "playlist";

    return (
      <GroupedLine>
        <p className="text-secondText text-sm">
          created a new {kindLabel}:{" "}
          <Link
            href={`/songs?view=playlists&playlistId=${playlistLog.playlistId}`}
            className="inline-flex items-center gap-1 font-bold text-white hover:text-cyan-400 hover:underline transition-colors"
          >
            {playlistLog.playlistName}
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>
          {playlistLog.songCount > 0 && (
            <span className="text-xs opacity-70"> ({playlistLog.songCount} {playlistLog.songCount === 1 ? "song" : "songs"})</span>
          )}
        </p>
      </GroupedLine>
    );
  }

  if (type === "examPassed") {
    const examLog = log as FirebaseLogsExamPassedInterface;

    return (
      <GroupedLine>
        <p className="text-secondText text-sm">
          <GraduationCap className="mr-1.5 inline-block h-3.5 w-3.5 text-emerald-400" />
          passed the <span className="text-white font-bold">{examLog.stepTitle}</span> exam
        </p>
        <Chip color="emerald">
          {Array.from({ length: examLog.stars }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 shrink-0 fill-current" />
          ))}
          <span className="tabular-nums">{examLog.accuracy}%</span>
        </Chip>
      </GroupedLine>
    );
  }

  if (type === "dailyQuest") {
    const questLog = log as FirebaseLogsDailyQuestInterface;

    return (
      <GroupedLine>
        <p className="text-secondText text-sm">
          completed all <span className="text-zinc-200 font-semibold">Daily Quests!</span>
        </p>
        <Chip color="yellow">
          <Gift className="h-3.5 w-3.5 shrink-0" />
          <span className="inline-flex items-center gap-1 tabular-nums">
            +{questLog.points}
            <img src="/images/points.png" alt="points" className="h-4 w-4 object-contain" />
          </span>
        </Chip>
      </GroupedLine>
    );
  }

  // "exercise" | "exercisePlan" — general practice log (points, level ups, achievements, plan/exercise/song refs).
  const genericLog = log as FirebaseLogsInterface;
  const plan: any = genericLog.planId ? defaultPlans.find((p) => p.id === genericLog.planId) : null;
  const matchedExercise: Exercise | null = genericLog.exerciseTitle
    ? exercisesAgregat.find((ex) => ex.title === genericLog.exerciseTitle) ??
      // Old logs store the title text as it was at log time. Names get renamed (#786) —
      // fall back to the legacy-title → id map so historical logs keep linking correctly.
      exercisesAgregat.find(
        (ex) => ex.id === LEGACY_EXERCISE_TITLES[genericLog.exerciseTitle as string],
      ) ??
      null
    : null;
  const planTitle = plan ? plan.title : null;
  const sessionTimeMs = genericLog.timeSumary?.sumTime ?? 0;

  return (
    <GroupedLine>
      <span className="text-secondText text-sm">{t("common:logsBox.get")}</span>
      <span className="flex items-center gap-1 text-main text-sm">
        +{genericLog.points}
        <img src="/images/points.png" alt="points" className="h-5 w-5 object-contain" />
      </span>

      {sessionTimeMs > 0 && (
        <span
          className="inline-flex items-center gap-1.5 text-sm text-secondText"
          title="Practice time logged in this session">
          <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <span className="tabular-nums">{formatSessionTime(sessionTimeMs)}</span>
        </span>
      )}

      {genericLog.newLevel?.isNewLevel && (
        <span className="text-secondText text-sm">
          {t("common:logsBox.lvl_up")}
          <span className="ml-1 text-main">
            {genericLog.newLevel.level}
            {" lvl"}
          </span>
        </span>
      )}

      {genericLog.newAchievements?.length > 0 && (
        <span className="inline-flex items-center gap-2 text-sm">
          {t("common:logsBox.achievements")}{" "}
          {genericLog.newAchievements.map((achievement, index) => (
            <span key={index} className="inline-flex items-center gap-2">
              <AchievementIcon id={achievement} />
            </span>
          ))}
        </span>
      )}

      {planTitle && (
        plan ? (
          <button type="button" onClick={() => onPreviewPlan(plan)} title="Click to preview and start this plan">
            <Chip color="cyan" className="cursor-pointer text-left">
              <ListChecks className="h-3.5 w-3.5 shrink-0" />
              <span className="hover:underline underline-offset-2">{planTitle}</span>
            </Chip>
          </button>
        ) : (
          <Chip color="cyan">
            <ListChecks className="h-3.5 w-3.5 shrink-0" />
            {planTitle}
          </Chip>
        )
      )}

      {genericLog.exerciseTitle && !genericLog.exerciseTitle.includes("Practicing: ") && !planTitle && !genericLog.songTitle && (
        matchedExercise ? (
          <button
            type="button"
            onClick={() => onPreviewExercise(matchedExercise)}
            title="Click to preview and start this exercise"
          >
            <Chip color="emerald" className="cursor-pointer text-left">
              <Dumbbell className="h-3.5 w-3.5 shrink-0" />
              <span className="hover:underline underline-offset-2">{genericLog.exerciseTitle}</span>
            </Chip>
          </button>
        ) : (
          <Chip color="emerald">
            <Dumbbell className="h-3.5 w-3.5 shrink-0" />
            {genericLog.exerciseTitle}
          </Chip>
        )
      )}

      {genericLog.micPerformance && genericLog.micPerformance.score !== 0 && (
        matchedExercise ? (
          <button
            type="button"
            onClick={() => onOpenLeaderboard(matchedExercise.id, matchedExercise.title)}
            title="Click to view the ranking for this exercise"
            className="inline-flex items-center gap-1.5 text-sm underline decoration-dotted decoration-white/40 underline-offset-4 transition-colors hover:text-cyan-400 hover:decoration-cyan-400/60"
          >
            <Target className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span className="text-secondText">Score:</span>
            <span className="font-semibold text-white tabular-nums">{genericLog.micPerformance.score}</span>
            <span className="text-secondText">|</span>
            <span className="font-semibold text-white tabular-nums">{genericLog.micPerformance.accuracy}%</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Target className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span className="text-secondText">Score:</span>
            <span className="font-semibold text-white tabular-nums">{genericLog.micPerformance.score}</span>
            <span className="text-secondText">|</span>
            <span className="font-semibold text-white tabular-nums">{genericLog.micPerformance.accuracy}%</span>
          </span>
        )
      )}

      {genericLog.earTrainingPerformance && genericLog.earTrainingPerformance.score !== 0 && (
        matchedExercise ? (
          <button
            type="button"
            onClick={() => onOpenLeaderboard(matchedExercise.id, matchedExercise.title)}
            title="Click to view the ranking for this exercise"
            className="inline-flex items-center gap-1.5 text-sm underline decoration-dotted decoration-white/40 underline-offset-4 transition-colors hover:text-cyan-400 hover:decoration-cyan-400/60"
          >
            <Ear className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span className="text-secondText">Score:</span>
            <span className="font-semibold text-white tabular-nums">{genericLog.earTrainingPerformance.score}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Ear className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span className="text-secondText">Score:</span>
            <span className="font-semibold text-white tabular-nums">{genericLog.earTrainingPerformance.score}</span>
          </span>
        )
      )}

      {genericLog.songTitle && genericLog.songArtist && (
        <p className="text-secondText text-sm flex flex-wrap items-center gap-1.5">
          {t("common:song_status.practiced")}
          {genericLog.songId && <SongTierChip info={songTiers[genericLog.songId]} />}
          {genericLog.songId ? (
            <Link
              href={`/songs?view=management&songId=${genericLog.songId}`}
              className="text-white underline decoration-dotted decoration-white/40 underline-offset-4 transition-colors hover:text-cyan-400 hover:decoration-cyan-400/60">
              {genericLog.songArtist} - {genericLog.songTitle}
            </Link>
          ) : (
            <span className="text-white">
              {genericLog.songArtist} - {genericLog.songTitle}
            </span>
          )}
        </p>
      )}
    </GroupedLine>
  );
};

const GroupedLogItem = ({
  group,
  isNew,
  currentUserId,
  songTiers,
  onPreviewPlan,
  onPreviewExercise,
  onViewRecording,
  onOpenLeaderboard,
}: {
  group: LogGroup;
  isNew: boolean;
  currentUserId: string;
  songTiers: Record<string, SongTierInfo>;
  onPreviewPlan: (plan: ExercisePlan) => void;
  onPreviewExercise: (exercise: Exercise) => void;
  onViewRecording: (id: string) => void;
  onOpenLeaderboard: (exerciseId: string, exerciseTitle: string) => void;
}) => {
  const representative = group.logs[0] as FirebaseLogsInterface;
  const date = new Date(getLogTimestampMs(group.logs[0]));
  const fameAmount = calculateGroupFame(group);
  const { uid, userName, avatarUrl, userAvatarFrame } = representative;

  // The reaction lives on the oldest log in the group, not the newest one shown at the top: the
  // head keeps changing as the user logs more of the same activity, the tail does not.
  const reactionLogId = getGroupReactionAnchor(group)?.id;
  const reactors = getGroupReactors(group);
  const awardedFame = getGroupAwardedFame(group, fameAmount);

  return (
    <LogItem isNew={isNew}>
      <div className="flex w-full flex-col gap-4 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-tertiary">
            <UserLink uid={uid} userName={userName} avatarUrl={avatarUrl ?? undefined} lvl={userAvatarFrame} />
          </span>
          <span className="hidden sm:flex sm:items-center shrink-0 text-[11px] text-secondText opacity-50">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>

          {reactionLogId && (
            <div className="ml-auto shrink-0">
              <LogReaction
                logId={reactionLogId}
                reactions={reactors}
                currentUserId={currentUserId}
                disabled={uid === currentUserId}
                fameAmount={fameAmount}
                awardedFame={awardedFame}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:gap-2.5">
          {group.logs.map((log, index) => (
            <GroupedLogLine
              key={(log as { id?: string }).id ?? `${getLogTimestampMs(log)}-${index}`}
              log={log}
              type={getLogActivityType(log)}
              songTiers={songTiers}
              onPreviewPlan={onPreviewPlan}
              onPreviewExercise={onPreviewExercise}
              onViewRecording={onViewRecording}
              onOpenLeaderboard={onOpenLeaderboard}
            />
          ))}
        </div>
      </div>
    </LogItem>
  );
};

const Logs = ({ logs, marksLogsAsRead, currentUserId, hasMoreLogs, onLoadMoreLogs }: LogsBoxLayoutProps) => {
  const { isNewMessage } = useUnreadMessages();
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [previewPlan, setPreviewPlan] = useState<ExercisePlan | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [leaderboardExercise, setLeaderboardExercise] = useState<{ id: string; title: string } | null>(null);
  const spanRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!spanRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          marksLogsAsRead();
        }
      },
      { threshold: 1, rootMargin: "-400px" }
    );

    observerRef.current.observe(spanRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array since we handle cleanup manually

  const groups = useMemo(() => groupConsecutiveLogs(logs), [logs]);

  const songIds = useMemo(
    () =>
      logs
        .map((log) => (log as { songId?: string }).songId)
        .filter((id): id is string => Boolean(id)),
    [logs]
  );
  const songTiers = useSongTiers(songIds);

  return (
    <>
      <div className="mt-4 mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-3">
        <OnlineUsers />
      </div>
      <div ref={spanRef} className='h-1' />
      {groups.map((group) => {
        const representative = group.logs[0];
        const key =
          (representative as any).id ||
          String(getLogTimestampMs(representative)) + (representative as any).uid + (representative as any).userName ||
          "topPlayers";
        const isNew = isNewMessage((representative as any).data || (representative as any).timestamp);

        return (
          <div key={key} className='mr-2'>
            {group.type === "topPlayers" ? (
              <FirebaseLogsTopPlayersItem
                log={representative as FirebaseLogsTopPlayersInterface}
                isNew={isNew}
              />
            ) : group.type === "supportAsk" ? (
              <FirebaseLogsSupportAskItem
                log={representative as FirebaseLogsSupportAskInterface}
                isNew={isNew}
              />
            ) : group.type === "donationReceived" ? (
              <FirebaseLogsDonationItem
                log={representative as FirebaseLogsDonationInterface}
                isNew={isNew}
              />
            ) : (
              <GroupedLogItem
                group={group}
                isNew={isNew}
                currentUserId={currentUserId}
                songTiers={songTiers}
                onPreviewPlan={setPreviewPlan}
                onPreviewExercise={setPreviewExercise}
                onViewRecording={setActiveRecordingId}
                onOpenLeaderboard={(id, title) => setLeaderboardExercise({ id, title })}
              />
            )}
          </div>
        );
      })}

      {hasMoreLogs && onLoadMoreLogs && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={onLoadMoreLogs}
            className="rounded-lg bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Show more
          </button>
        </div>
      )}

      <RecordingViewModal
        isOpen={!!activeRecordingId}
        onClose={() => setActiveRecordingId(null)}
        recordingId={activeRecordingId}
      />

      <ActivityStartModal
        plan={previewPlan}
        exercise={previewExercise}
        onClose={() => {
          setPreviewPlan(null);
          setPreviewExercise(null);
        }}
      />

      <EarTrainingLeaderboardDialog
        isOpen={!!leaderboardExercise}
        onClose={() => setLeaderboardExercise(null)}
        exerciseId={leaderboardExercise?.id ?? ""}
        exerciseTitle={leaderboardExercise?.title ?? ""}
      />
    </>
  );
};

export default Logs;
