import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { firestore } from "utils/firebase/api/firebase.config";

const LIMIT = 100;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const password = req.headers["x-admin-password"] || req.body?.password;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Deployed rules require request.auth on songSectionMaps, so this reads
    // via the Admin SDK (bypasses rules) rather than the client SDK the way
    // most other /api/admin routes do.
    const snapshot = await firestore
      .collection("songSectionMaps")
      .orderBy("updatedAt", "desc")
      .limit(LIMIT)
      .get();

    const songCache = new Map<string, { title: string; artist: string }>();
    const resolveSong = async (songId: string) => {
      const cached = songCache.get(songId);
      if (cached) return cached;
      const songDoc = await firestore.collection("songs").doc(songId).get();
      const songData = songDoc.data();
      const resolved = {
        title: (songData?.title as string) ?? songId,
        artist: (songData?.artist as string) ?? "?",
      };
      songCache.set(songId, resolved);
      return resolved;
    };

    const rows = await Promise.all(
      snapshot.docs.map(async (doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        const song = await resolveSong(data.songId as string);
        const submissions = (data.submissions ?? []) as {
          userId: string;
          username: string;
          sections?: unknown[];
          submittedAt?: FirebaseFirestore.Timestamp;
        }[];

        return {
          mapId: doc.id,
          songId: data.songId as string,
          videoId: data.videoId as string,
          title: song.title,
          artist: song.artist,
          status: (data.status as string) ?? "pending",
          contributorCount: (data.contributorCount as number) ?? submissions.length,
          sectionCount: ((data.consensusSections ?? []) as unknown[]).length,
          updatedAt: (data.updatedAt as FirebaseFirestore.Timestamp | undefined)
            ?.toDate?.()
            ?.toISOString() ?? null,
          contributors: submissions.map((s) => ({
            userId: s.userId,
            username: s.username,
            sectionCount: s.sections?.length ?? 0,
            submittedAt: s.submittedAt?.toDate?.()?.toISOString() ?? null,
          })),
        };
      })
    );

    return res.status(200).json({
      rows,
      stats: {
        total: rows.length,
        verified: rows.filter((r) => r.status === "verified").length,
        pending: rows.filter((r) => r.status === "pending").length,
      },
    });
  } catch (error: any) {
    console.error("[admin/section-maps]", error);
    return res.status(500).json({ error: error.message });
  }
}
