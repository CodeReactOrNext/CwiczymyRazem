import Achievement from "components/Achievement";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { addZeroToTime } from "utils/converter/addZeroToTime";
import { FirebaseLogsInterface } from "utils/firebase/client/firebase.types";

export interface LogsBoxLayoutProps {
  logs: FirebaseLogsInterface[];
}
const Logs = ({ logs }: LogsBoxLayoutProps) => {
  const { t } = useTranslation("common");
  console.log(logs);

  return (
    <>
      {logs.map(
        ({ userName, points, data, newAchievements, newLevel, uid }) => {
          const date = new Date(data);
          return (
            <div
              key={data + userName}
              className='flex flex-row flex-nowrap  items-center border-b-2 border-main-opposed-400 py-2 '>
              <p className='mr-2 w-[20%] max-w-[7rem] border-r-2 border-main-opposed-400 p-1 pr-2 text-[0.55rem]  lg:text-xs'>
                {date.toLocaleDateString() +
                  " " +
                  addZeroToTime(date.getHours()) +
                  ":" +
                  addZeroToTime(date.getMinutes())}
              </p>
              <div className='flex w-[80%] flex-wrap '>
                <p className='mr-1'>
                  <span className='text-tertiary'>
                    {uid ? (
                      <Link href={"/user/" + uid}>{userName}</Link>
                    ) : (
                      userName
                    )}
                  </span>{" "}
                  {t("logsBox.get")}
                  <span className='m-1 text-second-text'> +{points}</span>
                  {t("logsBox.points")}
                </p>
                {newLevel.isNewLevel && (
                  <p className='mr-1'>
                    {t("logsBox.lvl_up")}
                    <span className='ml-1 text-second-text'>
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
