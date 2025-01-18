import { useTranslation } from "react-i18next";

interface ViewToggleProps {
  isSeasonalView: boolean;
  setIsSeasonalView: (value: boolean) => void;
  isLoading: boolean;
}

const ViewToggle = ({
  isSeasonalView,
  setIsSeasonalView,
  isLoading,
}: ViewToggleProps) => {
  const { t } = useTranslation("leadboard");

  return (
    <div className='join'>
      <button
        className={`btn join-item btn-sm ${
          !isSeasonalView ? "btn-primary" : ""
        }`}
        onClick={() => setIsSeasonalView(false)}
        disabled={isLoading}>
        {t("global_leaderboard")}
      </button>
      <button
        className={`btn join-item btn-sm ${
          isSeasonalView ? "btn-primary" : ""
        }`}
        onClick={() => setIsSeasonalView(true)}
        disabled={isLoading}>
        {t("seasonal_leaderboard")}
      </button>
    </div>
  );
};

export default ViewToggle;
