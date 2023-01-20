import { useState, useEffect } from "react";

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
    setStartTimeDate(new Date().getTime());
  };

  useEffect(() => {
    if (!timerEnabled) {
      const timeDiffrence = new Date().getTime() - startTimeDate;
      setInitialTime((prev) => {
        console.log("prevInitial", prev);
        return prev + timeDiffrence;
      });
    }
    console.log("1 startTimeDate", startTimeDate);
    console.log("1 timerEnabled", timerEnabled);
    console.log(`*********************************`);
  }, [startTimeDate, timerEnabled]);

  useEffect(() => {
    if (!timerEnabled) {
      return;
    }
    const timeDiffrence = new Date().getTime() - startTimeDate;
    const timer = setInterval(() => setTime(timeDiffrence + initialTime), 1000);
    console.log("2 time", time);
    console.log("2 timer time", timeDiffrence + initialTime);
    console.log("2 timerEnabled", timerEnabled);
    console.log("2 initialTime", initialTime);
    console.log("2 startTimeDate", startTimeDate);
    console.log(`*********************************`);
    return () => clearInterval(timer);
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
