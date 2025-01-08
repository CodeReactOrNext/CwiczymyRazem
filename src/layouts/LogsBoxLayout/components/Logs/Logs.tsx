import Achievement from "components/Achievement";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { addZeroToTime } from "utils/converter";
import { IoPersonOutline } from "react-icons/io5";
import {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "utils/firebase/client/firebase.types";
import { IoMdMusicalNotes } from "react-icons/io";
import { useEffect, useRef } from "react";

const isFirebaseLogsSongs = (
  log: FirebaseLogsInterface | FirebaseLogsSongsInterface
): log is FirebaseLogsSongsInterface => {
  return (log as FirebaseLogsSongsInterface).songArtist !== undefined;
};

interface LogsBoxLayoutProps {
  logs: (FirebaseLogsSongsInterface | FirebaseLogsInterface)[];
  marksLogsAsRead: () => void;
}

const Logs = ({ logs, marksLogsAsRead }: LogsBoxLayoutProps) => {
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
      <span ref={spanRef} />
      {logs.map((log) =>
        isFirebaseLogsSongs(log) ? (
          <FirebaseLogsSongItem key={log.data + log.userName} log={log} />
        ) : (
          <FirebaseLogsItem key={log.data + log.userName} log={log} />
        )
      )}
    </>
  );
};
const FirebaseLogsSongItem = ({ log }: { log: FirebaseLogsSongsInterface }) => {
  const { userName, data, songArtist, songTitle, status, uid } = log;

  const date = new Date(data);

  let message = "";

  switch (status) {
    case "learned":
      message = ` nauczył się utworu "${songTitle}" autorstwa ${songArtist}.`;
      break;
    case "wantToLearn":
      message = ` dodał utwór "${songTitle}" autorstwa ${songArtist} do swojej listy utworów, które chce się nauczyć.`;
      break;
    case "learning":
      message = ` uczy się utworu "${songTitle}" autorstwa ${songArtist}.`;
      break;
    case "added":
      message = ` dodał utwór "${songTitle}" autorstwa ${songArtist} do swojej listy utworów.`;
      break;
    case "difficulty_rate":
      message = ` ocenił trudność utworu "${songTitle}" autorstwa ${songArtist}.`;
      break;
    default:
      message = ` zaktualizował swoje postępy w nauce utworu "${songTitle}".`;
      break;
  }

  return (
    <div
      key={data + userName}
      className='my-4 flex flex-row flex-nowrap items-center bg-main-opposed-bg p-4 text-white radius-default'>
      <p className='mr-3 w-[20%] max-w-[7rem] border-r-2 border-main-opposed-400 p-1 pr-2 text-[0.55rem] text-secondText lg:text-xs'>
        {date.toLocaleDateString() +
          " " +
          addZeroToTime(date.getHours()) +
          ":" +
          addZeroToTime(date.getMinutes())}
      </p>
      <div className='flex w-[80%] flex-wrap items-center gap-1 '>
        <span className='inline-flex items-center gap-2 font-semibold text-tertiary'>
          <IoMdMusicalNotes className='text-white' />
          {uid ? <Link href={"/user/" + uid}>{userName}</Link> : userName}
        </span>
        <p>{message}</p>
      </div>
    </div>
  );
};
const FirebaseLogsItem = ({ log }: { log: FirebaseLogsInterface }) => {
  const { t } = useTranslation("common");
  const { userName, points, data, uid } = log;

  const date = new Date(data);

  return (
    <div
      key={data + userName}
      className='my-4 flex flex-row flex-nowrap items-center bg-main-opposed-bg p-4 text-white radius-default'>
      <p className='mr-3 w-[20%] max-w-[7rem] border-r-2 border-main-opposed-400 p-1 pr-2 text-[0.55rem] text-secondText lg:text-xs'>
        {date.toLocaleDateString() +
          " " +
          addZeroToTime(date.getHours()) +
          ":" +
          addZeroToTime(date.getMinutes())}
      </p>
      <div className='flex w-[80%] flex-wrap items-center gap-1 '>
        <span className='inline-flex items-center gap-2 font-semibold text-tertiary'>
          <IoPersonOutline className='text-white' />
          {uid ? <Link href={"/user/" + uid}>{userName}</Link> : userName}
        </span>{" "}
        {t("logsBox.get")}
        <span className='m-1 text-main'>+{points}</span>
        {t("logsBox.points")}
      </div>
    </div>
  );
};

export default Logs;
