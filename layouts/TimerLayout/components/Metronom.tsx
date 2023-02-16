import React, { useState, useRef, useEffect } from "react";
import { FaPlay, FaStop } from "react-icons/fa";
import { motion } from "framer-motion";

const Metronome = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [animation, setanimation] = useState(1);
  const [emptyClick, setEmptyClick] = useState<number[]>([]);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);

  let count = 0;
  const elements = Array.from({ length: beatsPerMeasure }, (_, index) => index);

  const click1 = "/static/sounds/hi_click.wav";
  const click2 =  "/static/sounds/lo_click.wav";

  const click1Ref = useRef<HTMLAudioElement>(null);
  const click2Ref = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(event.target.value);
    if (isPlaying) {
      clearInterval(timerRef.current!);
      timerRef.current = setInterval(playClick, (60 / newBpm) * 1000);
      setBpm(newBpm);
      return;
    }
    setBpm(newBpm);
  };

  const handleBeatsPerMeasure = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newBeatsPerMeasure = parseInt(event.target.value);
    setIsPlaying(false);
    clearInterval(timerRef.current!);
    setBeatsPerMeasure(newBeatsPerMeasure);
  };

  const handleBeatDot = (dot: number) => {
    setIsPlaying(false);
    clearInterval(timerRef.current!);
    if (emptyClick?.includes(dot)) {
      setEmptyClick(emptyClick.filter((item) => item !== dot));
      return;
    }
    setEmptyClick([dot, ...emptyClick]);
  };

  const playClick = () => {
    setanimation(count === beatsPerMeasure ? 0 : count);
    if (emptyClick?.includes(count)) {
      count++;
      return;
    }
    if (count !== 0 && count % beatsPerMeasure === 0) {
      count = 0;
    }
    if (count === 0) {
      click2Ref.current?.play();
      count++;
      return;
    }
    click1Ref.current?.play();
    count++;
  };

  const startStop = () => {
    if (isPlaying) {
      setIsPlaying(false);
      clearInterval(timerRef.current!);
    } else {
      timerRef.current = setInterval(playClick, (60 / bpm) * 1000);
      count = 0;
      setIsPlaying(true);
      playClick();
    }
  };

  return (
    <div className='flex min-w-[200px] scale-75 flex-col justify-center gap-3 bg-main-opposed-400/50  p-5 font-openSans radius-default xs:scale-90 sm:scale-100'>
      <div className='margin-auto relative m-3 flex w-full gap-[10px]  '>
        {elements.map((element, index) => (
          <div
            key={index}
            className={`h-1 w-1 cursor-pointer rounded-full p-2 active:scale-125
            ${
              emptyClick?.includes(element)
                ? "bg-slate-500/40"
                : "bg-slate-500 "
            } `}
            onClick={() => handleBeatDot(element)}></div>
        ))}
        {isPlaying && (
          <motion.div
            className='absolute top-0 left-0 h-1 w-1 rounded-full bg-main-300/80 p-2'
            animate={{ x: animation * 26 }}
            transition={{
              duration: 0.1,
              type: "twin",
            }}></motion.div>
        )}
      </div>

      <label htmlFor='bpm-range' className=''>
        <p>
          {bpm}
          <span className='text-xs text-tertiary'> BPM</span>
        </p>
      </label>
      <input
        id='bpm-range'
        type='range'
        min='60'
        max='240'
        value={bpm}
        onChange={handleInputChange}
        className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-tertiary '></input>
      <label htmlFor='beatsPerMeasure-range' className=''>
        <p>
          {beatsPerMeasure}/4{" "}
          <span className='text-xs text-tertiary'>Metrum</span>
        </p>
      </label>
      <input
        id='beatsPerMeasure-range'
        type='range'
        min='1'
        max='12'
        value={beatsPerMeasure}
        onChange={handleBeatsPerMeasure}
        className='h-2  cursor-pointer appearance-none rounded-lg bg-tertiary '></input>

      <button
        className='flex w-full flex-row items-center justify-center gap-1 self-center p-3 text-sm '
        onClick={startStop}>
        {isPlaying ? (
          <>
            <FaStop /> Stop
          </>
        ) : (
          <>
            <FaPlay /> Start
          </>
        )}
      </button>
      <audio ref={click1Ref} src={click1} />
      <audio ref={click2Ref} src={click2} />
    </div>
  );
};

export default Metronome;
