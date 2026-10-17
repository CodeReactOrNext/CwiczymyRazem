import { describe, expect, it } from "vitest";

import { DESKTOP_UPDATE_FEEDS, parseUpdateFeed } from "./desktopRelease";

// Verbatim from the published v0.1.9 release.
const LATEST_MAC_YML = `version: 0.1.9
files:
  - url: riff.quest-0.1.9-arm64-mac.zip
    sha512: 2z7s3V1LNHCA4UmfoY4OQgsvEZXm/L49gLEZpEl7fLYrdDD2lmAOeGPfXF4x5pjCvJoZdPUS0KXYas4oL0EkLw==
    size: 118189651
  - url: riff.quest-0.1.9-arm64.dmg
    sha512: 8LPrPd9vIGGhQcPwwIvjdukmn6z2+CN76pL+cNcnMuasYEV07cq/UqzAmxo8jsZMRyKzqlcnEYwsy/O5D7oogQ==
    size: 118113141
path: riff.quest-0.1.9-arm64-mac.zip
sha512: 2z7s3V1LNHCA4UmfoY4OQgsvEZXm/L49gLEZpEl7fLYrdDD2lmAOeGPfXF4x5pjCvJoZdPUS0KXYas4oL0EkLw==
releaseDate: '2026-09-07T19:25:34.123Z'
`;

const LATEST_YML = `version: 0.1.9
files:
  - url: riff.quest-Setup-0.1.9.exe
    sha512: KdhkWcCfwk5NOkkQYHcIID0PzaYCVOjk3wPLycWrWEP7UrtrJowt17EE8nwD+Fp2zfRPzbxOGyceCs2vx4nmdQ==
    size: 102395592
path: riff.quest-Setup-0.1.9.exe
releaseDate: '2026-09-07T19:25:59.704Z'
`;

const RELEASE_BASE = "https://github.com/Michaljapko/riff-quest-releases/releases";

describe("parseUpdateFeed", () => {
  it("reads the version and links the DMG, not the updater zip, on macOS", () => {
    expect(parseUpdateFeed(LATEST_MAC_YML, DESKTOP_UPDATE_FEEDS.darwin.installerExt)).toEqual({
      version: "0.1.9",
      downloadUrl: `${RELEASE_BASE}/download/v0.1.9/riff.quest-0.1.9-arm64.dmg`,
    });
  });

  it("links the NSIS installer on Windows", () => {
    expect(parseUpdateFeed(LATEST_YML, DESKTOP_UPDATE_FEEDS.win32.installerExt)?.downloadUrl).toBe(
      `${RELEASE_BASE}/download/v0.1.9/riff.quest-Setup-0.1.9.exe`
    );
  });

  it("falls back to the releases page when the installer isn't listed", () => {
    expect(parseUpdateFeed(LATEST_YML, ".dmg")?.downloadUrl).toBe(`${RELEASE_BASE}/latest`);
  });

  it("rejects anything that isn't a feed", () => {
    expect(parseUpdateFeed("<html>Not Found</html>", ".exe")).toBeNull();
    expect(parseUpdateFeed("version: latest\n", ".exe")).toBeNull();
  });
});
