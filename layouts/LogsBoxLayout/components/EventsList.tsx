import Link from "next/link";
import { useTranslation } from "react-i18next";

import { SkillsType } from "feature/user/store/userSlice.types";
import { FirebaseEventsInteface } from "utils/firebase/client/firebase.types";

interface EventsListProps {
  eventList: FirebaseEventsInteface[];
}

const EventsList = ({ eventList }: EventsListProps) => {
  const { t } = useTranslation("profile");

  const getSkillName = (chosenSkill: SkillsType) => {
    switch (chosenSkill) {
      case "creativity":
        return t("creativity");
      case "hearing":
        return t("hearing");
      case "technique":
        return t("technique");
      case "theory":
        return t("theory");
    }
  };
  return (
    <>
      {eventList.map(({ category, link, name }) => {
        return (
          <div
            key={link}
            className='flex flex-row flex-nowrap  items-center border-b-2 border-main-opposed-400 py-2 '>
            <p className='mr-2 w-[20%] border-r-2 border-main-opposed-400 pr-2 text-[0.55rem]  lg:text-xs'>
              {getSkillName(category)}
            </p>
            <div className='flex w-[80%] flex-wrap '>
              <Link href={link}>
                <a>
                  <p className='mr-1'>
                    <span className='text-link'> {name}</span>
                  </p>
                </a>
              </Link>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default EventsList;
