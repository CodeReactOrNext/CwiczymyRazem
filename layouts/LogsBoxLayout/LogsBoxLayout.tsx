import Achievement from "components/Achievement";
import { FaSpinner } from "react-icons/fa";
import { FirebaseLogsInterface } from "utils/firebase/firebase.types";


export interface LogsBoxLayoutProps {
  logs: FirebaseLogsInterface[] | null;
}

const addZeroToTime = (time: number) => {
  if (time.toString().length === 1) {
    return "0" + time.toString();
  }
  return time.toString();
};

const LogsBoxLayout = ({ logs }: LogsBoxLayoutProps) => {
  return logs ? (
    <div className='order-4 row-span-1 h-80  overflow-scroll border-4 border-tertiary bg-main-opposed p-5'>
      {logs.map(
        ({ userName, points, data, newAchievements, newLevel }, index) => {
          const date = new Date(data);

          return (
            <div
              key={index}
              className='flex flex-row flex-wrap items-center py-2 text-sm sm:text-base'>
              <p>
                <span className='mr-2 text-xs'>
                  {date.toLocaleDateString() +
                    " " +
                    addZeroToTime(date.getHours()) +
                    ":" +
                    addZeroToTime(date.getMinutes())}
                </span>
              </p>
              <p className='mr-1'>
                <span className='text-tertiary'>{userName}</span> zdobył
                <span className='m-1 text-main'> +{points}</span>pkt.
              </p>
              {newLevel.isNewLevel && (
                <p className='mr-1'>
                  Awansował na
                  <span className='ml-1 text-main'>{newLevel.level}</span>{" "}
                  poziom
                </p>
              )}
              {newAchievements.length !== 0 && (
                <>
                  <p>Zdobył:</p>
                  {newAchievements.map((id, index) => (
                    <div className='mx-1' key={index}>
                      <Achievement id={id} />
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        }
      )}
    </div>
  ) : (
    <FaSpinner />
  );
};

export default LogsBoxLayout;
