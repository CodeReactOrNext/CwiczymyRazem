import { spawnSync } from "child_process";
import crypto from "crypto";
import { EventEmitter } from "events";
import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it, vi } from "vitest";

import {
  buildSwapScript,
  createUpdater,
  macAppBundlePath,
  manualDownloadUrl,
  pickFile,
  releaseAssetUrl,
  selfReplaceBlocker,
  sha512Base64,
} from "./updater";

// Shape of latest-mac.yml as electron-builder publishes it (v0.1.9).
const MAC_INFO = {
  version: "0.2.0",
  files: [
    { url: "riff.quest-0.2.0-arm64-mac.zip", sha512: "x", size: 1 },
    { url: "riff.quest-0.2.0-arm64.dmg", sha512: "y", size: 1 },
  ],
};

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "updater-test-"));
afterAll(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));

describe("release URLs", () => {
  it("points at the v-prefixed tag of the public releases repo", () => {
    expect(releaseAssetUrl("0.2.0", "riff.quest-0.2.0-arm64-mac.zip")).toBe(
      "https://github.com/Michaljapko/riff-quest-releases/releases/download/v0.2.0/riff.quest-0.2.0-arm64-mac.zip",
    );
  });

  it("picks the zip for installing and the dmg for a manual download", () => {
    expect(pickFile(MAC_INFO.files, ".zip").url).toBe("riff.quest-0.2.0-arm64-mac.zip");
    expect(manualDownloadUrl("darwin", MAC_INFO)).toMatch(/v0\.2\.0\/riff\.quest-0\.2\.0-arm64\.dmg$/);
  });

  it("falls back to the releases page when the platform's file is unknown", () => {
    expect(manualDownloadUrl("win32", MAC_INFO)).toMatch(/\/releases\/latest$/);
    expect(manualDownloadUrl("darwin", null)).toMatch(/\/releases\/latest$/);
  });
});

describe("macAppBundlePath", () => {
  it("walks up from the executable to the .app bundle", () => {
    expect(macAppBundlePath("/Applications/riff.quest.app/Contents/MacOS/riff.quest")).toBe(
      "/Applications/riff.quest.app",
    );
  });

  it("returns null when not running from a bundle", () => {
    expect(macAppBundlePath("/usr/local/bin/electron")).toBeNull();
  });
});

describe("selfReplaceBlocker", () => {
  const allow = () => {};
  const deny = () => {
    throw new Error("EACCES");
  };

  it("allows a writable install", () => {
    expect(selfReplaceBlocker("/Applications/riff.quest.app", allow)).toBeNull();
  });

  it("refuses translocated, DMG-mounted and read-only installs", () => {
    expect(
      selfReplaceBlocker("/private/var/folders/x/AppTranslocation/ABC/d/riff.quest.app", allow),
    ).toBe("translocated");
    expect(selfReplaceBlocker("/Volumes/riff.quest 0.2.0/riff.quest.app", allow)).toBe(
      "read-only-volume",
    );
    expect(selfReplaceBlocker("/Applications/riff.quest.app", deny)).toBe("not-writable");
    expect(selfReplaceBlocker(null, allow)).toBe("not-a-bundle");
  });
});

describe("sha512Base64", () => {
  it("matches the base64 sha512 format of latest*.yml", async () => {
    const file = path.join(tmpRoot, "hash.bin");
    fs.writeFileSync(file, "riff");
    expect(await sha512Base64(file)).toBe(
      crypto.createHash("sha512").update("riff").digest("base64"),
    );
  });
});

// The swap script is the one piece that runs after the app is gone, so it is
// exercised for real with stubbed `open`/`xattr` (macOS-only binaries).
const hasSh = spawnSync("sh", ["-c", "true"]).status === 0;

