import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { useTranslation } from "react-i18next";
import type { SeasonDataInterface } from "types/api.types";

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
  const isCurrentSeason = (season: SeasonDataInterface) =>
    new Date(season.endDate) > new Date();

  return (
    <Select
      value={selectedSeason}
      onValueChange={setSelectedSeason}
      disabled={isLoading}>
      <SelectTrigger>
        <SelectValue placeholder='Select a season' />
      </SelectTrigger>
      <SelectContent>
        {seasons.map((season) => (
          <SelectItem key={season.seasonId} value={season.seasonId}>
            {`${new Date(season.startDate).toLocaleDateString()} - 
               ${new Date(season.endDate).toLocaleDateString()}`}
            {isCurrentSeason(season) && ` (${t("current_season")})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SeasonSelect;
