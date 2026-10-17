import { DESKTOP_RELEASES_REPO } from "constants/desktopApp";

export type DesktopPlatform = "darwin" | "win32" | "linux";

export interface DesktopPlatformRelease {
  version: string;
  /** Direct link to this platform's installer (.dmg / .exe / .AppImage). */
  downloadUrl: string;
}

/** Latest published desktop build per platform. A platform is missing when its
 *  build failed for the latest release — its own feed is what its updater reads. */
export type DesktopLatestRelease = Partial<Record<DesktopPlatform, DesktopPlatformRelease>>;

/** The electron-updater feed each platform's shell reads, and the installer a
 *  person should download by hand. */
export const DESKTOP_UPDATE_FEEDS: Record<DesktopPlatform, { feed: string; installerExt: string }> = {
  darwin: { feed: "latest-mac.yml", installerExt: ".dmg" },
  win32: { feed: "latest.yml", installerExt: ".exe" },
  linux: { feed: "latest-linux.yml", installerExt: ".AppImage" },
};

export const isDesktopPlatform = (value: unknown): value is DesktopPlatform =>
  value === "darwin" || value === "win32" || value === "linux";

const stripQuotes = (value: string) => value.trim().replace(/^['"]|['"]$/g, "");

/**
 * Reads a latest*.yml feed as electron-builder writes it — only the two fields
 * needed here, so no YAML dependency: the top-level `version:` and the first
 * listed file with the platform's installer extension.
 */
export const parseUpdateFeed = (
  yml: string,
  installerExt: string
): DesktopPlatformRelease | null => {
  const version = yml.match(/^version:\s*(.+)$/m);
  if (!version) return null;
  const versionValue = stripQuotes(version[1]);
  if (!/^\d+(\.\d+)*$/.test(versionValue)) return null;

  const files = [...yml.matchAll(/^\s*-?\s*(?:url|path):\s*(.+)$/gm)].map((m) =>
    stripQuotes(m[1])
  );
  const installer = files.find((name) => name.endsWith(installerExt));

  return {
    version: versionValue,
    downloadUrl: installer
      ? `https://github.com/${DESKTOP_RELEASES_REPO}/releases/download/v${versionValue}/${encodeURIComponent(installer)}`
      : `https://github.com/${DESKTOP_RELEASES_REPO}/releases/latest`,
  };
};
