import Avatar from "components/Avatar";

import { FaAngleLeft, FaAngleRight, FaEvernote } from "react-icons/fa";
interface LeadboardColumnProps {
  place: number;
}

const LeadboardColumn = ({ place }: LeadboardColumnProps) => {
  return (
    <div className='flex w-full  p-5'>
      <p className='flex  w-[100px] items-end justify-end text-6xl font-semibold text-tertiary'>
        {place + "."}
      </p>
      <div className='ml-5 flex h-16 w-full max-w-[800px] items-center '>
        <Avatar />
        <div className=' mr-5 flex h-16 w-full items-center justify-between bg-second bg-opacity-75 px-2'>
          <div className='relative'>
            <p className='text-2xl'>Krokon</p>
            <div className='absolute top-[-35px] right-[-60px] flex items-center gap-x-1'>
              <p className='text-xl uppercase text-tertiary'>Lvl </p>
              <p className='text-5xl  text-main'>34</p>
            </div>
          </div>
          <div className='flex h-full w-[300px] justify-center gap-x-5'>
            <div className='flex flex-col items-center justify-end px-2 '>
              <p className='text-3xl leading-[22px] '>12415</p>
              <p className='leading-[25px] text-tertiary'>Punktów</p>
            </div>
            <div className='flex  flex-col items-center justify-end px-2'>
              <p className='text-3xl leading-[22px]'>14:15</p>
              <p className='  leading-[25px] text-tertiary'>Czas Ćwiczeń</p>
            </div>
          </div>
          <div className='flex h-full  flex-col items-center justify-end'>
            <div className='flex text-2xl'>
              <FaAngleLeft className='cursor-pointer text-main-opposed hover:text-white' />
              <div className='flex w-[150px] justify-around text-xl '>
                <FaEvernote />
                <FaEvernote />
                <FaEvernote />
              </div>
              <FaAngleRight className='cursor-pointer text-main-opposed hover:text-white' />
            </div>
            <p className=' text-tertiary'>Osiągnięcia 4/16 </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadboardColumn;
