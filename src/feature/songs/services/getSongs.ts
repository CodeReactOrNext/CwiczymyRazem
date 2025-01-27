

import type { Song } from "feature/songs/types/songs.type";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const getSongs = async (
  sortBy: string,
  sortDirection: "asc" | "desc",
  searchQuery: string,
  page: number,
  itemsPerPage: number
) => {
  try {
    let baseQuery = query(collection(db, "songs"));

    let queriesToRun = [];

    if (searchQuery) {
      const titleQuery = query(
        baseQuery,
        where("title", ">=", searchQuery),
        where("title", "<=", searchQuery + "\uf8ff")
      );

      const artistQuery = query(
        baseQuery,
        where("artist", ">=", searchQuery),
        where("artist", "<=", searchQuery + "\uf8ff")
      );

      queriesToRun.push(getDocs(titleQuery));
      queriesToRun.push(getDocs(artistQuery));
    } else {
      queriesToRun.push(getDocs(baseQuery));
    }

    const snapshots = await Promise.all(queriesToRun);
    const allDocs = snapshots.flatMap((snapshot) => snapshot.docs);

    const uniqueDocs = Array.from(
      new Map(allDocs.map((doc) => [doc.id, doc])).values()
    );

    const total = uniqueDocs.length;

    if (sortBy !== "avgDifficulty" && sortBy !== "learners") {
      uniqueDocs.sort((a, b) => {
        const valA = a.data()[sortBy];
        const valB = b.data()[sortBy];
        if (sortDirection === "asc") return valA > valB ? 1 : -1;
        else return valA < valB ? 1 : -1;
      });
    }

    const startIndex = (page - 1) * itemsPerPage;
    const pageDocs = uniqueDocs.slice(startIndex, startIndex + itemsPerPage);

    const songs = pageDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Song[];

    if (sortBy === "avgDifficulty") {
      songs.sort((a, b) => {
        const avgA =
          a.difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
          (a.difficulties.length || 1);
        const avgB =
          b.difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
          (b.difficulties.length || 1);
        return sortDirection === "asc" ? avgA - avgB : avgB - avgA;
      });
    }

    return {
      songs,
      total,
    };
  } catch (error) {
    console.error("Error getting songs:", error);
    throw error;
  }
};
