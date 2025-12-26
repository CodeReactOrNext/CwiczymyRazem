import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, addDoc, serverTimestamp, getCountFromServer, limit, where } from "firebase/firestore";

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
      const { page = "1", limit: limitVal = "50", filterType = "all" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limitVal as string);

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

      // Get Global Stats (Cheap)
      const countSnapshot = await getCountFromServer(songsRef);
      const totalGlobal = countSnapshot.data().count;

      // Filtered total (for pagination)
      const filteredCountSnapshot = await getCountFromServer(resultsQuery);
      const totalFiltered = filteredCountSnapshot.data().count;

      const unverifiedSnapshot = await getCountFromServer(query(songsRef, where("isVerified", "==", false)));
      const unverified = unverifiedSnapshot.data().count;

      const noCoverSnapshot = await getCountFromServer(query(songsRef, where("coverUrl", "==", null)));
      const noCover = noCoverSnapshot.data().count;

      const noRatingSnapshot = await getCountFromServer(query(songsRef, where("avgDifficulty", "==", 0)));
      const noRating = noRatingSnapshot.data().count;

      const q = query(
        resultsQuery,
        orderBy("createdAt", "desc"),
        limit(limitNum * pageNum)
      );
      const querySnapshot = await getDocs(q);

      const allFetchedSongs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const songs = allFetchedSongs.slice((pageNum - 1) * limitNum);

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
            avgDifficulty: difficulty !== null ? difficulty : 0
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
      const updates = { ...data };
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
