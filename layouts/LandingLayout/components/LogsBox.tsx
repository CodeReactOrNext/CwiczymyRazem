import Achievement from "components/Achievement";
import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import { FirebaseLogsInterface } from "utils/firebase/firebase.types";
import {
  firebaseGetLogs,
} from "utils/firebase/firebase.utils";

const LogsBox = () => {
  const [logs, setLogs] = useState<FirebaseLogsInterface[] | null>(null);

  useEffect(() => {
    firebaseGetLogs()
      .then((logsData) => {
        console.log(logsData);
        setLogs(logsData.reverse());
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

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
                    date.getHours() +
                    ":" +
                    date.getMinutes()}
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
                    <Achievement key={index} id={id} />
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

export default LogsBox;
