import Button from "components/Button";
import MainLayout from "layouts/MainLayout";
import { FaPlay, FaPause } from "react-icons/fa";
import CategoryBox from "./components/CategoryBox";

const TimerLayout = () => {
  return (
    <MainLayout subtitle='Aktualnie ćwiczysz' variant='secondary'>
      <div className='flex flex-col items-center justify-center'>
        <p className=' text-8xl tracking-wider text-tertiary sm:text-9xl'>
          02:23
        </p>

        <div className='mb-14 flex flex-row gap-x-5 bg-second p-3 px-7 text-tertiary'>
          <FaPlay size={40} />
          <FaPause size={40} />
        </div>
        <div className='flex flex-row gap-5 text-center text-2xl'>
          <p>
            Czas łącznie: <span className='text-tertiary'>4:50</span>
          </p>
          <p>
            Aktualnie ćwiczysz: <span className='text-tertiary'>Technika</span>
          </p>
        </div>
        <div className='mb-14  flex w-[330px] flex-row flex-wrap justify-center md:w-[570px] lg:w-full   '>
          <CategoryBox title='Technika' chosen />
          <CategoryBox title='Teoria' />
          <CategoryBox title='Słuch' />
          <CategoryBox title='Kreatywność' />
        </div>
        <Button>Zakończ</Button>
      </div>
    </MainLayout>
  );
};

export default TimerLayout;
