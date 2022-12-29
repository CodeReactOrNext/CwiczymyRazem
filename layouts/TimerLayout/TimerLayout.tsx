import Button from "components/Button";
import { selectTimerData, updateTime } from "feature/user/store/userSlice";
import { SkillsType } from "feature/user/store/userSlice.types";
import { convertMsToHM, convertMsToHMObject } from "helpers/timeConverter";
import useTimer from "hooks/useTimer";
import MainLayout from "layouts/MainLayout";
import { useState, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "store/hooks";
import CategoryBox from "./components/CategoryBox";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Router from "next/router";

const TimerLayout = () => {
  const { time, setTime, restartTime, timerEnabled, setTimerEnabled } =
    useTimer();
  const [chosenSkill, setChosenSkill] = useState<SkillsType>("technique");
  const dispatch = useAppDispatch();
  const timerData = useAppSelector(selectTimerData);
  const { t } = useTranslation("timer");
  const sumTime =
    timerData.creativity +
    timerData.hearing +
    timerData.theory +
    timerData.technique;

  const calculatePercent = (time: number) => Math.floor((time / sumTime) * 100);
  const getSkillName = (chosenSkill: SkillsType) => {
    switch (chosenSkill) {
      case "creativity":
        return t("creative");
      case "hearing":
        return t("hearing");
      case "technique":
        return t("technique");
      case "theory":
        return t("theory");
    }
  };

  const timerSubmitHandler = () => {
    const payload = {
      type: chosenSkill,
      time: time,
    };
    dispatch(updateTime(payload));
    Router.push("/report");
  };
  useEffect(() => {
    const payload = {
      type: chosenSkill,
      time: time,
    };
    dispatch(updateTime(payload));
  }, [time, chosenSkill, dispatch]);

  return (
    <MainLayout subtitle='Aktualnie ćwiczysz' variant='secondary'>
      <div className='flex flex-col items-center justify-center '>
        <div className='mb-6 grid h-52 w-52 grid-rows-3 items-center rounded-full border-2  border-white text-7xl tracking-wider text-tertiary xs:h-64 xs:w-64 sm:text-8xl'>
          <div className=' row-start-1 flex justify-evenly justify-self-center p-6'>
            <div className='row-start-1 flex w-10 flex-col items-center  text-lg'>
              <p className='leading-none'>
                {convertMsToHMObject(time).seconds}
              </p>
              <div
                className=' h-1 bg-white '
                style={{ width: convertMsToHMObject(time).seconds }}></div>
              <p className='text-xs'>{t("seconds")}</p>
            </div>
          </div>
          <div className=' row-start-2 flex w-full justify-evenly justify-self-center p-6'>
            <p>{convertMsToHMObject(time).hours}</p>
            <span className={`${timerEnabled ? "animate-pulse" : ""} `}>:</span>
            <p>{convertMsToHMObject(time).minutes}</p>
          </div>
          <div className='row-start-3  text-center text-sm text-tertiary'>
            {timerEnabled ? (
              <button
                className='hover:text-mainText active:click-behavior-second'
                onClick={() => setTimerEnabled(false)}>
                <FaPause size={25} />
                {t("pause")}
              </button>
            ) : (
              <button
                className='hover:text-mainText active:click-behavior-second '
                onClick={() => setTimerEnabled(true)}>
                <FaPlay size={25} /> {t("start")}
              </button>
            )}
          </div>
        </div>
        <div className='mb-2 flex flex-row gap-5 text-center text-2xl'>
          <div className='flex flex-row gap-1 '>
            <p>
              {t("total_time")}{" "}
              <span className='text-tertiary'>{convertMsToHM(sumTime)}</span>
            </p>
          </div>
          <div className='flex flex-row gap-1 '>
            <p>
              {t("currently_exercising")}
              <span className='m-1 text-tertiary'>
                {getSkillName(chosenSkill)}
              </span>
            </p>
          </div>
        </div>
        <p>
          {t("info_about_repot ")}
          <Link href={"/report"}>
            <a className='text-main-200'> {t("raport_link")}</a>
          </Link>
          .
        </p>
        <div className='mb-14  flex w-[330px] flex-row flex-wrap justify-center md:w-[570px] lg:w-full '>
          <CategoryBox
            title={t("creative")}
            time={timerData.technique}
            onClick={() => {
              setChosenSkill("technique");
              setTime(timerData.technique);
            }}
            percent={calculatePercent(timerData.technique)}
            chosen={chosenSkill === "technique"}
          />
          <CategoryBox
            title={t("theory")}
            time={timerData.theory}
            onClick={() => {
              setChosenSkill("theory");
              setTime(timerData.theory);
            }}
            percent={calculatePercent(timerData.theory)}
            chosen={chosenSkill === "theory"}
          />
          <CategoryBox
            title={t("hearing")}
            time={timerData.hearing}
            onClick={() => {
              setChosenSkill("hearing");
              setTime(timerData.hearing);
            }}
            percent={calculatePercent(timerData.hearing)}
            chosen={chosenSkill === "hearing"}
          />
          <CategoryBox
            title={t("creative")}
            time={timerData.creativity}
            onClick={() => {
              setChosenSkill("creativity");
              setTime(timerData.creativity);
            }}
            percent={calculatePercent(timerData.creativity)}
            chosen={chosenSkill === "creativity"}
          />
        </div>
        <Button onClick={timerSubmitHandler}> {t("end_button")}</Button>
      </div>
    </MainLayout>
  );
};

export default TimerLayout;
