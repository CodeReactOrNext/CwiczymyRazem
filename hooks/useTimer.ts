import { useState, useEffect, useCallback } from "react";

const useTimer = () => {
  const [initialTime, setInitialTime] = useState(0);
  const [time, setTime] = useState(0);
  const [startTimeDate, setStartTimeDate] = useState(new Date().getTime());
  const [timerEnabled, setTimerEnabled] = useState(false);

  const restartTime = () => {
    setTime(0);
  };

  useEffect(() => {
    const timeDiffrence = new Date().getTime() - startTimeDate;

    if (!timerEnabled) {
      setInitialTime((prev) => prev + timeDiffrence);
    }
    setStartTimeDate(new Date().getTime());
  }, [timerEnabled, startTimeDate]);

  useEffect(() => {
    if (!timerEnabled) {
      return;
    }
    const timeDiffrence = new Date().getTime() - startTimeDate;

    const time = setInterval(() => setTime(timeDiffrence + initialTime), 1000);
    return () => clearInterval(time);
  }, [time, timerEnabled, initialTime, startTimeDate]);

  return {
    time,
    setTime,
    timerEnabled,
    setTimerEnabled,
    restartTime,
  };
};

export default useTimer;
