import {
  DESKTOP_APP_RELEASES_URL,
  DESKTOP_RELEASES_REPO,
} from "constants/desktopApp";
import type { DesktopPlatform } from "utils/desktopRelease";
import { DESKTOP_UPDATE_FEEDS, parseUpdateFeed } from "utils/desktopRelease";

export interface DesktopDownload {
  platform: DesktopPlatform;
  /** Null when the feed could not be read; the link then opens the releases page. */
  version: string | null;
  url: string;
  /** Installer size in MB, rounded. */
  sizeMb: number | null;
  /** YYYY-MM-DD. */
  releaseDate: string | null;
}

export interface DesktopAppPageProps {
  downloads: DesktopDownload[];
}

const PLATFORMS: DesktopPlatform[] = ["win32", "darwin", "linux"];

/**
 * Size and date of the installer, read off the same latest*.yml the shells'
 * updater reads. `parseUpdateFeed` gives the version and the link; the size
 * sits under the installer's own entry in `files:`.
 */
export const readFeedDetails = (
  yml: string,
  installerExt: string,
): { sizeMb: number | null; releaseDate: string | null } => {
  const entries = yml.split(/^\s*-\s+url:/m).slice(1);
  const installer = entries.find((entry) =>
    entry.split(/\r?\n/)[0].trim().endsWith(installerExt),
  );
  const size = installer?.match(/^\s*size:\s*(\d+)/m);
  const date = yml.match(/^releaseDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
  return {
    sizeMb: size ? Math.round(Number(size[1]) / 1e6) : null,
    releaseDate: date ? date[1] : null,
  };
};

const fallback = (platform: DesktopPlatform): DesktopDownload => ({
  platform,
  version: null,
  url: DESKTOP_APP_RELEASES_URL,
  sizeMb: null,
  releaseDate: null,
});

/**
 * One download per platform, from the latest release. Read at build time and
 * on revalidation, never in the visitor's browser: the release feeds redirect
 * to a CDN without CORS headers (see /api/desktop/latest-release). A feed that
 * fails leaves that platform pointing at the releases page instead.
 */
export const buildDesktopAppProps = async (
  fetchImpl: typeof fetch = fetch,
): Promise<DesktopAppPageProps> => {
  const downloads = await Promise.all(
    PLATFORMS.map(async (platform) => {
      const { feed, installerExt } = DESKTOP_UPDATE_FEEDS[platform];
      try {
        const response = await fetchImpl(
          `https://github.com/${DESKTOP_RELEASES_REPO}/releases/latest/download/${feed}`,
        );
        if (!response.ok) return fallback(platform);
        const yml = await response.text();
        const release = parseUpdateFeed(yml, installerExt);
        if (!release) return fallback(platform);
        return {
          platform,
          version: release.version,
          url: release.downloadUrl,
          ...readFeedDetails(yml, installerExt),
        };
      } catch {
        return fallback(platform);
      }
    }),
  );
  return { downloads };
};
