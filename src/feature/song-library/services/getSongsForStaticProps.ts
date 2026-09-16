import { firestore } from "utils/firebase/api/firebase.config";

export interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  avgDifficulty: number;
  ratingsCount: number;
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

    const songs: LibrarySong[] = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: typeof data.title === "string" ? data.title : "",
        artist: typeof data.artist === "string" ? data.artist : "",
        avgDifficulty: typeof data.avgDifficulty === "number" ? data.avgDifficulty : 0,
        ratingsCount: Array.isArray(data.difficulties) ? data.difficulties.length : 0,
        tier: typeof data.tier === "string" ? data.tier : "?",
        genres: Array.isArray(data.genres) ? data.genres : [],
        popularity: typeof data.popularity === "number" ? data.popularity : 0,
        coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : null,
        isVerified: data.isVerified === true,
      };
    });

    const total = countSnap.data().count;

    return { songs, total };
  } catch (error) {
    // A bare `catch { return { songs: [], total: 0 } }` used to swallow this,
    // so a Firestore blip mid-build shipped /song-library with an empty grid,
    // an empty ItemList and the title "0+ Guitar Songs Ranked by Difficulty"
    // — and nothing failed (SEO audit 2026-09-16).
    //
    // Without a service account there is no Firestore to reach, which is the
    // normal state of a local build: degrade and say so. With one configured,
    // an error is a real outage and must not be published.
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.warn(
        "[song-library] No FIREBASE_SERVICE_ACCOUNT_JSON — building the song grid empty. The written guides still render from static content.",
      );
      return { songs: [], total: 0 };
    }

    throw new Error(
      `[song-library] Firestore query failed while building /song-library: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
