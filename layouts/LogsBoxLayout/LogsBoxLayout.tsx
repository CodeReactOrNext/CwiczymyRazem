import { FaSpinner } from "react-icons/fa";
import Achievement from "components/Achievement";
import { FirebaseLogsInterface } from "utils/firebase/client/firebase.types";
import { addZeroToTime } from "utils/converter/addZeroToTime";

export interface LogsBoxLayoutProps {
  logs: FirebaseLogsInterface[] | null;
}

const LogsBoxLayout = ({ logs }: LogsBoxLayoutProps) => {
  return logs ? (
    <div className='order-4 row-span-1 h-80 overflow-scroll  border-4 border-tertiary bg-main-opposed p-5 '>
      {logs.map(({ userName, points, data, newAchievements, newLevel }) => {
        const date = new Date(data);

        return (
          <div
            key={data + userName}
            className='flex flex-row flex-wrap  items-center py-2 text-base sm:text-base'>
            <p className='mr-2 w-20 border-r-2 border-main-opposed-300 text-sm tracking-wide'>
              {date.toLocaleDateString() +
                " " +
                addZeroToTime(date.getHours()) +
                ":" +
                addZeroToTime(date.getMinutes())}
            </p>
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
        );
      })}
    </div>
  ) : (
    <FaSpinner />
  );
};

export default LogsBoxLayout;
