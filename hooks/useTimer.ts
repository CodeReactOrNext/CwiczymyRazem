import { useState, useEffect, useCallback } from "react";

const useTimer = () => {
  const [time, setTime] = useState(0);
  const [startTimeData, setStartTimeData] = useState(new Date().getTime());
  const [timerEnabled, setTimerEnabled] = useState(false);

  const counter = useCallback(() => {
    const timeDiffrence = new Date().getTime() - startTimeData;
    if (timeDiffrence > 1020) {
      setTime((prev) => prev + timeDiffrence);
    }
    setTime((prev) => prev + 1000);
  }, [startTimeData]);

  const restartTime = () => {
    setTime(0);
  };

  useEffect(() => {
    if (!timerEnabled) return;
    setStartTimeData(new Date().getTime());
    const time = setInterval(() => counter(), 1000);
    return () => clearInterval(time);
  }, [counter, timerEnabled, time]);

  return {
    time,
    setTime,
    timerEnabled,
    setTimerEnabled,
    restartTime,
  };
};

export default useTimer;
