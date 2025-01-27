import { UserTooltip } from "components/UserTooltip/UserTooltip";
import type {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "feature/logs/types/logs.type";
import { useUnreadMessages } from "feature/chat/hooks/useUnreadMessages";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { IoMdMusicalNotes } from "react-icons/io";
import { IoPersonOutline } from "react-icons/io5";
import { addZeroToTime } from "utils/converter";

// Type guard
const isFirebaseLogsSongs = (
  log: FirebaseLogsInterface | FirebaseLogsSongsInterface
): log is FirebaseLogsSongsInterface => {
  return (log as FirebaseLogsSongsInterface).songArtist !== undefined;
};

interface LogsBoxLayoutProps {
  logs: (FirebaseLogsSongsInterface | FirebaseLogsInterface)[];
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

const getSongStatusMessage = (status: string): string => {
  const messages = {
    learned: " nauczył się utworu ",
    wantToLearn: " dodał utwór ",
    learning: " uczy się utworu ",
    added: " dodał utwór ",
    difficulty_rate: " ocenił trudność utworu ",
  };
  return (
    messages[status as keyof typeof messages] ??
    " zaktualizował swoje postępy w nauce utworu "
  );
};

const FirebaseLogsSongItem = ({
  log,
  isNew,
}: {
  log: FirebaseLogsSongsInterface;
  isNew: boolean;
}) => {
  const { userName, data, songArtist, songTitle, status, uid } = log;
  const date = new Date(data);
  const message = getSongStatusMessage(status);

  return (
    <LogItem isNew={isNew}>
      <TimeStamp date={date} />
      <div className='flex w-[80%] flex-wrap items-center gap-1'>
        <span className='inline-flex items-center gap-2 font-semibold text-tertiary'>
          <IoMdMusicalNotes className='text-secondText' />
          <UserLink uid={uid} userName={userName} />
        </span>
        <p className='text-secondText'>
          {message}
          <span className='text-white'>
            {songArtist} {songTitle}
          </span>
          {status === "wantToLearn" &&
            " do swojej listy utworów, które chce się nauczyć."}
          {status === "added" && " do swojej listy utworów."}
          {status === "learning" && "."}
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
  const { userName, points, data, uid } = log;
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
          <span className='text-secondText'>{t("logsBox.points")}</span>
        </span>
      </div>
    </LogItem>
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
        <div key={log.data + log.userName} className='mr-2'>
          {isFirebaseLogsSongs(log) ? (
            <FirebaseLogsSongItem log={log} isNew={isNewMessage(log.data)} />
          ) : (
            <FirebaseLogsItem log={log} isNew={isNewMessage(log.data)} />
          )}
        </div>
      ))}
    </>
  );
};

export default Logs;
