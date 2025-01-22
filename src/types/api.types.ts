import type { AchievementList } from "assets/achievements/achievementsData";
import type { MediaType } from "feature/user/components/settings/MediaLinks/MediaLinks";
import type {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import type { SignUpCredentials } from "feature/user/view/SingupView/SingupView";
import type { IdTokenResult } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";

export interface UserDataInterface {
  userInfo: {
    displayName: string;
    avatar: string;
    soundCloudLink?: string;
    youTubeLink?: string;
    band?: string;
  };
  userAuth: string;
  currentUserStats: StatisticsDataInterface;
}

export interface FetchedReportDataInterface {
  currentUserStats: StatisticsDataInterface;
  previousUserStats: StatisticsDataInterface;
  raitingData: ReportDataInterface;
}

export interface StatisticsTime {
  technique: number;
  theory: number;
  hearing: number;
  creativity: number;
  longestSession: number;
}

export interface StatisticsDataInterface {
  time: StatisticsTime;
  lvl: number;
  currentLevelMaxPoints: number;
  points: number;
  sessionCount: number;
  habitsCount: number;
  dayWithoutBreak: number;
  maxPoints: number;
  achievements: AchievementList[];
  actualDayWithoutBreak: number;
  lastReportDate: string;
  songLists?: {
    wantToLearn: string[];
    learned: string[];
    learning: string[];
  };
  availablePoints: {
    technique: number;
    theory: number;
    hearing: number;
    creativity: number;
  };
}

export interface TimerInterface {
  technique: number;
  theory: number;
  hearing: number;
  creativity: number;
}

export interface ReportTimeData {
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
  sumTime: number;
}
export interface ReportListInterface {
  points: number;
  date: Date;
  totalTime: number;
  exceriseTitle?: string;
  isDateBackReport: string;
  timeSumary?: ReportTimeData;
}

export interface UserSliceProviderData {
  providerId: string | null;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
export interface userSliceInitialState {
  userAuth: string | null;
  userInfo: {
    displayName?: string;
    avatar?: string;
    createdAt?: Timestamp;
    soundCloudLink?: string;
    youTubeLink?: string;
    band?: string;
  } | null;
  theme: "default-theme" | "dark-theme";
  timer: TimerInterface;
  isLoggedOut: true | null;
  currentUserStats: StatisticsDataInterface | null;
  previousUserStats: StatisticsDataInterface | null;
  raitingData: ReportDataInterface | null;
  isFetching: "google" | "email" | "createAccount" | "updateData" | null;
  providerData: UserSliceProviderData;
}

export interface updateUserInterface extends SignUpCredentials {
  newEmail?: string;
  newPassword?: string;
}

export interface updateReprotInterface {
  token: IdTokenResult;
  inputData: ReportFormikInterface;
}

export interface updateSocialInterface {
  value: string;
  type: MediaType;
}

export interface SeasonDataInterface {
  seasonId: string; // Format: "2024-03" for March 2024
  startDate: string;
  endDate: string;
  isActive: boolean;
  winners?: {
    first: string;
    second: string;
    third: string;
  };
}

export interface SeasonalStatsInterface extends StatisticsDataInterface {
  seasonId: string;
}
