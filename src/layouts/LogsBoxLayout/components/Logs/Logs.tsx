import Achievement from "components/Achievement";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { addZeroToTime } from "utils/converter";
import { IoPersonOutline } from "react-icons/io5";

import { FirebaseLogsInterface } from "utils/firebase/client/firebase.types";

export interface LogsBoxLayoutProps {
  logs: FirebaseLogsInterface[];
}
const Logs = ({ logs }: LogsBoxLayoutProps) => {
  const { t } = useTranslation("common");

  return (
    <>
      {logs.map(
        ({ userName, points, data, newAchievements, newLevel, uid }) => {
          const date = new Date(data);
          return (
            <div
              key={data + userName}
              className=' my-4 flex flex-row  flex-nowrap items-center bg-main-opposed-bg   p-4  text-white radius-default '>
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
                  {uid ? (
                    <Link href={"/user/" + uid}>{userName}</Link>
                  ) : (
                    userName
                  )}
                </span>{" "}
                {t("logsBox.get")}
                <span className='m-1 text-main'> +{points}</span>
                {t("logsBox.points")}
                {newLevel.isNewLevel && (
                  <p className='mr-1'>
                    {t("logsBox.lvl_up")}
                    <span className='ml-1 text-main'>
                      {newLevel.level}
                    </span>{" "}
                    {t("logsBox.lvl")}
                  </p>
                )}
                {newAchievements.length !== 0 && (
                  <>
                    <p> {t("logsBox.achievements")}</p>
                    {newAchievements.map((id) => (
                      <div className='mx-1' key={id}>
                        <Achievement id={id} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        }
      )}
    </>
  );
};
export default Logs;
