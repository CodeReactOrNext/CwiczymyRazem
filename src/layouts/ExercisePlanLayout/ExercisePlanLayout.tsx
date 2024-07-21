import { useState } from "react";
import { FaBrain,  FaClock, FaHandPaper } from "react-icons/fa";
import { SkillsType } from "types/skillsTypes";
import {convertMsToHM } from "utils/converter";

interface ExercisePlanLayoutProps {
  index: number;
  title: string;
  time: number;
  type: SkillsType;

}
const ExercisePlanLayout = ({
  index,
  title,
  time,
  type,

}: ExercisePlanLayoutProps) => {
  const [done, setDone ] = useState(false)

  return (
    <div
      className={`m-2 flex flex-row justify-start gap-4 border-2 border-main-opposed-200/70 bg-main-opposed-600 p-3 font-openSans text-sm radius-default`}
           onClick={() =>setDone((state) => !state)}>
      <input
        type='checkbox'
        className='flex flex-row items-center gap-1'
        checked={done}
      />
      <p className='w-[50%]'>
        {index + 1}.{title}
      </p>

      <div className='flex-ro flex w-[50%] justify-around'>
        <p className='flex flex-row items-center gap-1 '>
          <FaClock className='text-tertiary' />
          {convertMsToHM(time)}
        </p>
        <p className='flex flex-row items-center gap-1'>
          {type === "technique" && (
            <>
              <FaHandPaper /> Technika
            </>
          )}
          {type === "creativity" && (
            <>
              <FaBrain /> Kreatywność
            </>
          )}
          {type === "hearing" && (
            <>
              <FaBrain /> Słuch
            </>
          )}
          {type === "theory" && (
            <>
              <FaBrain /> Teoria
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default ExercisePlanLayout;
