import { DESKTOP_RELEASES_REPO } from "constants/desktopApp";
import type { NextApiRequest, NextApiResponse } from "next";
import type { DesktopLatestRelease, DesktopPlatform } from "utils/desktopRelease";
import { DESKTOP_UPDATE_FEEDS, parseUpdateFeed } from "utils/desktopRelease";

/**
 * Latest published desktop build per platform, read from the same
 * latest*.yml feeds the shells' electron-updater reads.
 *
 * Lets the web bundle — always current — notice a shell that is behind even
 * when that shell's own updater is broken (every ad-hoc-signed macOS build
 * before 0.2.0) and offer the installer by hand. Served from here rather than
 * fetched by the client because the release download URLs redirect to a CDN
 * without CORS headers, and the GitHub REST API's anonymous rate limit is per
 * IP, which Vercel functions share — the release download endpoint has neither
 * problem.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DesktopLatestRelease | { error: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const platforms = Object.keys(DESKTOP_UPDATE_FEEDS) as DesktopPlatform[];
  const results = await Promise.all(
    platforms.map(async (platform) => {
      const { feed, installerExt } = DESKTOP_UPDATE_FEEDS[platform];
      try {
        const response = await fetch(
          `https://github.com/${DESKTOP_RELEASES_REPO}/releases/latest/download/${feed}`
        );
        if (!response.ok) return [platform, null] as const;
        return [platform, parseUpdateFeed(await response.text(), installerExt)] as const;
      } catch {
        return [platform, null] as const;
      }
    })
  );

  const release: DesktopLatestRelease = {};
  for (const [platform, entry] of results) {
    if (entry) release[platform] = entry;
  }

  if (Object.keys(release).length === 0) {
    return res.status(502).json({ error: "Could not read the release feeds" });
  }

  // Releases are rare and the answer is the same for everyone.
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  return res.status(200).json(release);
}
