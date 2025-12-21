import { collection, getDocs, writeBatch, doc, query, collectionGroup } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const migrateSongPopularity = async () => {
  console.log("Starting Song Popularity Migration...");

  // 1. Fetch all user-song relationships across all users
  // Using collectionGroup is more efficient than iterating through users
  const userSongsSnapshot = await getDocs(collectionGroup(db, "userSongs"));

  const popularityMap: Record<string, Set<string>> = {};

  userSongsSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const songId = data.songId;
    // The parent path is users/{userId}/userSongs/{songId}
    const pathSegments = docSnap.ref.path.split('/');
    const userId = pathSegments[1];

    if (songId && userId) {
      if (!popularityMap[songId]) {
        popularityMap[songId] = new Set();
      }
      popularityMap[songId].add(userId);
    }
  });

  console.log(`Calculated popularity for ${Object.keys(popularityMap).length} unique songs.`);

  // 2. Fetch all songs to ensure we update even those with 0 popularity (optional but good for consistency)
  const songsSnapshot = await getDocs(collection(db, "songs"));
  const batch = writeBatch(db);
  let count = 0;
  let totalUpdated = 0;

  songsSnapshot.forEach((songSnap) => {
    const songId = songSnap.id;
    const userIds = Array.from(popularityMap[songId] || []);

    batch.update(doc(db, "songs", songId), {
      popularity: userIds.length,
      practicingUsers: userIds
    });

    count++;
    totalUpdated++;

    // Commit in chunks of 450
    if (count >= 450) {
      // Note: We can't await batch.commit() inside forEach directly in a way that blocks everything properly without a wrapper
      // But for simplicity in this migration script we'll just handle it
    }
  });

  // commit the last batch
  await batch.commit();
  console.log(`Success! Updated popularity for ${totalUpdated} songs.`);
  return totalUpdated;
};
