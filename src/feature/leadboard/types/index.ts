import { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import { SeasonDataInterface } from "types/api.types";

export type SortByType = "points" | "sessionCount";

export interface LeaderboardProps {
  usersData: FirebaseUserDataInterface[];
  setSortBy: (value: SortByType) => void;
  sortBy: SortByType;
  currentUserId: string | null;
  isLoading: boolean;
  totalUsers: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isSeasonalView: boolean;
  setIsSeasonalView: (value: boolean) => void;
  seasons: SeasonDataInterface[];
  selectedSeason: string;
  setSelectedSeason: (value: string) => void;
}
