import { DEFAULT_LAYOUT } from "feature/dashboard/utils/dashboardLayout";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  firebaseGetDashboardLayout,
  firebaseSaveDashboardLayout,
} from "./dashboardLayout.service";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({
    path: segments.join("/"),
  })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
}));

const snapshot = (data: Record<string, unknown> | null) => ({
  exists: () => data !== null,
  data: () => data ?? undefined,
});

describe("dashboardLayout.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the layout from the user's settings subcollection", async () => {
    vi.mocked(getDoc).mockResolvedValue(snapshot(null) as never);

    await firebaseGetDashboardLayout("uid-1");

    expect(doc).toHaveBeenCalledWith(
      {},
      "users",
      "uid-1",
      "settings",
      "dashboard",
    );
  });

  it("hands back the default layout when nothing has been saved yet", async () => {
    vi.mocked(getDoc).mockResolvedValue(snapshot(null) as never);

    const layout = await firebaseGetDashboardLayout("uid-1");

    expect(layout).toEqual(DEFAULT_LAYOUT);
    expect(layout).not.toBe(DEFAULT_LAYOUT);
  });

  it("normalises whatever is stored instead of trusting it", async () => {
    vi.mocked(getDoc).mockResolvedValue(
      snapshot({
        version: 1,
        widgets: [
          { id: "streak", size: "half" },
          { id: "gone", size: "full" },
        ],
        shortcuts: ["wiki", "nowhere"],
        updatedAt: { seconds: 1 },
      }) as never,
    );

    const layout = await firebaseGetDashboardLayout("uid-1");

    expect(layout).toEqual({
      version: 1,
      widgets: [{ id: "streak", size: "half" }],
      shortcuts: ["wiki"],
    });
  });

  it("writes only the layout fields plus a server timestamp, merging into the doc", async () => {
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await firebaseSaveDashboardLayout("uid-1", {
      version: 1,
      widgets: [{ id: "rank", size: "half" }],
      shortcuts: ["settings"],
    });

    expect(setDoc).toHaveBeenCalledWith(
      { path: "users/uid-1/settings/dashboard" },
      {
        version: 1,
        widgets: [{ id: "rank", size: "half" }],
        shortcuts: ["settings"],
        updatedAt: { __serverTimestamp: true },
      },
      { merge: true },
    );
  });
});
