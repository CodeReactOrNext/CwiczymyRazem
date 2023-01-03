import { useState, useEffect, useCallback } from "react";

const useTimer = () => {
  const [initialTime, setInitialTime] = useState(0);
  const [time, setTime] = useState(0);
  const [startTimeDate, setStartTimeDate] = useState(new Date().getTime());
  const [timerEnabled, setTimerEnabled] = useState(false);

  const restartTime = () => {
    setTime(0);
    setInitialTime(0);
    setTimerEnabled(false);
  };

  const startTimer = () => {
    setStartTimeDate(new Date().getTime());
    setTimerEnabled(true);
  };

  const stopTimer = () => {
    setTimerEnabled(false);
  };

  const setInitialStartTime = (startTime: number) => {
    setTime(startTime);
    setInitialTime(startTime);
  };

  useEffect(() => {
    if (!timerEnabled) {
      const timeDiffrence = new Date().getTime() - startTimeDate;
      setInitialTime((prev) => prev + timeDiffrence);
    }
  }, [startTimeDate, timerEnabled]);

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
    restartTime,
    startTimer,
    stopTimer,
    timerEnabled,
    setInitialStartTime,
  };
};

export default useTimer;