describe.skipIf(!hasSh)("swap script", () => {
  const posix = (p) => p.replace(/\\/g, "/");

  function setup(name) {
    const dir = path.join(tmpRoot, name);
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin, { recursive: true });
    const opened = path.join(dir, "opened.txt");
    fs.writeFileSync(path.join(bin, "open"), `#!/bin/sh\necho "$1" >> "${posix(opened)}"\n`, { mode: 0o755 });
    fs.writeFileSync(path.join(bin, "xattr"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    const target = path.join(dir, "riff.quest.app");
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, "version"), "old");
    const script = path.join(dir, "swap.sh");
    fs.writeFileSync(script, buildSwapScript());
    return { dir, bin, opened, target, script };
  }

  function run({ bin, script, target, dir }, newApp) {
    // A pid that is not running, so the wait loop exits immediately.
    return spawnSync(
      "sh",
      [posix(script), "2147480", posix(newApp), posix(target), posix(path.join(dir, "swap.log"))],
      { env: { ...process.env, PATH: `${posix(bin)}:${process.env.PATH}` } },
    );
  }

  it("replaces the installed bundle and relaunches it", () => {
    const ctx = setup("ok");
    const staged = path.join(ctx.dir, "staged", "riff.quest.app");
    fs.mkdirSync(staged, { recursive: true });
    fs.writeFileSync(path.join(staged, "version"), "new");

    expect(run(ctx, staged).status).toBe(0);
    expect(fs.readFileSync(path.join(ctx.target, "version"), "utf8")).toBe("new");
    expect(fs.existsSync(`${ctx.target}.update-backup`)).toBe(false);
    expect(fs.readFileSync(ctx.opened, "utf8").trim()).toBe(posix(ctx.target));
  });

  it("restores the old bundle when the new one can't be moved in", () => {
    const ctx = setup("rollback");
    const missing = path.join(ctx.dir, "staged", "nope.app");

    expect(run(ctx, missing).status).toBe(1);
    expect(fs.readFileSync(path.join(ctx.target, "version"), "utf8")).toBe("old");
    expect(fs.readFileSync(ctx.opened, "utf8").trim()).toBe(posix(ctx.target));
  });
});

describe("createUpdater", () => {
  function setupController(platform, { exe = "/Applications/riff.quest.app/Contents/MacOS/riff.quest" } = {}) {
    const autoUpdater = new EventEmitter();
    autoUpdater.checkForUpdates = vi.fn(() => Promise.resolve({ isUpdateAvailable: false }));
    autoUpdater.quitAndInstall = vi.fn();
    const sent = [];
    const shell = { openExternal: vi.fn() };
    const win = { isDestroyed: () => false, webContents: { send: (channel, payload) => sent.push([channel, payload]) } };
    const electron = {
      app: {
        getPath: (name) => (name === "exe" ? exe : path.join(tmpRoot, `ctl-${platform}`)),
        getVersion: () => "0.1.9",
        quit: vi.fn(),
      },
      net: { fetch: vi.fn() },
      shell,
      dialog: { showMessageBox: vi.fn(() => Promise.resolve({ response: 1 })) },
      Notification: { isSupported: () => false },
    };
    const updater = createUpdater({ electron, autoUpdater, getMainWindow: () => win, platform });
    return { updater, autoUpdater, sent, electron, shell };
  }

  it("on Windows keeps electron-updater's download + install path", async () => {
    const { updater, autoUpdater, sent } = setupController("win32");
    expect(autoUpdater.autoDownload).toBe(true);
    autoUpdater.emit("update-available", { version: "0.2.0", files: [{ url: "riff.quest-Setup-0.2.0.exe" }] });
    expect(updater.getState()).toMatchObject({ status: "downloading", version: "0.2.0" });
    expect(updater.getState().manualDownloadUrl).toMatch(/riff\.quest-Setup-0\.2\.0\.exe$/);

    autoUpdater.emit("update-downloaded", { version: "0.2.0" });
    expect(updater.getPending()).toMatchObject({ version: "0.2.0" });
    expect(sent).toContainEqual(["app:update-ready", { version: "0.2.0" }]);

    await expect(updater.install()).resolves.toEqual({ ok: true });
    expect(autoUpdater.quitAndInstall).toHaveBeenCalled();
  });

  it("reports errors instead of swallowing them, without losing a ready update", () => {
    const { updater, autoUpdater } = setupController("win32");
    autoUpdater.emit("error", new Error("net::ERR_INTERNET_DISCONNECTED"));
    expect(updater.getState()).toMatchObject({ status: "error", error: "net::ERR_INTERNET_DISCONNECTED" });

    autoUpdater.emit("update-downloaded", { version: "0.2.0" });
    autoUpdater.emit("error", new Error("later check failed"));
    expect(updater.getState().status).toBe("ready");
  });

  it("on macOS never lets Squirrel.Mac download or install", () => {
    const { autoUpdater } = setupController("darwin");
    expect(autoUpdater.autoDownload).toBe(false);
    expect(autoUpdater.autoInstallOnAppQuit).toBe(false);
  });

  it("on a macOS copy that can't replace itself, points at the DMG instead of downloading", () => {
    const { updater, autoUpdater, electron } = setupController("darwin", {
      exe: "/Volumes/riff.quest/riff.quest.app/Contents/MacOS/riff.quest",
    });
    expect(updater.getState().canAutoInstall).toBe(false);
    autoUpdater.emit("update-available", MAC_INFO);
    expect(updater.getState()).toMatchObject({ status: "error", error: "read-only-volume", version: "0.2.0" });
    expect(updater.getState().manualDownloadUrl).toMatch(/\.dmg$/);
    expect(electron.net.fetch).not.toHaveBeenCalled();
  });
});
