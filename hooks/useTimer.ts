import { useState, useEffect, useCallback } from "react";

const useTimer = () => {
  const [time, setTime] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);

  const counter = useCallback(() => {
    setTime((prev) => prev + 10000);
  }, []);

  const restartTime = () => {
    setTime(0);
  };

  useEffect(() => {
    if (!timerEnabled) return;
    // const time = setInterval(() => counter(), 10000);
        const time = setInterval(() => counter(), 100);
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
