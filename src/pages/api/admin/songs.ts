import { addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";

const getTierFromDifficulty = (difficulty: number): string => {
  if (difficulty >= 9) return "S";
  if (difficulty >= 7.5) return "A";
  if (difficulty >= 6) return "B";
  if (difficulty >= 4) return "C";
  return "D";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check password in headers (GET) or body (POST)
  const password = req.headers["x-admin-password"] || req.body.password;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const { page = "1", limit: limitVal = "50", filterType = "all", search = "" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limitVal as string);
      const searchTerm = (search as string).toLowerCase().trim();

      const songsRef = collection(db, "songs");

      // Base query for actual results
      let resultsQuery = query(songsRef);
      if (filterType === "unverified") {
        resultsQuery = query(resultsQuery, where("isVerified", "==", false));
      } else if (filterType === "no-cover") {
        resultsQuery = query(resultsQuery, where("coverUrl", "==", null));
      } else if (filterType === "no-rating") {
        resultsQuery = query(resultsQuery, where("avgDifficulty", "==", 0));
      }

      // If search is provided, we need to handle it. 
      // Firestore doesn't support 'contains' well across multiple fields.
      // If searchTerm is short, we might fetch a lot. 
      // Let's use a titles prefix search if it's purely a search request.
      // Get Global Stats (Cheap)
      const countSnapshot = await getCountFromServer(songsRef);
      const totalGlobal = countSnapshot.data().count;

      const unverifiedSnapshot = await getCountFromServer(query(songsRef, where("isVerified", "==", false)));
      const unverified = unverifiedSnapshot.data().count;

      const noCoverSnapshot = await getCountFromServer(query(songsRef, where("coverUrl", "==", null)));
      const noCover = noCoverSnapshot.data().count;

      const noRatingSnapshot = await getCountFromServer(query(songsRef, where("avgDifficulty", "==", 0)));
      const noRating = noRatingSnapshot.data().count;

      // If we have a search term, we'll fetch a larger set and filter in memory
      // because Firestore doesn't support "contains" across multiple fields or combined with inequality filters well.
      if (searchTerm) {
        // Fetch up to 1000 items to filter (should be enough for admin purposes)
        const qSearch = query(resultsQuery, orderBy("createdAt", "desc"), limit(1000));
        const querySnapshot = await getDocs(qSearch);
        let allFilteredSongs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        // Apply search filter
        allFilteredSongs = allFilteredSongs.filter(song =>
          (song.title_lowercase || "").includes(searchTerm) ||
          (song.artist_lowercase || "").includes(searchTerm) ||
          (song.title || "").toLowerCase().includes(searchTerm) ||
          (song.artist || "").toLowerCase().includes(searchTerm)
        );

        const totalFilteredCount = allFilteredSongs.length;
        const pagedSongs = allFilteredSongs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        return res.status(200).json({
          songs: pagedSongs,
          total: totalFilteredCount,
          stats: {
            total: totalGlobal,
            unverified,
            noCover,
            noRating
          }
        });
      }

      // NO SEARCH - standard paginated firestore query
      const filteredCountSnapshot = await getCountFromServer(resultsQuery);
      const totalFiltered = filteredCountSnapshot.data().count;

      let q = query(
        resultsQuery,
        orderBy("createdAt", "desc"),
        limit(limitNum)
      );

      if (pageNum > 1) {
        // To get the document to start after, we need to fetch the one just before it
        // In a real production app, we should pass the last document ID as a cursor,
        // but for this admin tool, we'll do a quick fetch of the previous items' last doc.
        const prevQ = query(
          resultsQuery,
          orderBy("createdAt", "desc"),
          limit((pageNum - 1) * limitNum)
        );
        const prevSnap = await getDocs(prevQ);
        const lastDoc = prevSnap.docs[prevSnap.docs.length - 1];
        if (lastDoc) {
          const { startAfter } = require("firebase/firestore");
          q = query(resultsQuery, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(limitNum));
        }
      }

      const querySnapshot = await getDocs(q);
      const songs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json({
        songs,
        total: totalFiltered,
        stats: {
          total: totalGlobal,
          unverified,
          noCover,
          noRating
        }
      });
    }

    if (req.method === "DELETE") {
      const { songId } = req.body.songId ? req.body : req.query; // Support body or query

      if (!songId || typeof songId !== 'string') {
        return res.status(400).json({ error: "Missing songId" });
      }

      const songRef = doc(db, "songs", songId);
      await deleteDoc(songRef);

      return res.status(200).json({ success: true });
    }

    if (req.method === "POST") {
      const { songId, data, bulkSongs } = req.body;

      if (bulkSongs && Array.isArray(bulkSongs)) {
        const songsRef = collection(db, "songs");

        // Extract unique artists to narrow down the search
        const artists = Array.from(new Set(bulkSongs.map(s => (s.artist || "").toLowerCase().trim())));

        const existingMap = new Set();

        // Fetch existing songs for these artists
        if (artists.length > 0) {
          // Firestore 'in' query has a limit of 10-30 values depending on version, 
          // but artist_lowercase doesn't exist for all records yet or we might have many artists.
          // For simplicity and safety, if batch is small we can query, otherwise we might have to fetch more.
          // Let's use a simpler approach: fetch where artist_lowercase is in the list (up to 10 artists)
          // or just fetch all if it's too complex. 
          // Actually, let's fetch all for now but IMPROVE the check.

          const existingSnapshot = await getDocs(songsRef);
          existingSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const key = `${(data.artist || "").toLowerCase().trim()}|${(data.title || "").toLowerCase().trim()}`;
            existingMap.add(key);
          });
        }

        const results = [];
        let skipped = 0;

        for (const s of bulkSongs) {
          const normalizedKey = `${(s.artist || "").toLowerCase().trim()}|${(s.title || "").toLowerCase().trim()}`;

          if (existingMap.has(normalizedKey)) {
            skipped++;
            continue;
          }

          // Important: also check title variants (e.g. "Title (Live)" vs "Title")? 
          // No, let's stick to exact match for safety.

          const difficulty = s.difficulty ? (typeof s.difficulty === 'string' ? parseFloat(s.difficulty) : s.difficulty) : null;

          const newSong = {
            title: s.title || "Unknown Title",
            artist: s.artist || "Unknown Artist",
            title_lowercase: (s.title || "Unknown Title").toLowerCase(),
            artist_lowercase: (s.artist || "Unknown Artist").toLowerCase(),
            createdAt: serverTimestamp(),
            createdBy: "admin",
            isVerified: true,
            coverUrl: s.coverUrl || null,
            difficulties: difficulty !== null ? [{
              userId: "admin_system",
              rating: difficulty,
              date: new Date()
            }] : [],
            avgDifficulty: difficulty !== null ? difficulty : 0,
            tier: difficulty !== null ? getTierFromDifficulty(difficulty) : "D"
          };

          // Double check BEFORE addDoc (rare race condition protection)
          // Map update is synchronous so this protects within the same request
          existingMap.add(normalizedKey);

          const docRef = await addDoc(songsRef, newSong);
          results.push({ id: docRef.id, ...newSong });
        }

        return res.status(200).json({
          success: true,
          count: results.length,
          skipped,
          results,
          message: `Added ${results.length} songs. Skipped ${skipped} duplicates.`
        });
      }

      if (!songId || !data) {
        return res.status(400).json({ error: "Missing songId or data" });
      }

      const songRef = doc(db, "songs", songId);

      // Automatically sync lowercase fields if title/artist are updated
      const updates: any = { ...data };
      if (data.title) updates.title_lowercase = data.title.toLowerCase();
      if (data.artist) updates.artist_lowercase = data.artist.toLowerCase();

      // If updating rating, also add to difficulties array as 'admin'
      if (typeof data.avgDifficulty === 'number') {
        const songSnap = await getDoc(songRef);
        if (songSnap.exists()) {
          const songData = songSnap.data();
          const currentDifficulties = Array.isArray(songData.difficulties) ? songData.difficulties : [];

          // Remove existing admin rating if any
          const otherDifficulties = currentDifficulties.filter((d: any) => d.userId !== 'admin');

          // Add new admin rating
          updates.difficulties = [
            ...otherDifficulties,
            {
              userId: 'admin',
              rating: data.avgDifficulty,
              date: new Date() // Firestore converts this to Timestamp
            }
          ];

          // Also update the tier since difficulty changed
          updates.tier = getTierFromDifficulty(data.avgDifficulty);
        }
      }

      await updateDoc(songRef, updates);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Admin Songs API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
