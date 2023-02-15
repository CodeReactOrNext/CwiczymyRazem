import { useTranslation } from "react-i18next";
import { FaExternalLinkAlt, FaInfoCircle } from "react-icons/fa";

interface EventsListProps {}

const DiscordEvents = ({}: EventsListProps) => {
  const { t } = useTranslation("profile");

  return (
    <div className='flex h-full flex-col  items-center py-2 '>
      <p className=' p-2 text-center text-lg font-bold sm:text-xl'>
        Ćwiczymy Razem: RHCP - Snow
      </p>
      <div className='mb-2 flex flex-row border-b-2 border-main-opposed-300 p-1 text-xs'>
        <p>Aktywne</p>
        <div className='m-2 h-2 w-2 animate-ping rounded-full bg-green-700'></div>
        <p className='px-2  '>
          Data końca: <span className='text-second-text'> 01.03.2023</span>
        </p>
      </div>
      <div className='m-2 flex flex-row items-center'>
        <FaInfoCircle size={20} className='m-1' />
        <p className='text-center text-xs text-tertiary'>
          Dołącz do naszej społeczności na Discord i weź udział w evencie
        </p>
      </div>

      <p className='m-2 w-[90%] border-2 border-main-opposed-400 bg-main-opposed-400/80 p-3 text-center  sm:w-[70%] '>
        Naucz się z nami fragmentu/całości utworu RHCP - Snow i umieść nagranie
        na grupie Ćwiczymy Razem na Discordzie.
      </p>
      <p className='flex flex-row items-center  text-second-text '>
        Link do materiału: <FaExternalLinkAlt size={15} className='mx-2 ' />
      </p>
    </div>
  );
};

export default DiscordEvents;
