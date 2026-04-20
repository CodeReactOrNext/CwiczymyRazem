import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { OnlineUsers } from "components/OnlineUsers/OnlineUsers";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import AchievementIcon from "feature/achievements/components/AchievementIcon";
// challengesList removed
import { useUnreadMessages } from "feature/chat/hooks/useUnreadMessages";
import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { EFFECT_DEFINITIONS } from "feature/arsenal/data/effectDefinitions";
import { GUITAR_DEFINITIONS } from "feature/arsenal/data/guitarDefinitions";
import { LogReaction } from "feature/logs/components/LogReaction";
import type {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsTopPlayersInterface,
  FirebaseLogsRecordingsInterface,
  FirebaseLogsDailyQuestInterface,
  FirebaseLogsCaseOpenInterface,
} from "feature/logs/types/logs.type";
import { FaGem, FaCalendarAlt, FaGlobe, FaTag } from "react-icons/fa";
import { useTranslation } from "hooks/useTranslation";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  FaChevronUp,
  FaCrown,
  FaMedal,
  FaRegStar,
  FaTrophy,
} from "react-icons/fa";
import { IoCalendarOutline } from "react-icons/io5";
import { Video } from "lucide-react"; 
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { useState } from "react";
import { addZeroToTime } from "utils/converter";

const isFirebaseLogsSongs = (
  log: any
): log is FirebaseLogsSongsInterface => {
  return (log as FirebaseLogsSongsInterface).status !== undefined;
};

const isFirebaseLogsTopPlayers = (
  log: any
): log is FirebaseLogsTopPlayersInterface => {
  return (log as FirebaseLogsTopPlayersInterface).type === "top_players_update";
};

const isFirebaseLogsRecording = (
  log: any
): log is FirebaseLogsRecordingsInterface => {
  return (log as FirebaseLogsRecordingsInterface).type === "recording_added";
};

const isFirebaseLogsDailyQuest = (
  log: any
): log is FirebaseLogsDailyQuestInterface => {
  return (log as FirebaseLogsDailyQuestInterface).type === "daily_quest_completed";
};

