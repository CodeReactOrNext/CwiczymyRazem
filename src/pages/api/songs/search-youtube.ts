import { doc, getDoc, setDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "utils/firebase/client/firebase.utils";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function cacheKey(q: string) {
  return q.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 100);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { q } = req.query;
  if (!q || typeof q !== "string") return res.status(400).json({ error: "Missing query" });

  const key = cacheKey(q);
  const cacheRef = doc(db, "youtubeSearchCache", key);

  try {
    const cached = await getDoc(cacheRef);
    if (cached.exists()) {
      const data = cached.data();
      if (Date.now() - data.cachedAt < CACHE_TTL_MS) {
        return res.status(200).json({ videos: data.videos, fromCache: true });
      }
    }
  } catch {
    // cache read failed — continue to live fetch
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "No API key configured" });

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(q)}&type=video&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`YouTube API responded with ${response.status}`);
    const data = await response.json();

    const videos = (data.items ?? []).map((item: any) => ({
      id: item.id?.videoId ?? "",
      title: item.snippet?.title ?? "",
      thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? "",
      channel: item.snippet?.channelTitle ?? "",
    })).filter((v: any) => v.id);

    setDoc(cacheRef, { videos, cachedAt: Date.now() }).catch(() => {});

    return res.status(200).json({ videos });
  } catch {
    return res.status(500).json({ error: "Failed to fetch YouTube results" });
  }
}
