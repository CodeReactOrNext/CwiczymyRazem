import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as macPermissions from "./macPermissions";

// Fake electron surface — see the lazy `api()` indirection in macPermissions.js
// for why the real module can't be reached from Node/Vitest.
function makeElectron({ status = "not-determined", grant = true, dialogResponse = 1 } = {}) {
  return {
    systemPreferences: {
      getMediaAccessStatus: vi.fn(() => status),
      askForMediaAccess: vi.fn(async () => grant),
    },
    dialog: { showMessageBox: vi.fn(async () => ({ response: dialogResponse })) },
    shell: { openExternal: vi.fn() },
  };
}

let electron;

beforeEach(() => {
  electron = makeElectron();
  macPermissions._setEnvForTests({ electron, platform: "darwin" });
});

afterEach(() => {
  macPermissions._setEnvForTests();
});

describe("ensureMicrophoneAccess", () => {
  it("never touches the electron APIs off macOS", async () => {
    macPermissions._setEnvForTests({ electron, platform: "win32" });

    await expect(macPermissions.ensureMicrophoneAccess()).resolves.toBe(true);
    expect(electron.systemPreferences.getMediaAccessStatus).not.toHaveBeenCalled();
    expect(electron.systemPreferences.askForMediaAccess).not.toHaveBeenCalled();
  });

  it("does not re-prompt once access is already granted", async () => {
    electron.systemPreferences.getMediaAccessStatus.mockReturnValue("granted");

    await expect(macPermissions.ensureMicrophoneAccess()).resolves.toBe(true);
    expect(electron.systemPreferences.askForMediaAccess).not.toHaveBeenCalled();
  });

  it("prompts when access has not been requested yet", async () => {
    await expect(macPermissions.ensureMicrophoneAccess()).resolves.toBe(true);
    expect(electron.systemPreferences.askForMediaAccess).toHaveBeenCalledWith("microphone");
    expect(electron.dialog.showMessageBox).not.toHaveBeenCalled();
  });

  it("skips the pointless prompt when already denied and explains instead", async () => {
    // macOS silently resolves askForMediaAccess(false) forever once denied, so
    // the only useful move left is pointing the user at System Settings.
    electron = makeElectron({ status: "denied" });
    macPermissions._setEnvForTests({ electron, platform: "darwin" });

    await expect(macPermissions.ensureMicrophoneAccess()).resolves.toBe(false);
    expect(electron.systemPreferences.askForMediaAccess).not.toHaveBeenCalled();
    expect(electron.dialog.showMessageBox).toHaveBeenCalled();
  });

  it("treats a restricted (MDM-managed) mic the same as denied", async () => {
    electron = makeElectron({ status: "restricted" });
    macPermissions._setEnvForTests({ electron, platform: "darwin" });

    await expect(macPermissions.ensureMicrophoneAccess()).resolves.toBe(false);
    expect(electron.dialog.showMessageBox).toHaveBeenCalled();
  });

  it("explains rather than silently failing when the user declines the prompt", async () => {
    electron = makeElectron({ grant: false });
    macPermissions._setEnvForTests({ electron, platform: "darwin" });

    await expect(macPermissions.ensureMicrophoneAccess()).resolves.toBe(false);
    expect(electron.dialog.showMessageBox).toHaveBeenCalled();
  });

  it("opens the privacy pane when the user picks that button", async () => {
    electron = makeElectron({ status: "denied", dialogResponse: 0 });
    macPermissions._setEnvForTests({ electron, platform: "darwin" });

    await macPermissions.ensureMicrophoneAccess();
    expect(electron.shell.openExternal).toHaveBeenCalledWith(
      expect.stringContaining("Privacy_Microphone"),
    );
  });

  it("shows one prompt for concurrent requests, not one per caller", async () => {
    // Starting a session can fire capture and amp start back to back.
    const results = await Promise.all([
      macPermissions.ensureMicrophoneAccess(),
      macPermissions.ensureMicrophoneAccess(),
      macPermissions.ensureMicrophoneAccess(),
    ]);

    expect(results).toEqual([true, true, true]);
    expect(electron.systemPreferences.askForMediaAccess).toHaveBeenCalledTimes(1);
  });

  it("prompts again on a later attempt after the first was declined", async () => {
    electron = makeElectron({ grant: false });
    macPermissions._setEnvForTests({ electron, platform: "darwin" });
    await macPermissions.ensureMicrophoneAccess();

    electron.systemPreferences.askForMediaAccess.mockResolvedValue(true);
    await expect(macPermissions.ensureMicrophoneAccess()).resolves.toBe(true);
    expect(electron.systemPreferences.askForMediaAccess).toHaveBeenCalledTimes(2);
  });
});

describe("requireMicrophoneAccess", () => {
  it("resolves silently when access is granted", async () => {
    electron.systemPreferences.getMediaAccessStatus.mockReturnValue("granted");
    await expect(macPermissions.requireMicrophoneAccess()).resolves.toBeUndefined();
  });

  it("rejects with an actionable message so the renderer surfaces it", async () => {
    electron = makeElectron({ status: "denied" });
    macPermissions._setEnvForTests({ electron, platform: "darwin" });

    await expect(macPermissions.requireMicrophoneAccess()).rejects.toThrow(
      /System Settings/,
    );
  });
});

describe("dialog parenting", () => {
  it("attaches to the main window as a sheet when one is alive", async () => {
    electron = makeElectron({ status: "denied" });
    macPermissions._setEnvForTests({ electron, platform: "darwin" });
    const parent = { isDestroyed: () => false };

    await macPermissions.ensureMicrophoneAccess(parent);
    expect(electron.dialog.showMessageBox.mock.calls[0][0]).toBe(parent);
  });

  it("falls back to a standalone dialog when the window is gone", async () => {
    electron = makeElectron({ status: "denied" });
    macPermissions._setEnvForTests({ electron, platform: "darwin" });

    await macPermissions.ensureMicrophoneAccess({ isDestroyed: () => true });
    expect(electron.dialog.showMessageBox.mock.calls[0].length).toBe(1);
  });
});
