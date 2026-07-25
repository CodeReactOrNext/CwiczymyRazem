import type {
  ElectronAppApi,
  ElectronContextMenuParams,
} from "types/electronApp";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildMenuItems } from "./ElectronIntegrations";

const api = {
  isAvailable: true,
  onContextMenu: vi.fn(),
  onNavigate: vi.fn(),
  editCommand: vi.fn(),
  copyText: vi.fn(),
  setKeepAwake: vi.fn(),
  setProgress: vi.fn(),
  retryConnect: vi.fn(),
} satisfies ElectronAppApi;

const params = (
  overrides: Partial<ElectronContextMenuParams> = {}
): ElectronContextMenuParams => ({
  x: 10,
  y: 10,
  isEditable: false,
  selectionText: "",
  linkURL: "",
  editFlags: {
    canCut: false,
    canCopy: false,
    canPaste: false,
    canSelectAll: false,
  },
  ...overrides,
});

describe("buildMenuItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no items on a dead area (nothing to act on)", () => {
    expect(buildMenuItems(api, params())).toHaveLength(0);
  });

  it("builds the full edit menu for editable targets, honoring editFlags", () => {
    const items = buildMenuItems(
      api,
      params({
        isEditable: true,
        editFlags: {
          canCut: false,
          canCopy: false,
          canPaste: true,
          canSelectAll: true,
        },
      })
    );

    expect(items.map((i) => i.label)).toEqual([
      "Wytnij",
      "Kopiuj",
      "Wklej",
      "Zaznacz wszystko",
    ]);
    expect(items.map((i) => i.enabled)).toEqual([false, false, true, true]);
  });

  it("routes edit actions through the webContents edit commands", () => {
    const items = buildMenuItems(
      api,
      params({
        isEditable: true,
        editFlags: {
          canCut: true,
          canCopy: true,
          canPaste: true,
          canSelectAll: true,
        },
      })
    );

    items.forEach((item) => item.action());
    expect(api.editCommand.mock.calls.map(([cmd]) => cmd)).toEqual([
      "cut",
      "copy",
      "paste",
      "selectAll",
    ]);
  });

  it("offers only copy for a plain text selection", () => {
    const items = buildMenuItems(api, params({ selectionText: "riff" }));

    expect(items.map((i) => i.label)).toEqual(["Kopiuj"]);
    expect(items[0]?.enabled).toBe(true);
  });

  it("ignores whitespace-only selections", () => {
    expect(buildMenuItems(api, params({ selectionText: "  \n" }))).toHaveLength(
      0
    );
  });

  it("adds a copy-link item that writes the URL to the clipboard", () => {
    const items = buildMenuItems(
      api,
      params({ linkURL: "https://riff.quest/dashboard" })
    );

    expect(items.map((i) => i.label)).toEqual(["Kopiuj adres linku"]);
    items[0]?.action();
    expect(api.copyText).toHaveBeenCalledWith("https://riff.quest/dashboard");
  });
});