const isFirebaseLogsCaseOpen = (
  log: any
): log is FirebaseLogsCaseOpenInterface => {
  return (log as FirebaseLogsCaseOpenInterface).type === "case_open";
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
    ? `/static/images/rank/${itemImageId}.png`
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
          <FaGem size={7} />
          {itemRarity}
        </span>
      </div>

      {/* Image */}
      <div
        className="flex items-end justify-center px-3 py-4 mx-2 my-2 rounded-lg"
        style={{ background: `radial-gradient(ellipse at center, ${color}18 0%, transparent 70%)` }}
      >
        <img
          src={imgSrc}
          alt={itemName}
          className={`object-contain drop-shadow-xl ${itemType === "guitar" ? "h-36 w-auto -rotate-90" : "h-24 w-24"}`}
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

const FirebaseLogsCaseOpenItem = ({
  log,
  isNew,
  currentUserId,
}: {
  log: FirebaseLogsCaseOpenInterface;
  isNew: boolean;
  currentUserId: string;
}) => {
  const { timestamp, userName, uid, avatarUrl, userAvatarFrame, caseName, itemType, itemName, itemBrand, itemRarity, itemImageId } = log;
  const date = new Date(timestamp);
  const color = RARITY_COLORS[itemRarity] || RARITY_COLORS.Common;
  const imgSrc = itemType === "guitar"
    ? `/static/images/rank/${itemImageId}.png`
    : `/static/images/effects/${itemImageId}.png`;

  return (
    <LogItem isNew={isNew}>
      <TimeStamp date={date} />
      <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 w-full">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-2 font-semibold text-tertiary">
            <UserLink uid={uid} userName={userName} avatarUrl={avatarUrl} lvl={userAvatarFrame} />
          </span>
          <span className="text-secondText text-sm">opened</span>
          <span className="text-white font-bold text-sm">{caseName}</span>
          <span className="text-secondText text-sm">and got</span>
        </div>
        
        <div className="flex flex-row items-center justify-between md:justify-end gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
          <div className="flex flex-col items-start gap-2 flex-1 md:flex-row md:flex-wrap md:justify-end md:flex-initial min-w-0">
            <TooltipProvider>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-default items-center gap-1.5 bg-white/5 sm:bg-transparent p-1.5 sm:p-0 rounded-lg sm:rounded-none">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
                      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}40` }}
                    >
                      <FaGem size={8} />
                      {itemRarity}
                    </span>
                    <span className="font-bold text-sm" style={{ color }}>
                      {itemBrand} {itemName}
                    </span>
                    <img
                      src={imgSrc}
                      alt={itemName}
                      className={`h-7 w-7 object-contain opacity-80 ${itemType === "guitar" ? "-rotate-45" : ""}`}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  className="p-0 border-0 bg-transparent shadow-2xl"
                  side="top"
                >
                  <ItemTooltipCard
                    itemType={itemType}
                    itemName={itemName}
                    itemBrand={itemBrand}
                    itemRarity={itemRarity}
                    itemImageId={itemImageId}
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {log.id && (
            <div className="shrink-0">
              <LogReaction
                logId={log.id}
                reactions={log.reactions}
                currentUserId={currentUserId}
                disabled={log.uid === currentUserId}
              />
            </div>
          )}
        </div>
      </div>
    </LogItem>
  );
};

interface LogsBoxLayoutProps {
  logs: (
    | FirebaseLogsSongsInterface
    | FirebaseLogsInterface
    | FirebaseLogsTopPlayersInterface
    | FirebaseLogsRecordingsInterface
    | FirebaseLogsDailyQuestInterface
    | FirebaseLogsCaseOpenInterface
  )[];
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
    className={`my-4 flex flex-col md:flex-row flex-nowrap items-start md:items-center bg-main-opposed-bg p-3 sm:p-4 transition-all duration-300 rounded-xl ${
      isNew ? "border border-white/30" : ""
    }`}>
    {children}
  </div>
);

const getSongStatusMessage = (status: string, t: any): string => {
  return t(`song_status.${status}`);
};

const FirebaseLogsSongItem = ({
  log,
  isNew,
  currentUserId,
}: {
  log: FirebaseLogsSongsInterface;
  isNew: boolean;
  currentUserId: string;
}) => {
  const { t } = useTranslation("common");
  const { userName, data, songArtist, songTitle, status, uid, avatarUrl, userAvatarFrame } = log;
  const date = new Date(data);
  const message = getSongStatusMessage(status, t);

  return (
    <LogItem isNew={isNew}>
      <TimeStamp date={date} />
      <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 w-full">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className='inline-flex items-center gap-2 font-semibold text-tertiary'>
            <UserLink uid={uid} userName={userName} avatarUrl={avatarUrl} lvl={userAvatarFrame} />
          </span>
          <p className='text-secondText text-sm'>
            {message}{" "}
            <span className='text-white'>
              {songArtist} {songTitle}
            </span>
            {status !== "difficulty_rate" && "."}
          </p>
        </div>
        
        <div className="flex items-center justify-end flex-1 sm:shrink-0 mt-1 sm:mt-0">
          {log.id && (
            <LogReaction
              logId={log.id}
              reactions={log.reactions}
              currentUserId={currentUserId}
              disabled={log.uid === currentUserId}
            />
          )}
        </div>
      </div>
    </LogItem>
  );
};

const FirebaseLogsRecordingItem = ({
  log,
  isNew,
  currentUserId,
  onView,
}: {
  log: FirebaseLogsRecordingsInterface;
  isNew: boolean;
  currentUserId: string;
  onView: (id: string) => void;
}) => {
  // const { t } = useTranslation("recordings"); // Add translation if needed
  const { userName, timestamp, songArtist, songTitle, videoUrl, recordingTitle, uid, avatarUrl, userAvatarFrame, recordingId } = log;
  const date = new Date(timestamp);

  // Simple YouTube ID extraction for log preview maybe? Or just link
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const _videoId = getYoutubeId(videoUrl);

  return (
    <LogItem isNew={isNew}>
      <TimeStamp date={date} />
      <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 w-full">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className='inline-flex items-center gap-2 font-semibold text-tertiary'>
            <UserLink uid={uid} userName={userName} avatarUrl={avatarUrl} lvl={userAvatarFrame} />
          </span>
          <p className='text-secondText text-sm'>
            <Video className="mr-1.5 inline-block h-3 w-3 text-cyan-400" />
            added a new recording:{" "}
            {recordingId ? (
              <button 
                  onClick={() => onView(recordingId)}
                  className='font-bold text-white hover:text-cyan-400 hover:underline transition-colors text-left'
              >
                  {recordingTitle}
              </button>
            ) : (
              <a 
                  href={videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className='font-bold text-white hover:text-cyan-400 hover:underline transition-colors'
              >
                  {recordingTitle}
              </a>
            )}
            {" "}
            {songTitle && (
               <span className="text-xs opacity-70">({songArtist} - {songTitle})</span>
            )}
          </p>
        </div>
        
        <div className="flex items-center justify-end flex-1 sm:shrink-0 mt-1 sm:mt-0">
          {log.id && (
            <LogReaction
              logId={log.id}
              reactions={log.reactions}
              currentUserId={currentUserId}
              disabled={log.uid === currentUserId}
            />
          )}
        </div>
      </div>
    </LogItem>
  );
};

const FirebaseLogsItem = ({
  log,
  isNew,
  currentUserId,
}: {
  log: FirebaseLogsInterface;
  isNew: boolean;
  currentUserId: string;
}) => {
  const { t, i18n } = useTranslation(["common", "exercises"]);
  const { userName, points, data, uid, newLevel, newAchievements, avatarUrl, planId, songTitle, songArtist, exerciseTitle, micPerformance, earTrainingPerformance, userAvatarFrame, timestamp } = log;
  const date = new Date(timestamp as string);

  const plan: any = planId ? defaultPlans.find(p => p.id === planId) : null;

  const _currentLang = (i18n.language === 'pl' || i18n.language === 'en') ? i18n.language : 'en';
  
  const getLocalizedTitle = (title: any) => {
      if (!title) return null;
      return title;
  };

  const planTitle = plan ? getLocalizedTitle(plan.title) : null;

  return (
    <LogItem isNew={isNew}>
      <TimeStamp date={date} />
      <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 w-full">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className='inline-flex items-center gap-2 font-semibold text-tertiary'>
            <UserLink
              uid={uid}
              userName={userName}
              avatarUrl={avatarUrl ?? undefined}
              lvl={userAvatarFrame ?? newLevel?.level}
            />
          </span>{" "}
          <span className='text-secondText text-sm'>{t("common:logsBox.get")}</span>
          <span className='mr-1 text-main text-sm'>
            +{points}
            <span className='text-secondText'> {t("common:logsBox.points")}</span>
          </span>

          {newLevel?.isNewLevel && (
            <span className='text-secondText text-sm'>
              {" "}
              {t("common:logsBox.lvl_up")}
              <span className='ml-1 text-main'>
                {newLevel.level}
                {" lvl"}
              </span>
            </span>
          )}
          {newAchievements?.length > 0 && (
            <span className='inline-flex items-center gap-2 text-sm'>
              {t("common:logsBox.achievements")}{" "}
              {newAchievements.map((achievement, index) => (
                <span key={index} className='inline-flex items-center gap-2'>
                  <AchievementIcon id={achievement} />
                </span>
              ))}
            </span>
          )}
        </div>

        <div className="flex flex-row items-center justify-between md:justify-end gap-3 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
          <div className="flex flex-col items-start gap-2 flex-1 md:flex-row md:flex-wrap md:justify-end md:flex-initial min-w-0">
          {planTitle && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded border opacity-90 text-cyan-400 bg-cyan-950/30 border-cyan-500/20 max-w-[250px] md:max-w-[200px] lg:max-w-[450px] whitespace-normal break-words">
                <span className="shrink-0 font-bold tracking-wide text-[9px] sm:text-[10px] opacity-80 uppercase-none">
                    Plan
                </span>
                <span className="font-medium">{planTitle}</span>
              </span>
          )}

          {exerciseTitle && !exerciseTitle.includes("Practicing: ") && !planTitle && !songTitle && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 rounded border opacity-90 text-emerald-400 bg-emerald-950/30 border-emerald-500/20 max-w-[250px] md:max-w-[200px] lg:max-w-[450px] whitespace-normal break-words">
                <span className="shrink-0 font-bold tracking-wide text-[9px] sm:text-[10px] opacity-80 uppercase-none">
                    Exercise
                </span>
                <span className="font-medium">{exerciseTitle}</span>
              </span>
          )}

          {micPerformance && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs px-2 py-0.5 rounded border opacity-90 text-blue-400 bg-blue-950/30 border-blue-500/20">
                <span className="flex items-center gap-1">
                    <span className="font-bold text-main">{micPerformance.score}</span>
                    <span className="text-[8px] sm:text-[9px] uppercase opacity-70 tracking-tighter">pts</span>
                </span>
                <span className="w-px h-2.5 bg-blue-500/30" />
                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold">
                    {micPerformance.accuracy}%
                </span>
              </span>
          )}

          {earTrainingPerformance && (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs px-2 py-0.5 rounded border opacity-90 text-amber-400 bg-amber-950/30 border-amber-500/20">
                <span className="text-[8px] sm:text-[9px] uppercase opacity-70 tracking-widest">Score:</span>
                <span className="font-bold">{earTrainingPerformance.score}</span>
              </span>
          )}

          {songTitle && songArtist && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-purple-400 bg-purple-950/30 px-2 py-0.5 rounded border border-purple-500/20 opacity-90 max-w-[250px] md:max-w-[200px] lg:max-w-[450px] whitespace-normal break-words">
                <span className="shrink-0 font-bold tracking-wide text-[9px] sm:text-[10px] opacity-80 uppercase-none">Song</span>
                <span className="font-medium">{songArtist} - {songTitle}</span>
              </span>
          )}

          </div>
          {log.id && (
            <div className="shrink-0">
              <LogReaction
                logId={log.id}
                reactions={log.reactions}
                currentUserId={currentUserId}
                disabled={log.uid === currentUserId}
              />
            </div>
          )}
        </div>
      </div>
    </LogItem>
  );
};

// Podkomponenty dla FirebaseLogsTopPlayersItem


const PlayerAvatar = ({
  player,
  isFirst,
}: {
  player: TopPlayerData;
  isFirst: boolean;
}) => (
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
  t,
}: {
  player: TopPlayerData;
  index: number;
  t: (key: string) => string;
}) => {
  const isTop3 = index < 3;
  
  return (
    <div className='flex items-center gap-2 sm:gap-4 px-3 py-2 sm:px-5 sm:py-3'>
      <div className='w-6 flex-shrink-0 text-center font-bold text-white/50 text-sm'>
        #{index + 1}
      </div>

      {/* User info with photo */}
      <div className='flex items-center gap-1 sm:gap-2'>
        <PlayerAvatar player={player} isFirst={index === 0} />

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
          <PlayerRow key={player.uid} player={player} index={index} t={t} />
        ))}
      </div>
    </div>
  );
};
const FirebaseLogsDailyQuestItem = ({
  log,
  isNew,
  currentUserId,
}: {
  log: FirebaseLogsDailyQuestInterface;
  isNew: boolean;
  currentUserId: string;
}) => {
  const { timestamp, userName, uid, avatarUrl, userAvatarFrame, points } = log;
  const date = new Date(timestamp);

  return (
    <LogItem isNew={isNew}>
      <TimeStamp date={date} />
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <span className='inline-flex items-center gap-2 font-semibold text-tertiary'>
            <UserLink uid={uid} userName={userName} avatarUrl={avatarUrl} lvl={userAvatarFrame} />
          </span>
          <p className='text-secondText text-sm'>
            completed all <span className="text-yellow-400 font-bold italic tracking-tighter">Daily Quests!</span>
          </p>
        </div>

        <div className="flex flex-row items-center justify-between md:justify-end gap-3 shrink-0 mt-2 md:mt-0 w-full md:w-auto">
          <div className="flex flex-col items-start gap-2 flex-1 md:flex-row md:flex-wrap md:justify-end md:flex-initial min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] ">
              <FaTrophy className="h-2.5 w-2.5" />
              Claimed +{points} Pt
            </span>
          </div>
          {log.id && (
            <div className="shrink-0">
              <LogReaction
                logId={log.id}
                reactions={log.reactions}
                currentUserId={currentUserId}
                disabled={log.uid === currentUserId}
              />
            </div>
          )}
        </div>
      </div>
    </LogItem>
  );
};

const Logs = ({ logs, marksLogsAsRead, currentUserId }: LogsBoxLayoutProps) => {
  const { isNewMessage } = useUnreadMessages("logs");
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
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

  return (
    <>
      <div className="mb-2">
        <OnlineUsers />
      </div>
      <div ref={spanRef} className='h-1' />
      {logs.map((log) => (
        <div
          key={(log as any).id || String((log as any).timestamp) + (log as any).uid + (log as any).userName || "topPlayers"}
          className='mr-2'>
          {isFirebaseLogsSongs(log) ? (
            <FirebaseLogsSongItem 
              log={log} 
              isNew={isNewMessage(log.data || (log as any).timestamp)} 
              currentUserId={currentUserId}
            />
          ) : isFirebaseLogsTopPlayers(log) ? (
            <FirebaseLogsTopPlayersItem
              log={log}
              isNew={isNewMessage(log.data)}
            />
           ) : isFirebaseLogsRecording(log) ? (
             <FirebaseLogsRecordingItem
               log={log}
               isNew={isNewMessage((log as any).data || (log as any).timestamp)}
               currentUserId={currentUserId}
               onView={setActiveRecordingId}
             />
          ) : isFirebaseLogsDailyQuest(log) ? (
            <FirebaseLogsDailyQuestItem
              log={log}
              isNew={isNewMessage((log as any).data || (log as any).timestamp)}
              currentUserId={currentUserId}
            />
          ) : isFirebaseLogsCaseOpen(log) ? (
            <FirebaseLogsCaseOpenItem
              log={log}
              isNew={isNewMessage((log as any).data || (log as any).timestamp)}
              currentUserId={currentUserId}
            />
          ) : (
            <FirebaseLogsItem 
              log={log as FirebaseLogsInterface} 
              isNew={isNewMessage((log as any).data || (log as any).timestamp)} 
              currentUserId={currentUserId}
            />
          )}
        </div>
      ))}

      <RecordingViewModal 
        isOpen={!!activeRecordingId}
        onClose={() => setActiveRecordingId(null)}
        recordingId={activeRecordingId}
      />
    </>
  );
};

export default Logs;
