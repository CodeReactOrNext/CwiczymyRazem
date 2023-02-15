import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FaExternalLinkAlt, FaInfoCircle } from "react-icons/fa";
import { FirebaseDiscordEventsInteface } from "utils/firebase/client/firebase.types";

interface DiscordEventProps {
  discordEvent: FirebaseDiscordEventsInteface | null;
}

const DiscordEvent = ({ discordEvent }: DiscordEventProps) => {
  const { t } = useTranslation("common");

  return discordEvent ? (
    <div className='flex h-full flex-col  items-center py-2 '>
      <p className=' p-2 text-center text-lg font-bold sm:text-xl'>
        {discordEvent.title}
      </p>
      <div className='mb-2 flex flex-row items-center border-b-2  border-main-opposed-300 p-1 text-xs'>
        <p>{t("discord_event.active")}</p>
        <div className='m-2 h-2 w-2 animate-ping rounded-full bg-green-700'></div>
        <p className='px-2  '>
          {t("discord_event.deadline")}
          <span className='text-second-text'>{discordEvent.deadline}</span>
        </p>
      </div>
      <div className='m-2 flex flex-row items-center'>
        <FaInfoCircle size={20} className='m-1' />
        <p className='text-center text-xs text-tertiary'>
          {t("discord_event.join_us")}
        </p>
      </div>

      <p className='m-2 w-[90%] border-2 border-main-opposed-400 bg-main-opposed-400/80 p-3 text-center  sm:w-[70%] '>
        {discordEvent.description}
      </p>

      <Link href={discordEvent.link}>
        <a target='_blank' rel='noopener noreferrer'>
          <p className='flex flex-row items-center  text-second-text '>
            {t("discord_event.link")}
            <FaExternalLinkAlt size={15} className='mx-2' />
          </p>
        </a>
      </Link>
    </div>
  ) : (
    <div className='flex h-full flex-col  items-center py-2 '>
      <p className=' p-2 text-center text-lg font-bold sm:text-xl'>
        {t("discord_event.offline")}
      </p>
      <div className='mb-2 flex flex-row items-center border-b-2 border-main-opposed-300 p-1 text-xs'>
        <p>{t("discord_event.active")}</p>
        <div className='m-2 h-2 w-2  rounded-full bg-red-400'></div>
        <p className='px-2  '>
          {t("discord_event.deadline")}{" "}
          <span className='text-second-text'>
            {t("discord_event.data_none")}
          </span>
        </p>
      </div>
      <div className='m-2 flex flex-row items-center'>
        <FaInfoCircle size={20} className='m-1' />
        <p className='text-center text-xs text-tertiary'>
          {t("discord_event.join_us_offline")}
        </p>
      </div>
    </div>
  );
};

export default DiscordEvent;
