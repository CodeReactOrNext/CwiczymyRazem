import { SortByType } from "feature/leadboard/types";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

interface SortBySwitchProps {
  setSortBy: (value: SortByType) => void;
  sortBy: SortByType;
}

const SortBySwitch = ({ setSortBy, sortBy }: SortBySwitchProps) => {
  const { t } = useTranslation("leadboard");

  return (
    <div className='join'>
      <button
        className={`btn join-item btn-sm ${
          sortBy === "points" ? "btn-active" : ""
        }`}
        onClick={() => setSortBy("points")}>
        {t("sort_by_points")}
      </button>
      <button
        className={`btn join-item btn-sm ${
          sortBy === "sessionCount" ? "btn-active" : ""
        }`}
        onClick={() => setSortBy("sessionCount")}>
        {t("sort_by_sessions")}
      </button>
    </div>
  );
};

export default SortBySwitch;
