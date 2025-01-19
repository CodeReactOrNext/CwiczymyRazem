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
    <div className='flex items-center gap-2 font-openSans'>
      <div className='flex gap-2 rounded-md bg-second-400 p-1'>
        <button
          className={`tab rounded-md text-[12px] font-medium transition-colors hover:text-white  ${
            !isSeasonalView ? "bg-second text-white" : " "
          }`}
          onClick={() => setIsSeasonalView(false)}
          disabled={isLoading}>
          {t("global_leaderboard")}
        </button>
        <button
          className={` tab rounded-md text-[12px] font-medium transition-colors hover:text-white  ${
            isSeasonalView ? "bg-second text-white" : " "
          }`}
          onClick={() => setIsSeasonalView(true)}
          disabled={isLoading}>
          {t("seasonal_leaderboard")}
        </button>
      </div>
    </div>
  );
};

export default ViewToggle;
