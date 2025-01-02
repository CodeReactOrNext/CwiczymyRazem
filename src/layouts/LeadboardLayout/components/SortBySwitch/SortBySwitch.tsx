import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { SortByType } from "feature/leadboard/view/LeadboardView";

interface SortBySwitchInterface {
  setSortBy: Dispatch<SetStateAction<SortByType>>;
  sortBy: SortByType;
}

function SortBySwitch({ setSortBy, sortBy }: SortBySwitchInterface) {
  const { t } = useTranslation("common");

  return (
    <div className='flex w-full flex-col justify-center gap-2  rounded-md bg-second-300 p-1 px-2 font-openSans text-xs text-mainText xs:text-sm sm:text-base md:w-fit md:flex-row md:items-center  '>
      <p className='ml-3 text-[12px] text-secondText md:ml-0 '>
        {t("sort.sort_by")}
      </p>
      <div>
        <button
          onClick={() => setSortBy("points")}
          className={`tab rounded-md text-[12px] font-medium transition-colors hover:text-white ${
            sortBy === "points" ? "bg-second text-white" : " "
          }`}>
          {t("sort.points")}
        </button>
        <button
          onClick={() => setSortBy("time")}
          className={`tab rounded-md text-[12px] font-medium transition-colors hover:text-white ${
            sortBy === "time" ? "bg-second text-white" : " "
          }`}>
          {t("sort.time")}
        </button>
        <button
          onClick={() => setSortBy("sessionCount")}
          className={`tab rounded-md text-[12px] font-medium transition-colors hover:text-white ${
            sortBy === "sessionCount" ? "bg-second text-white" : " "
          }`}>
          {t("sort.session_count")}
        </button>
      </div>
    </div>
  );
}
export default SortBySwitch;
