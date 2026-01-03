import { useEffect, useState } from "react";

export interface useTimerInterface {
  time: number;
  restartTime: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  timerEnabled: boolean;
  setInitialStartTime: (startTime: number) => void;
}

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
    const timeDifference = new Date().getTime() - startTimeDate;
    const finalTime = initialTime + timeDifference;
    setTime(finalTime);
    setInitialTime(finalTime);
    setTimerEnabled(false);
  };

  const setInitialStartTime = (startTime: number) => {
    setTime(startTime);
    setInitialTime(startTime);
    setStartTimeDate(new Date().getTime());
  };

  useEffect(() => {
    if (!timerEnabled) {
      const timeDiffrence = new Date().getTime() - startTimeDate;
      setInitialTime((prev) => {
        return prev + timeDiffrence;
      });
    }
  }, [startTimeDate, timerEnabled]);

  useEffect(() => {
    if (!timerEnabled) {
      return;
    }
    const timeDiffrence = new Date().getTime() - startTimeDate;
    const timer = setInterval(() => setTime(timeDiffrence + initialTime), 1000);
    return () => clearInterval(timer);
  }, [time, timerEnabled, initialTime, startTimeDate]);

  return {
    time,
    restartTime,
    startTimer,
    stopTimer,
    timerEnabled,
    setInitialStartTime,
  } as useTimerInterface;
};

export default useTimer;
