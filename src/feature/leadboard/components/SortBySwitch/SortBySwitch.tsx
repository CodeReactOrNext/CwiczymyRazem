import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { SortByType } from "feature/leadboard/view/LeadboardView";

interface SortBySwitchProps {
  setSortBy: Dispatch<SetStateAction<SortByType>>;
  sortBy: SortByType;
}

const SortBySwitch = ({ setSortBy, sortBy }: SortBySwitchProps) => {
  const { t } = useTranslation("leadboard");

  return (
    <div className="join">
      <button
        className={`btn btn-sm join-item ${
          sortBy === "points" ? "btn-active" : ""
        }`}
        onClick={() => setSortBy("points")}
      >
        {t("sort_by_points")}
      </button>
      <button
        className={`btn btn-sm join-item ${
          sortBy === "sessionCount" ? "btn-active" : ""
        }`}
        onClick={() => setSortBy("sessionCount")}
      >
        {t("sort_by_sessions")}
      </button>
    </div>
  );
};

export default SortBySwitch;
