import { useState, useEffect, useCallback } from "react";

const useTimer = () => {
  const [time, setTime] = useState(0);
  const [startTimeData, setStartTimeData] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);

  const counter = useCallback(() => {
    const timeDiffrence = new Date().getMilliseconds() - startTimeData;
    if (timeDiffrence > 1000) {
      setTime((prev) => prev + timeDiffrence);
      return;
    }
    setTime((prev) => prev + 1000);
  }, []);

  const restartTime = () => {
    setTime(0);
  };

  useEffect(() => {
    if (!timerEnabled) return;
    setStartTimeData(new Date().getMilliseconds());
    const time = setInterval(() => counter(), 1000);
    return () => clearInterval(time);
  }, [counter, timerEnabled]);

  return {
    time,
    setTime,
    timerEnabled,
    setTimerEnabled,
    restartTime,
  };
};

export default useTimer;
