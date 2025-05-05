import { UserTooltip } from "components/UserTooltip/UserTooltip";
import Achievement from "feature/achievements/components/Achievement";
import { useUnreadMessages } from "feature/chat/hooks/useUnreadMessages";
import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";
import type {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsTopPlayersInterface,
} from "feature/logs/types/logs.type";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FaChevronUp,
  FaCrown,
  FaMedal,
  FaRegStar,
  FaTrophy,
} from "react-icons/fa";
import { IoMdMusicalNotes } from "react-icons/io";
import { IoCalendarOutline, IoPersonOutline } from "react-icons/io5";
import { addZeroToTime } from "utils/converter";

const isFirebaseLogsSongs = (
  log:
    | FirebaseLogsInterface
    | FirebaseLogsSongsInterface
    | FirebaseLogsTopPlayersInterface
): log is FirebaseLogsSongsInterface => {
  return (log as FirebaseLogsSongsInterface).songArtist !== undefined;
};

const isFirebaseLogsTopPlayers = (
  log:
    | FirebaseLogsInterface
    | FirebaseLogsSongsInterface
    | FirebaseLogsTopPlayersInterface
): log is FirebaseLogsTopPlayersInterface => {
  return (log as FirebaseLogsTopPlayersInterface).type === "top_players_update";
};

interface LogsBoxLayoutProps {
  logs: (
    | FirebaseLogsSongsInterface
    | FirebaseLogsInterface
    | FirebaseLogsTopPlayersInterface
  )[];
  marksLogsAsRead: () => void;
}

