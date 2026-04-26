import { firestore } from "utils/firebase/api/firebase.config";

export interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  avgDifficulty: number;
  tier: string;
  genres: string[];
  popularity: number;
  coverUrl: string | null;
  isVerified: boolean;
}

interface GetSongsResult {
  songs: LibrarySong[];
  total: number;
}

export async function getSongsForStaticProps(limit = 24): Promise<GetSongsResult> {
  try {
    const [snapshot, countSnap] = await Promise.all([
      firestore
        .collection("songs")
        .orderBy("popularity", "desc")
        .limit(limit)
        .get(),
      firestore.collection("songs").count().get(),
    ]);

    const songs: LibrarySong[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: typeof data.title === "string" ? data.title : "",
        artist: typeof data.artist === "string" ? data.artist : "",
        avgDifficulty: typeof data.avgDifficulty === "number" ? data.avgDifficulty : 0,
        tier: typeof data.tier === "string" ? data.tier : "?",
        genres: Array.isArray(data.genres) ? data.genres : [],
        popularity: typeof data.popularity === "number" ? data.popularity : 0,
        coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : null,
        isVerified: data.isVerified === true,
      };
    });

    const total = countSnap.data().count;

    return { songs, total };
  } catch {
    return { songs: [], total: 0 };
  }
}
