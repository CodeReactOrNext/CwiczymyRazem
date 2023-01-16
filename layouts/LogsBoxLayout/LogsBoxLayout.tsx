import { FaSpinner } from "react-icons/fa";
import Achievement from "components/Achievement";
import { FirebaseLogsInterface } from "utils/firebase/client/firebase.types";
import { addZeroToTime } from "utils/converter/addZeroToTime";

export interface LogsBoxLayoutProps {
  logs: FirebaseLogsInterface[] | null;
}

const LogsBoxLayout = ({ logs }: LogsBoxLayoutProps) => {
  return logs ? (
    <div className='line order-4 row-span-1 mt-5 h-80 overflow-scroll border-4 border-tertiary bg-main-opposed p-1 font-openSans text-xs leading-5 xs:p-3 md:mt-0 sm:p-5 lg:text-sm'>
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
    </div>
  ) : (
    <FaSpinner />
  );
};

export default LogsBoxLayout;
