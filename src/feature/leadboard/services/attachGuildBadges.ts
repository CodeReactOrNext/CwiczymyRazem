import type { GuildBadge } from "feature/guilds/types/guild.types";
import { collection, documentId, query, where } from "firebase/firestore";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

/** Firestore caps an `in` filter at 30 values. */
const IN_FILTER_LIMIT = 30;

/**
 * Puts each player's guild tag on rows that were not read from `users`.
 *
 * A season keeps its own slim document per player and the badge is not copied
 * there, so the seasonal board would list everyone as guildless. The badge
 * lives on the user document — one `in` query per page of rows fetches them.
 *
 * The tag is decoration: if the lookup fails, the rows come back as they were.
 */
export const attachGuildBadges = async (
  users: FirebaseUserDataInterface[],
): Promise<FirebaseUserDataInterface[]> => {
  const ids = users.map((user) => user.profileId).filter(Boolean);
  if (ids.length === 0) return users;

  try {
    const badges = new Map<string, GuildBadge>();

    for (let i = 0; i < ids.length; i += IN_FILTER_LIMIT) {
      const snapshot = await trackedGetDocs(
        query(
          collection(db, "users"),
          where(documentId(), "in", ids.slice(i, i + IN_FILTER_LIMIT)),
        ),
      );
      snapshot.docs.forEach((entry) => {
        const badge = entry.data().guildBadge as GuildBadge | undefined;
        if (badge?.tag) badges.set(entry.id, badge);
      });
    }

    return users.map((user) => {
      const badge = badges.get(user.profileId);
      return badge ? { ...user, guildBadge: badge } : user;
    });
  } catch {
    return users;
  }
};
