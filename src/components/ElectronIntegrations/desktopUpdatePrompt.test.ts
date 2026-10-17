import type { ElectronUpdaterState } from "types/electronApp";
import { describe, expect, it } from "vitest";

import { decideDesktopUpdatePrompt, LEGACY_UPDATER_GRACE_MS } from "./desktopUpdatePrompt";

const state = (patch: Partial<ElectronUpdaterState>): ElectronUpdaterState => ({
  status: "idle",
  currentVersion: "0.2.0",
  version: null,
  percent: null,
  error: null,
  canAutoInstall: true,
  manualDownloadUrl: "https://example.test/latest",
  ...patch,
});

const base = {
  installedVersion: "0.1.9",
  latestVersion: "0.2.0",
  platform: "win32",
  updaterState: null,
  legacyUpdateReady: false,
  elapsedMs: 0,
};

describe("decideDesktopUpdatePrompt", () => {
  describe("shells reporting updater state (0.2.0+)", () => {
    it("offers a restart once the update is downloaded", () => {
      expect(
        decideDesktopUpdatePrompt({ ...base, updaterState: state({ status: "ready" }) })
      ).toBe("restart");
    });

    it("stays quiet while the shell is downloading by itself", () => {
      expect(
        decideDesktopUpdatePrompt({ ...base, updaterState: state({ status: "downloading" }) })
      ).toBe("none");
    });

    it("offers the installer when the shell's updater failed or can't install", () => {
      expect(
        decideDesktopUpdatePrompt({ ...base, updaterState: state({ status: "error" }) })
      ).toBe("download");
      expect(
        decideDesktopUpdatePrompt({
          ...base,
          platform: "darwin",
          updaterState: state({ status: "idle", canAutoInstall: false }),
        })
      ).toBe("download");
    });

    it("ignores updater errors when the shell is already current", () => {
      expect(
        decideDesktopUpdatePrompt({
          ...base,
          installedVersion: "0.2.0",
          updaterState: state({ status: "error" }),
        })
      ).toBe("none");
    });
  });

  describe("shells before 0.2.0", () => {
    it("never offers the dead restart button on macOS", () => {
      expect(
        decideDesktopUpdatePrompt({ ...base, platform: "darwin", legacyUpdateReady: true })
      ).toBe("download");
      expect(decideDesktopUpdatePrompt({ ...base, platform: "darwin" })).toBe("download");
    });

    it("keeps the working Windows restart flow", () => {
      expect(decideDesktopUpdatePrompt({ ...base, legacyUpdateReady: true })).toBe("restart");
    });

    it("gives the Windows updater a grace period before offering the installer", () => {
      expect(decideDesktopUpdatePrompt(base)).toBe("none");
      expect(decideDesktopUpdatePrompt({ ...base, elapsedMs: LEGACY_UPDATER_GRACE_MS })).toBe(
        "download"
      );
    });

    it("says nothing while the latest version is unknown or not newer", () => {
      expect(
        decideDesktopUpdatePrompt({ ...base, platform: "darwin", latestVersion: null })
      ).toBe("none");
      expect(
        decideDesktopUpdatePrompt({ ...base, platform: "darwin", latestVersion: "0.1.9" })
      ).toBe("none");
    });
  });
});
