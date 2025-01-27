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
  statistics: StatisticsDataInterface;
  songLists: UserSongLists;
}

export interface FirebaseEventsInteface {
  category: SkillsType;
  name: string;
  link: string;
}
export interface FirebaseDiscordEventsInteface {
  title: string;
  deadline: string;
  description: string;
  link: string;
}


