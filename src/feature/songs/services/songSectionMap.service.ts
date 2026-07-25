import axios from "axios";
import type {
  SectionMapEntry,
  SongSectionMap,
} from "feature/songs/types/songSectionMap.type";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "utils/firebase/client/firebase.utils";

const COLLECTION = "songSectionMaps";
// Safety cap on a single-field query (status == 'verified') — cheap and
// index-free since it's the only filter; no orderBy, so no composite index
// is needed either. Scale isn't a concern yet at this app's size.
const VERIFIED_MAPS_LIMIT = 300;

/**
 * All community-verified section maps, across every song+video. Fetched in
 * one shot and matched client-side against whichever songId the caller
 * cares about — avoids a per-song query (and the composite index a
 * songId+status query combined with an orderBy would otherwise require).
 */
export const getVerifiedSongSectionMaps = async (): Promise<SongSectionMap[]> => {
  const q = query(
    collection(db, COLLECTION),
    where("status", "==", "verified"),
    limit(VERIFIED_MAPS_LIMIT)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SongSectionMap);
};

export interface SubmitSongSectionMapResponse {
  success: true;
  status: SongSectionMap["status"];
  consensusSections: SongSectionMap["consensusSections"];
}

export const submitSongSectionMap = async (
  songId: string,
  videoId: string,
  sections: SectionMapEntry[]
): Promise<SubmitSongSectionMapResponse> => {
  const idToken = await auth.currentUser!.getIdToken();
  const response = await axios.post<SubmitSongSectionMapResponse>(
    "/api/songs/section-map/submit",
    { idToken, songId, videoId, sections }
  );
  return response.data;
};
