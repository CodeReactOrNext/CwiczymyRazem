import { useTranslation } from "react-i18next";
import { SeasonDataInterface } from "types/api.types";

interface SeasonSelectProps {
  seasons: SeasonDataInterface[];
  selectedSeason: string;
  setSelectedSeason: (value: string) => void;
  isLoading: boolean;
}

const SeasonSelect = ({
  seasons,
  selectedSeason,
  setSelectedSeason,
  isLoading,
}: SeasonSelectProps) => {
  const { t } = useTranslation("leadboard");

  return (
    <select
      className='select select-bordered select-sm'
      value={selectedSeason}
      onChange={(e) => setSelectedSeason(e.target.value)}
      disabled={isLoading}>
      {seasons.map((season) => (
        <option key={season.seasonId} value={season.seasonId}>
          {`${new Date(season.startDate).toLocaleDateString()} - 
             ${new Date(season.endDate).toLocaleDateString()}`}
          {season.isActive && ` (${t("current_season")})`}
        </option>
      ))}
    </select>
  );
};

export default SeasonSelect;