const TimeStamp = ({ date }: { date: Date }) => (
  <p className='mr-3 w-[23%] max-w-[8rem] border-r-2 border-main-opposed-400 p-1 pr-2 text-[0.55rem] text-secondText lg:text-xs'>
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
}: {
  uid: string | undefined;
  userName: string;
}) => {
  if (!uid) return <span>{userName}</span>;

  return (
    <UserTooltip userId={uid}>
      <Link className='text-white hover:underline' href={`/user/${uid}`}>
        {userName}
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
    className={`my-4 flex flex-row flex-nowrap items-center bg-main-opposed-bg p-4 transition-all duration-300 radius-default ${
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
}: {
  log: FirebaseLogsSongsInterface;
  isNew: boolean;
}) => {
  const { t } = useTranslation("common");
  const { userName, data, songArtist, songTitle, status, uid } = log;
  const date = new Date(data);
  const message = getSongStatusMessage(status, t);

  return (
    <LogItem isNew={isNew}>
      <TimeStamp date={date} />
      <div className='flex w-[80%] flex-wrap items-center gap-1'>
        <span className='inline-flex items-center gap-2 font-semibold text-tertiary'>
          <IoMdMusicalNotes className='text-secondText' />
          <UserLink uid={uid} userName={userName} />
        </span>
        <p className='text-secondText'>
          {message}{" "}
          <span className='text-white'>
            {songArtist} {songTitle}
          </span>
          {status !== "difficulty_rate" && "."}
        </p>
      </div>
    </LogItem>
  );
};

const FirebaseLogsItem = ({
  log,
  isNew,
}: {
  log: FirebaseLogsInterface;
  isNew: boolean;
}) => {
  const { t } = useTranslation("common");
  const { userName, points, data, uid, newLevel, newAchievements } = log;
  const date = new Date(data);

  return (
    <LogItem isNew={isNew}>
      <TimeStamp date={date} />
      <div className='flex w-[80%] flex-wrap items-center gap-1'>
        <span className='inline-flex items-center gap-2 font-semibold text-tertiary'>
          <IoPersonOutline className='text-secondText' />
          <UserLink uid={uid} userName={userName} />
        </span>{" "}
        <span className='text-secondText'>{t("logsBox.get")}</span>
        <span className='mr-1 text-main'>
          +{points}
          <span className='text-secondText'> {t("logsBox.points")}</span>
        </span>
        {newLevel.isNewLevel && (
          <span className='text-secondText'>
            {" "}
            {t("logsBox.lvl_up")}
            <span className='text-main'>
              {newLevel.level}
              {" lvl"}
            </span>
          </span>
        )}
        {newAchievements.length > 0 && (
          <span className='inline-flex items-center gap-2'>
            {t("logsBox.achievements")}{" "}
            {newAchievements.map((achievement, index) => (
              <span key={index} className='inline-flex items-center gap-2'>
                <Achievement id={achievement} />
              </span>
            ))}
          </span>
        )}
      </div>
    </LogItem>
  );
};

// Podkomponenty dla FirebaseLogsTopPlayersItem
const PlayerRankBadge = ({ index }: { index: number }) => {
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return (
          <div className='flex items-center justify-center'>
            <FaCrown className='animate-pulse text-2xl text-yellow-400' />
          </div>
        );
      case 1:
        return <FaMedal className='text-xl text-gray-300' />;
      case 2:
        return <FaMedal className='text-xl text-amber-600' />;
      default:
        return <FaRegStar className='text-lg text-white/70' />;
    }
  };

  return (
    <div className='w-6 flex-shrink-0 text-center sm:w-7'>
      {getMedalIcon(index)}
    </div>
  );
};

const PlayerAvatar = ({
  player,
  isFirst,
}: {
  player: TopPlayerData;
  isFirst: boolean;
}) => (
  <div className='relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-second-400/30 bg-second-500/50 sm:h-8 sm:w-8'>
    {player.avatar ? (
      <img
        src={player.avatar}
        alt={player.displayName}
        width={32}
        height={32}
        className='h-full w-full object-cover'
        onError={(e) => {
          // Fallback to icon on error
          e.currentTarget.style.display = "none";
          e.currentTarget.parentElement?.setAttribute(
            "data-image-error",
            "true"
          );
        }}
      />
    ) : (
      <IoPersonOutline className='text-lg text-white/70 sm:text-xl' />
    )}
    {/* Fallback icon when image fails to load */}
    {player.avatar && (
      <div
        data-image-fallback
        className='absolute inset-0 flex hidden items-center justify-center'>
        <IoPersonOutline className='text-lg text-white/70 sm:text-xl' />
      </div>
    )}
    {isFirst && (
      <div className='absolute -bottom-1 flex w-full justify-center'>
        <FaChevronUp className='text-xs text-yellow-400' />
      </div>
    )}
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
  <div className='flex flex-wrap items-center gap-2 border-b border-second-400/60 bg-gradient-to-r from-second-500/40 to-second-500/20 px-2 py-2 sm:px-4 sm:py-3'>
    <div className='rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-1'>
      <FaTrophy className='text-lg text-yellow-400 sm:text-xl' />
    </div>
    <h3 className='text-sm font-bold text-white sm:text-base'>
      {t("logsBox.top_players")}
    </h3>
    <span className='ml-1 rounded-md border border-second-500/50 bg-second-600/40 px-1.5 py-0.5 text-xs font-medium text-tertiary sm:ml-2 sm:px-2'>
      {seasonName}
    </span>

    {/* Right side with date info - on larger screens */}
    <div className='ml-auto hidden items-center text-xs text-secondText sm:flex'>
      {daysLeftInSeason !== undefined && (
        <div className='mr-4 flex items-center rounded-full border border-second-500/50 bg-gradient-to-r from-second-600/80 to-second-600/60 px-2 py-1'>
          <IoCalendarOutline className='mr-1 text-tertiary' />
          <span className='font-semibold'>{daysLeftInSeason}</span>{" "}
          <span className='ml-1'>{t("logsBox.days_left")}</span>
        </div>
      )}
      <span className='opacity-70'>
        {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
        {addZeroToTime(date.getMinutes())}
      </span>
    </div>

    {/* Days left - on mobile only */}
    {daysLeftInSeason !== undefined && (
      <div className='mt-1 flex w-full items-center justify-end text-xs text-secondText sm:hidden'>
        <div className='flex items-center rounded-full border border-second-500/50 bg-gradient-to-r from-second-600/80 to-second-600/60 px-2 py-1'>
          <IoCalendarOutline className='mr-1 text-tertiary' />
          <span className='font-semibold'>{daysLeftInSeason}</span>{" "}
          <span className='ml-1'>{t("logsBox.days_left")}</span>
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
  const getRowBackground = (position: number) => {
    switch (position) {
      case 0:
        return "bg-gradient-to-r from-yellow-900/30 via-yellow-600/10 to-yellow-900/5";
      case 1:
        return "bg-gradient-to-r from-gray-600/20 via-gray-400/5 to-gray-600/0";
      case 2:
        return "bg-gradient-to-r from-amber-800/20 via-amber-700/5 to-amber-800/0";
      default:
        return "";
    }
  };

  return (
    <div
      className={`flex items-center gap-1 px-2 py-2 transition-all sm:gap-3 sm:px-4 sm:py-3 ${getRowBackground(
        index
      )}`}>
      <PlayerRankBadge index={index} />

      <div className='w-5 flex-shrink-0 text-center text-sm font-bold text-white sm:w-6 sm:text-base'>
        #{index + 1}
      </div>

      {/* User info with photo */}
      <div className='flex items-center gap-1 sm:gap-2'>
        <PlayerAvatar player={player} isFirst={index === 0} />

        <UserTooltip userId={player.uid}>
          <Link
            className={`text-sm font-semibold hover:text-main hover:underline sm:text-base ${
              index === 0 ? "text-yellow-300" : "text-white"
            }`}
            href={`/user/${player.uid}`}>
            {player.displayName}
          </Link>
        </UserTooltip>
      </div>

      <div className='ml-auto'>
        <div className='rounded-lg border border-second-500/20 bg-second-600/30 px-2 py-1 text-secondText'>
          <span className='text-xs'>{t("logsBox.points")}:</span>{" "}
          <span className='font-bold text-main'>{player.points}</span>
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
    <div className='flex w-[80%] flex-col gap-2'>
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
      className={`my-6 flex flex-col overflow-hidden bg-gradient-to-br from-main-opposed-bg/95 via-main-opposed-bg/90 to-second-600/10 shadow-lg transition-all duration-300 radius-default ${
        isNew ? "border border-white/30 shadow-xl" : ""
      }`}>
      <SeasonHeader
        seasonName={seasonName}
        daysLeftInSeason={daysLeftInSeason}
        date={date}
        t={t}
      />

      <div className='divide-y divide-second-400/10'>
        {topPlayers.map((player, index) => (
          <PlayerRow key={player.uid} player={player} index={index} t={t} />
        ))}
      </div>
    </div>
  );
};

const Logs = ({ logs, marksLogsAsRead }: LogsBoxLayoutProps) => {
  const { isNewMessage } = useUnreadMessages("logs");
  const spanRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          marksLogsAsRead();
        }
      },
      { threshold: 1, rootMargin: "-400px" }
    );

    if (spanRef.current) {
      observer.observe(spanRef.current);
    }

    return () => observer.disconnect();
  }, [marksLogsAsRead]);

  return (
    <>
      <div ref={spanRef} className='h-1' />
      {logs.map((log) => (
        <div
          key={log.data + (log as any).userName || "topPlayers"}
          className='mr-2'>
          {isFirebaseLogsSongs(log) ? (
            <FirebaseLogsSongItem log={log} isNew={isNewMessage(log.data)} />
          ) : isFirebaseLogsTopPlayers(log) ? (
            <FirebaseLogsTopPlayersItem
              log={log}
              isNew={isNewMessage(log.data)}
            />
          ) : (
            <FirebaseLogsItem log={log} isNew={isNewMessage(log.data)} />
          )}
        </div>
      ))}
    </>
  );
};

export default Logs;
