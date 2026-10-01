import type { GuildBadge } from "feature/guilds/types/guild.types";
import type { ProfileLayoutConfig } from "feature/profile/types/profileLayout.types";
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
  /** How the player arranged their profile page — see normalizeProfileLayout. */
  profileLayout?: Partial<ProfileLayoutConfig>;
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
