import type { GuildBadge } from "feature/guilds/types/guild.types";
import type { Timestamp } from "firebase/firestore";
import type { StatisticsDataInterface } from "types/api.types";

export interface ProfileInterface {
  displayName: string;
  avatar: string;
  /** Denormalised guild kit, written by the Admin SDK (see lib/guild/guildBadge.ts). */
  guildBadge?: GuildBadge;
  soundCloudLink?: string;
  youTubeLink?: string;
  band?: string;
  selectedGuitar?: number | string;
  selectedGuitarYear?: number;
  selectedGuitarCountry?: string;
  userAuth: string;
  statistics: StatisticsDataInterface;
  createdAt: Timestamp;
  guitarStartDate: Timestamp | null;
  songLists: {
    wantToLearn: string[];
    learned: string[];
    learning: string[];
  };
}
