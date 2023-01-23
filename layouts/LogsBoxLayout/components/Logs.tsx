import Achievement from "components/Achievement";

import { addZeroToTime } from "utils/converter/addZeroToTime";
import { FirebaseLogsInterface } from "utils/firebase/client/firebase.types";

export interface LogsBoxLayoutProps {
  logs: FirebaseLogsInterface[];
}
const Logs = ({ logs }: LogsBoxLayoutProps) => {
  return (
    <>
      {logs.map(({ userName, points, data, newAchievements, newLevel }) => {
        const date = new Date(data);
        return (
          <div
            key={data + userName}
            className='flex flex-row flex-nowrap  items-center border-b-2 border-main-opposed-400 py-2 '>
            <p className='mr-2 w-[20%] border-r-2 border-main-opposed-400 pr-2 text-[0.55rem]  lg:text-xs'>
              {date.toLocaleDateString() +
                " " +
                addZeroToTime(date.getHours()) +
                ":" +
                addZeroToTime(date.getMinutes())}
            </p>
            <div className='flex w-[80%] flex-wrap '>
              <p className='mr-1'>
                <span className='text-tertiary'>{userName}</span> zdobył
                <span className='m-1 text-second-50'> +{points}</span>pkt.
              </p>
              {newLevel.isNewLevel && (
                <p className='mr-1'>
                  Awansował na
                  <span className='ml-1 text-second-50'>
                    {newLevel.level}
                  </span>{" "}
                  poziom
                </p>
              )}
              {newAchievements.length !== 0 && (
                <>
                  <p>Osiągnięcia:</p>
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
      })}
    </>
  );
};
export default Logs;
