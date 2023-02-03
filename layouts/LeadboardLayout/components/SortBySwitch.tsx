import { sortBy } from "feature/leadboard/view/LeadboardView";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

interface SortBySwitchInterface {
  setSortBy: Dispatch<SetStateAction<sortBy>>;
}

function SortBySwitch({ setSortBy }: SortBySwitchInterface) {
  const selectChandler = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value as sortBy);
  };
  const { t } = useTranslation("common");

  return (
    <div className='absolute right-[5%] -top-6 flex items-center gap-2 text-main-opposed-500 lg:right-[10%] xl:right-[15%]'>
      <p className='text-tertiary-500'>{t("sort.sort_by")}</p>
      <select name='SortBySwitch' id='sort' onChange={selectChandler}>
        <option value='points'>{t("sort.points")}</option>
        <option value='time'>{t("sort.time")}</option>
        <option value='sessionCount'>{t("sort.session_count")}</option>
      </select>
    </div>
  );
}
export default SortBySwitch;
