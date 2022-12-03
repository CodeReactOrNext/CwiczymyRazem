import Input from "components/Input";
import {
  FaChevronDown,
  FaChevronUp,
  FaInfo,
  FaQuestionCircle,
  FaSortDown,
  FaSortUp,
} from "react-icons/fa";

import { RiQuestionnaireFill } from "react-icons/ri";
import { IconType } from "react-icons/lib";
import InputTime from "./InputTime";

interface Props {
  title: string;
  Icon: IconType;
}

export default function TimeInputBox({ title, Icon }: Props) {
  return (
    <div
      className={`grid-row-[3fr_4fr] relative grid  items-center gap-2 border-4 border-tertiary bg-main-opposed p-3 xl:min-w-[170px] 2xl:min-w-[200px]`}>
      <Icon className='absolute left-[-1.5rem] top-[-2rem] z-40 text-5xl text-tertiary xl:left-[-2rem] xl:top-[-2.5rem] xl:text-6xl' />

      <label className='z-20 flex flex-row gap-2 justify-self-center text-lg xl:text-2xl'>
        {title}
        <RiQuestionnaireFill className='fill-mainText text-sm' />
      </label>

      <div className='xL:gap-3 flex items-center justify-center gap-2   text-xl'>
        <InputTime />
        <p className='text-3xl'>:</p>
        <InputTime />
      </div>
    </div>
  );
}
