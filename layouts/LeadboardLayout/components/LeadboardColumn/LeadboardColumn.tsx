import Avatar from "components/Avatar";

import { FaAngleLeft, FaAngleRight, FaEvernote } from "react-icons/fa";
interface LeadboardColumnProps {
  place: number;
}

const LeadboardColumn = ({ place }: LeadboardColumnProps) => {
  return (
    <div className='flex w-full  p-5'>
      <p className='     flex items-center justify-end text-4xl font-semibold  text-tertiary md:text-4xl lg:w-[100px] lg:text-6xl'>
        {place + "."}
      </p>
      <div className=' ml-2 flex w-full max-w-[800px] items-center md:ml-5 md:h-16 '>
        <div className='hidden md:block'>
          <Avatar />
        </div>
        <div className=' mr-5 grid w-full grid-cols-3 grid-rows-3 justify-items-center  bg-second bg-opacity-75 px-2 md:h-16 md:grid-rows-1'>
          <div className='relative top-[-15px] left-[-25px] block h-[65px] scale-75 justify-items-start md:hidden'>
            <Avatar />
            <div className='absolute top-[5px] right-[-60px] flex  items-center gap-x-1 '>
              <p className='text-xl uppercase text-tertiary'>Lvl </p>
              <p className='text-3xl text-main '>34</p>
            </div>
          </div>
          <div className='relative col-span-2 self-center justify-self-start md:col-span-1 '>
            <p className='text-2xl'>Krokon</p>
            <div className='absolute top-[-20px] right-[-60px]  hidden items-center  gap-x-1 md:top-[-35px] md:flex'>
              <p className='text-xl uppercase text-tertiary'>Lvl </p>
              <p className='text-4xl text-main  md:text-5xl'>34</p>
            </div>
          </div>
          <div className='col-span-3 flex h-full w-full items-center justify-evenly md:col-span-1 md:w-[300px] md:justify-center  md:gap-x-5'>
            <div className='flex  flex-col items-center md:justify-end md:px-2 '>
              <p className='text-3xl leading-[22px] '>12415</p>
              <p className='leading-[25px] text-tertiary'>Punktów</p>
            </div>
            <div className='flex  flex-col items-center md:justify-end md:px-2'>
              <p className='text-3xl leading-[22px]'>14:15</p>
              <p className='  leading-[25px] text-tertiary'>Czas Ćwiczeń</p>
            </div>
          </div>
          <div className=' col-span-3 flex h-full w-full flex-col items-center justify-center  md:col-span-1  md:w-fit md:justify-end '>
            <div className='flex text-2xl'>
              <FaAngleLeft className='cursor-pointer text-main-opposed hover:text-white' />
              <div className='flex w-[100px] justify-around text-xl xs:w-[150px] '>
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
