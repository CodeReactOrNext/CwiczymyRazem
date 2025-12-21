import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

const getAverageDifficulty = (difficulties: any[]) => {
  if (!difficulties?.length) return 0;
  return (
    difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
    difficulties.length
  );
};

export const migrateSongsSchema = async () => {
  const songsRef = collection(db, "songs");
  const snapshot = await getDocs(songsRef);

  const batch = writeBatch(db);
  let count = 0;

  console.log(`Starting migration for ${snapshot.size} songs...`);

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const updates: any = {};

    if (data.avgDifficulty === undefined) {
      updates.avgDifficulty = getAverageDifficulty(data.difficulties || []);
    }
    if (data.title_lowercase === undefined) {
      updates.title_lowercase = (data.title || "").toLowerCase();
    }
    if (data.artist_lowercase === undefined) {
      updates.artist_lowercase = (data.artist || "").toLowerCase();
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc(db, "songs", docSnap.id), updates);
      count++;
    }

    // Firestore batch limit is 500
    if (count % 450 === 0 && count > 0) {
      console.log(`Prepared ${count} updates...`);
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Success! Migrated ${count} songs.`);
  } else {
    console.log("No songs needed migration.");
  }

  return count;
};
