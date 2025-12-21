import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";
import { collection, getDocs, doc, updateDoc, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";

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
      const songsRef = collection(db, "songs");
      const q = query(songsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const songs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json(songs);
    }

    if (req.method === "POST") {
      const { songId, data, bulkSongs } = req.body;

      if (bulkSongs && Array.isArray(bulkSongs)) {
        const songsRef = collection(db, "songs");
        const existingSnapshot = await getDocs(songsRef);
        const existingMap = new Set(
          existingSnapshot.docs.map(doc => {
            const d = doc.data();
            return `${d.artist?.toLowerCase().trim()}|${d.title?.toLowerCase().trim()}`;
          })
        );

        const results = [];
        let skipped = 0;

        for (const s of bulkSongs) {
          const normalizedKey = `${s.artist?.toLowerCase().trim()}|${s.title?.toLowerCase().trim()}`;

          if (existingMap.has(normalizedKey)) {
            skipped++;
            continue;
          }

          const difficulty = s.difficulty ? (typeof s.difficulty === 'string' ? parseInt(s.difficulty) : s.difficulty) : null;

          const newSong = {
            title: s.title || "Unknown Title",
            artist: s.artist || "Unknown Artist",
            title_lowercase: (s.title || "Unknown Title").toLowerCase(),
            artist_lowercase: (s.artist || "Unknown Artist").toLowerCase(),
            createdAt: serverTimestamp(),
            createdBy: "admin",
            isVerified: true,
            difficulties: difficulty !== null ? [{
              userId: "admin_system",
              rating: difficulty,
              date: new Date()
            }] : [],
            avgDifficulty: difficulty !== null ? difficulty : 0
          };
          const docRef = await addDoc(songsRef, newSong);
          results.push({ id: docRef.id, ...newSong });

          // Add to map to prevent duplicates within the same batch
          existingMap.add(normalizedKey);
        }

        return res.status(200).json({
          success: true,
          count: results.length,
          skipped,
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

      await updateDoc(songRef, updates);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Admin Songs API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
