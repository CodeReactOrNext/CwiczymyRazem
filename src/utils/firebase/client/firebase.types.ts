import type { UserSongLists } from "feature/songs/types/songs.type";
import type { Timestamp } from "firebase/firestore";
import type { StatisticsDataInterface } from "types/api.types";
import type { SkillsType } from "types/skillsTypes";

export interface FirebaseUserDataInterface {
  profileId: string;
  createdAt: Timestamp;
  displayName: string;
  avatar?: string;
  soundCloudLink?: string;
  youTubeLink?: string;
  band?: string;
  guitarStartDate?: Timestamp;
  selectedFrame?: number;
  selectedGuitar?: number | string;
  selectedGuitarYear?: number;
  selectedGuitarCountry?: string;
  statistics: StatisticsDataInterface;
  songLists: UserSongLists;
  fcmData?: {
    tokens: string[];
    notificationsEnabled: boolean;
  };
}

interface FirebaseEventsInteface {
  category: SkillsType;
  name: string;
  link: string;
}
interface FirebaseDiscordEventsInteface {
  title: string;
  deadline: string;
  description: string;
  link: string;
}


