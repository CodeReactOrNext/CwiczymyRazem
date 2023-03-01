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
    <div className='content-box absolute right-[5%] -top-10 flex items-center gap-2 px-2 text-xs text-mainText xs:text-sm sm:text-base lg:right-[10%] xl:right-[15%]'>
      <p className='text-tertiary-500'>{t("sort.sort_by")}</p>
      <button
        onClick={() => setSortBy("points")}
        className={` px-2 ${sortBy === "points" ? " bg-second-400" : ""}`}>
        {t("sort.points")}
      </button>
      <button
        onClick={() => setSortBy("time")}
        className={` px-2 ${sortBy === "time" ? " bg-second-400" : ""}`}>
        {t("sort.time")}
      </button>
      <button
        onClick={() => setSortBy("sessionCount")}
        className={` px-2 ${
          sortBy === "sessionCount" ? " bg-second-400" : ""
        }`}>
        {t("sort.session_count")}
      </button>
    </div>
  );
}
export default SortBySwitch;
