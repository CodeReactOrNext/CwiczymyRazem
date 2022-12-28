import Button from "components/Button";
import { selectTimerData, updateTime } from "feature/user/store/userSlice";
import { SkillsType } from "feature/user/store/userSlice.types";
import { convertMsToHM } from "helpers/timeConverter";
import useTimer from "hooks/useTimer";
import MainLayout from "layouts/MainLayout";
import { useState, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "store/hooks";
import CategoryBox from "./components/CategoryBox";

const TimerLayout = () => {
  const { time, setTime, restartTime, timerEnabled, setTimerEnabled } =
    useTimer();
  const [chosenSkill, setChosenSkill] = useState<SkillsType>("technique");
  const dispatch = useAppDispatch();
  const timerData = useAppSelector(selectTimerData);
  const sumTime =
    timerData.creativity +
    timerData.hearing +
    timerData.theory +
    timerData.technique;

  const calculatePercent = (time: number) => Math.floor((time / sumTime) * 100);

  useEffect(() => {
    const payload = {
      type: chosenSkill,
      time: time,
    };
    dispatch(updateTime(payload));
  }, [time, chosenSkill, dispatch]);

  return (
    <MainLayout subtitle='Aktualnie ćwiczysz' variant='secondary'>
      <div className='flex flex-col items-center justify-center'>
        <p className=' text-8xl tracking-wider text-tertiary sm:text-9xl'>
          {convertMsToHM(time)}
        </p>

        <div className='mb-14 flex flex-row gap-x-5 bg-second p-3 px-7 text-tertiary'>
          <button onClick={() => setTimerEnabled(true)}>
            <FaPlay size={40} />
          </button>
          <button onClick={() => setTimerEnabled(false)}>
            <FaPause size={40} />
          </button>
        </div>
        <div className='flex flex-row gap-5 text-center text-2xl'>
          <p>
            Czas łącznie:
            <span className='text-tertiary'>{convertMsToHM(sumTime)}</span>
          </p>
          <p>
            Aktualnie ćwiczysz: <span className='text-tertiary'>Technika</span>
          </p>
        </div>
        <div className='mb-14  flex w-[330px] flex-row flex-wrap justify-center md:w-[570px] lg:w-full '>
          <CategoryBox
            title='Technika'
            time={timerData.technique}
            onClick={() => {
              setChosenSkill("technique");
              setTime(timerData.technique);
            }}
            percent={calculatePercent(timerData.technique)}
            chosen={chosenSkill === "technique"}
          />
          <CategoryBox
            title='Teoria'
            time={timerData.theory}
            onClick={() => {
              setChosenSkill("theory");
              setTime(timerData.theory);
            }}
            percent={calculatePercent(timerData.theory)}
            chosen={chosenSkill === "theory"}
          />
          <CategoryBox
            title='Słuch'
            time={timerData.hearing}
            onClick={() => {
              setChosenSkill("hearing");
              setTime(timerData.hearing);
            }}
            percent={calculatePercent(timerData.hearing)}
            chosen={chosenSkill === "hearing"}
          />
          <CategoryBox
            title='Kreatywność'
            time={timerData.creativity}
            onClick={() => {
              setChosenSkill("creativity");
              setTime(timerData.creativity);
            }}
            percent={calculatePercent(timerData.creativity)}
            chosen={chosenSkill === "creativity"}
          />
        </div>
        <Button>Zakończ</Button>
      </div>
    </MainLayout>
  );
};

export default TimerLayout;
