import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { OnlineUsers } from "components/OnlineUsers/OnlineUsers";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import AchievementIcon from "feature/achievements/components/AchievementIcon";
import { EffectCard } from "feature/arsenal/components/GuitarInventory/EffectCard";
import { GuitarCard } from "feature/arsenal/components/GuitarInventory/GuitarCard";
import { EFFECT_DEFINITIONS, EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectLevel } from "feature/arsenal/data/effectStats";
import { GUITAR_DEFINITIONS, GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemLevel } from "feature/arsenal/data/itemStats";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
// challengesList removed
import { useUnreadMessages } from "feature/chat/hooks/useUnreadMessages";
import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { LogReaction } from "feature/logs/components/LogReaction";
import type {
  FirebaseLogsCaseOpenInterface,
  FirebaseLogsDailyQuestInterface,
  FirebaseLogsInterface,
  FirebaseLogsMarketplaceInterface,
  FirebaseLogsPlaylistInterface,
  FirebaseLogsRecordingsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsTopPlayersInterface,
} from "feature/logs/types/logs.type";
import { calculateActivityFame, EXERCISE_PLAN_FAME } from "feature/logs/utils/activityFame";
import {
  type AnyFirebaseLog,
  groupConsecutiveLogs,
  type LogActivityType,
  type LogGroup,
} from "feature/logs/utils/groupConsecutiveLogs";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import { ActivityStartModal } from "layouts/LogsBoxLayout/components/Logs/ActivityStartModal";
import { ExternalLink, Star,Video, X } from "lucide-react";
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

/** Fame reward for a group of `count` non-plan activities of the same type. */
const getGroupFameAmount = (group: LogGroup): number =>
  group.type === "exercisePlan" ? EXERCISE_PLAN_FAME : calculateActivityFame(group.logs.length);

const getLogTimestampMs = (log: AnyFirebaseLog): number =>
  new Date((log as any).timestamp ?? (log as any).data).getTime();

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
                <span
                  className="inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
                  style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}40` }}
                >
                  {itemRarity}
                </span>
                {level !== null && (
                  <span
                    className="inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-black tabular-nums tracking-wide text-zinc-200"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
                    title="Item level"
                  >
                    Lv {level}
                  </span>
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
  if (!uid) return <span>{userName}</span>;

  return (
    <UserTooltip userId={uid}>
      <Link
        className='flex items-center gap-2 text-white hover:underline'
        href={`/user/${uid}`}>
        <div className="scale-75 origin-left">
          <Avatar 
            size="sm" 
            name={userName} 
            avatarURL={avatarUrl || undefined} 
            lvl={lvl} 
          />
        </div>
        <span className="-ml-2">{userName}</span>
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
    className={`my-4 flex flex-col lg:flex-row flex-nowrap items-start lg:items-center bg-main-opposed-bg px-4 py-5 sm:px-6 transition-all duration-300 rounded-xl ${
      isNew ? "border border-white/30" : ""
    }`}>
    {children}
  </div>
);

const getSongStatusMessage = (status: string, t: any): string => {
  return t(`song_status.${status}`);
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
        <div className='flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 border border-white/5'>
          <IoCalendarOutline className='text-zinc-400' />
          <span className='font-semibold text-zinc-300'>{daysLeftInSeason}</span>
          <span>{t("logsBox.days_left")}</span>
        </div>
      )}
      <span className='opacity-60'>
        {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
        {addZeroToTime(date.getMinutes())}
      </span>
    </div>

    {/* Days left - on mobile only */}
    {daysLeftInSeason !== undefined && (
      <div className='mt-2 flex w-full items-center justify-end text-xs text-secondText sm:hidden'>
        <div className='flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 border border-white/5'>
          <IoCalendarOutline className='text-zinc-400' />
          <span className='font-semibold text-zinc-300'>{daysLeftInSeason}</span>
          <span>{t("logsBox.days_left")}</span>
        </div>
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
  <LogItem isNew={isNew}>
    <TimeStamp date={date} />
    <div className='flex w-full flex-col gap-2 sm:w-[80%]'>
      <h3 className='flex items-center gap-2 text-sm font-bold text-tertiary'>
        <FaTrophy className='text-yellow-400' />
        <span>{t("logsBox.top_players")}</span>
      </h3>
      <p className='text-secondText'>No top players data available.</p>
    </div>
  </LogItem>
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
/** Compact per-line timestamp used inside a grouped feed row, where the group header already owns the full date. */
const LineTimeStamp = ({ date }: { date: Date }) => (
  <span className="w-9 shrink-0 text-[11px] leading-5 tabular-nums text-secondText opacity-50">
    {addZeroToTime(date.getHours())}:{addZeroToTime(date.getMinutes())}
  </span>
);

/** One activity line: fixed time column + content that wraps in its own column (never under the time). */
const GroupedLine = ({ date, children }: { date: Date; children: React.ReactNode }) => (
  <div className="flex items-start gap-2">
    <LineTimeStamp date={date} />
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-2">{children}</div>
  </div>
);

/** Renders a single activity's description inside a grouped feed row — same detail as the standalone item, minus the avatar and reaction (those live once on the group). */
const GroupedLogLine = ({
  log,
  type,
  onPreviewPlan,
  onPreviewExercise,
  onViewRecording,
}: {
  log: AnyFirebaseLog;
  type: LogActivityType;
  onPreviewPlan: (plan: ExercisePlan) => void;
  onPreviewExercise: (exercise: Exercise) => void;
  onViewRecording: (id: string) => void;
}) => {
  const { t } = useTranslation(["common", "exercises"]);

  if (type === "song") {
    const songLog = log as FirebaseLogsSongsInterface;
    const date = new Date(songLog.data);
    const message = getSongStatusMessage(songLog.status, t);
    const showRating = songLog.status === "difficulty_rate" && songLog.difficulty_rate !== undefined;
    const ratingTier = showRating ? getSongTier(songLog.difficulty_rate as number) : null;

    return (
      <GroupedLine date={date}>
        <p className="text-secondText text-sm">
          {message}{" "}
          {songLog.songId ? (
            <Link
              href={`/songs?view=management&songId=${songLog.songId}`}
              className="inline-flex items-center gap-1 text-white hover:text-cyan-400 hover:underline transition-colors">
              {songLog.songArtist} {songLog.songTitle}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          ) : (
            <span className="text-white">
              {songLog.songArtist} {songLog.songTitle}
            </span>
          )}
          {songLog.status !== "difficulty_rate" && "."}
        </p>
        {showRating && ratingTier && (
          <span
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold"
            style={{
              color: ratingTier.color,
              backgroundColor: `${ratingTier.color}1a`,
              borderColor: `${ratingTier.color}40`,
            }}
            title={`Difficulty rated ${songLog.difficulty_rate}/10 (${ratingTier.label})`}
          >
            <Star className="h-2.5 w-2.5 fill-current" />
            {songLog.difficulty_rate}/10
          </span>
        )}
      </GroupedLine>
    );
  }

  if (type === "recording") {
    const recLog = log as FirebaseLogsRecordingsInterface;
    const date = new Date(recLog.timestamp);

    return (
      <GroupedLine date={date}>
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
    const date = new Date(caseLog.timestamp);
    const rolled = caseLog.rolledItem;
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

    return (
      <GroupedLine date={date}>
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
    const date = new Date(marketLog.timestamp);
    const rolled = marketLog.rolledItem;
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

    return (
      <GroupedLine date={date}>
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
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border opacity-90 text-amber-400 bg-amber-950/30 border-amber-500/20">
          <span className="text-[10px] font-semibold capitalize tracking-wider opacity-70">on market</span>
          <span className="inline-flex items-center gap-1 font-bold tabular-nums">
            {marketLog.price}
            <img src="/images/coin.png" alt="coin" className="h-3 w-3 object-contain" />
          </span>
        </span>
      </GroupedLine>
    );
  }

  if (type === "playlist") {
    const playlistLog = log as FirebaseLogsPlaylistInterface;
    const date = new Date(playlistLog.timestamp);
    const kindLabel = PLAYLIST_KIND_LABEL[playlistLog.playlistKind] ?? "playlist";

    return (
      <GroupedLine date={date}>
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

  if (type === "dailyQuest") {
    const questLog = log as FirebaseLogsDailyQuestInterface;
    const date = new Date(questLog.timestamp);

    return (
      <GroupedLine date={date}>
        <p className="text-secondText text-sm">
          completed all <span className="text-zinc-200 font-semibold">Daily Quests!</span>
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border opacity-90 text-yellow-400 bg-yellow-950/30 border-yellow-500/20">
          <span className="text-[10px] font-semibold capitalize tracking-wider opacity-70">Claimed</span>
          <span className="inline-flex items-center gap-1 font-bold tabular-nums">
            +{questLog.points}
            <img src="/images/points.png" alt="points" className="h-3 w-3 object-contain" />
          </span>
        </span>
      </GroupedLine>
    );
  }

  // "exercise" | "exercisePlan" — general practice log (points, level ups, achievements, plan/exercise/song refs).
  const genericLog = log as FirebaseLogsInterface;
  const date = new Date(genericLog.timestamp as string);
  const plan: any = genericLog.planId ? defaultPlans.find((p) => p.id === genericLog.planId) : null;
  const matchedExercise: Exercise | null = genericLog.exerciseTitle
    ? exercisesAgregat.find((ex) => ex.title === genericLog.exerciseTitle) ?? null
    : null;
  const planTitle = plan ? plan.title : null;

  return (
    <GroupedLine date={date}>
      <span className="text-secondText text-sm">{t("common:logsBox.get")}</span>
      <span className="flex items-center gap-1 text-main text-sm">
        +{genericLog.points}
        <img src="/images/points.png" alt="points" className="h-4 w-4 object-contain" />
      </span>

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
          <button
            type="button"
            onClick={() => onPreviewPlan(plan)}
            title="Click to preview and start this plan"
            className="group inline-flex items-center text-left text-xs px-2.5 py-1 rounded-md border opacity-90 text-cyan-400 bg-cyan-950/30 border-cyan-500/20 hover:opacity-100 transition-opacity cursor-pointer max-w-full whitespace-normal break-words align-middle">
            <span className="text-[10px] font-semibold capitalize tracking-wider mr-1.5 opacity-70">Plan</span>
            <span className="font-medium group-hover:underline underline-offset-2 decoration-cyan-500/40">{planTitle}</span>
          </button>
        ) : (
          <span className="inline-block text-xs px-2.5 py-1 rounded-md border opacity-90 text-cyan-400 bg-cyan-950/30 border-cyan-500/20 max-w-full whitespace-normal break-words align-middle">
            <span className="text-[10px] font-semibold capitalize tracking-wider mr-1.5 opacity-70">Plan</span>
            <span className="font-medium">{planTitle}</span>
          </span>
        )
      )}

      {genericLog.exerciseTitle && !genericLog.exerciseTitle.includes("Practicing: ") && !planTitle && !genericLog.songTitle && (
        matchedExercise ? (
          <button
            type="button"
            onClick={() => onPreviewExercise(matchedExercise)}
            title="Click to preview and start this exercise"
            className="group inline-flex items-center text-left text-xs px-2.5 py-1 rounded-md border opacity-90 text-emerald-400 bg-emerald-950/30 border-emerald-500/20 hover:opacity-100 transition-opacity cursor-pointer max-w-full whitespace-normal break-words align-middle">
            <span className="text-[10px] font-semibold capitalize tracking-wider mr-1.5 opacity-70">Exercise</span>
            <span className="font-medium group-hover:underline underline-offset-2 decoration-emerald-500/40">{genericLog.exerciseTitle}</span>
          </button>
        ) : (
          <span className="inline-block text-xs px-2.5 py-1 rounded-md border opacity-90 text-emerald-400 bg-emerald-950/30 border-emerald-500/20 max-w-full whitespace-normal break-words align-middle">
            <span className="text-[10px] font-semibold capitalize tracking-wider mr-1.5 opacity-70">Exercise</span>
            <span className="font-medium">{genericLog.exerciseTitle}</span>
          </span>
        )
      )}

      {genericLog.micPerformance && !(genericLog.micPerformance.score === 0 && genericLog.micPerformance.accuracy === 100) && (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border opacity-90 text-blue-400 bg-blue-950/30 border-blue-500/20">
          <span className="flex items-center gap-1">
            <span className="text-[10px] font-semibold capitalize opacity-70 tracking-wider mr-0.5">Score:</span>
            <span className="font-bold tabular-nums text-main">{genericLog.micPerformance.score}</span>
          </span>
          <span className="w-px h-2.5 bg-blue-500/30" />
          <span className="flex items-center gap-1 font-bold tabular-nums">{genericLog.micPerformance.accuracy}%</span>
        </span>
      )}

      {genericLog.earTrainingPerformance && (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border opacity-90 text-amber-400 bg-amber-950/30 border-amber-500/20">
          <span className="text-[10px] font-semibold capitalize opacity-70 tracking-wider">Score:</span>
          <span className="font-bold tabular-nums">{genericLog.earTrainingPerformance.score}</span>
        </span>
      )}

      {genericLog.songTitle && genericLog.songArtist && (
        genericLog.songId ? (
          <Link
            href={`/songs?view=management&songId=${genericLog.songId}`}
            title="Click to open this song"
            className="group inline-flex items-center text-left text-xs text-purple-400 bg-purple-950/30 px-2.5 py-1 rounded-md border border-purple-500/20 opacity-90 hover:opacity-100 transition-opacity max-w-full whitespace-normal break-words align-middle">
            <span className="text-[10px] font-semibold capitalize tracking-wider mr-1.5 opacity-70">Song</span>
            <span className="font-medium group-hover:underline underline-offset-2 decoration-purple-500/40">{genericLog.songArtist} - {genericLog.songTitle}</span>
            <ExternalLink className="ml-1 h-3 w-3 shrink-0 opacity-60" />
          </Link>
        ) : (
          <span className="inline-block text-xs text-purple-400 bg-purple-950/30 px-2.5 py-1 rounded-md border border-purple-500/20 opacity-90 max-w-full whitespace-normal break-words align-middle">
            <span className="text-[10px] font-semibold capitalize tracking-wider mr-1.5 opacity-70">Song</span>
            <span className="font-medium">{genericLog.songArtist} - {genericLog.songTitle}</span>
          </span>
        )
      )}
    </GroupedLine>
  );
};

const GroupedLogItem = ({
  group,
  isNew,
  currentUserId,
  onPreviewPlan,
  onPreviewExercise,
  onViewRecording,
}: {
  group: LogGroup;
  isNew: boolean;
  currentUserId: string;
  onPreviewPlan: (plan: ExercisePlan) => void;
  onPreviewExercise: (exercise: Exercise) => void;
  onViewRecording: (id: string) => void;
}) => {
  const representative = group.logs[0] as FirebaseLogsInterface;
  const date = new Date(getLogTimestampMs(group.logs[0]));
  const fameAmount = getGroupFameAmount(group);
  const { uid, userName, avatarUrl, userAvatarFrame, id: logId, reactions } = representative;

  return (
    <LogItem isNew={isNew}>
      <div className="flex w-full flex-col gap-4 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-tertiary">
            <UserLink uid={uid} userName={userName} avatarUrl={avatarUrl ?? undefined} lvl={userAvatarFrame} />
          </span>
          <span className="shrink-0 text-[11px] text-secondText opacity-50 tabular-nums">
            {date.toLocaleDateString()}
          </span>

          {logId && (
            <div className="ml-auto shrink-0">
              <LogReaction
                logId={logId}
                reactions={reactions}
                currentUserId={currentUserId}
                disabled={uid === currentUserId}
                fameAmount={fameAmount}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 pl-1 sm:gap-2.5 sm:pl-10">
          {group.logs.map((log, index) => (
            <GroupedLogLine
              key={(log as { id?: string }).id ?? `${getLogTimestampMs(log)}-${index}`}
              log={log}
              type={group.type}
              onPreviewPlan={onPreviewPlan}
              onPreviewExercise={onPreviewExercise}
              onViewRecording={onViewRecording}
            />
          ))}
        </div>
      </div>
    </LogItem>
  );
};

const Logs = ({ logs, marksLogsAsRead, currentUserId }: LogsBoxLayoutProps) => {
  const { isNewMessage } = useUnreadMessages("logs");
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [previewPlan, setPreviewPlan] = useState<ExercisePlan | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
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
            ) : (
              <GroupedLogItem
                group={group}
                isNew={isNew}
                currentUserId={currentUserId}
                onPreviewPlan={setPreviewPlan}
                onPreviewExercise={setPreviewExercise}
                onViewRecording={setActiveRecordingId}
              />
            )}
          </div>
        );
      })}

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
    </>
  );
};

export default Logs;
