import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

let reportData: Record<string, unknown> | undefined;
const updateMock = vi.fn(async () => {});
const deleteMock = vi.fn(async () => {});

vi.mock("utils/firebase/api/firebase.config", () => ({
  auth: {
    verifyIdToken: async (token: string) => {
      if (token !== "good-token") throw new Error("bad token");
      return { uid: "user-1" };
    },
  },
  firestore: {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({
              exists: reportData !== undefined,
              data: () => reportData,
            }),
            update: updateMock,
            delete: deleteMock,
            set: async () => {},
          }),
        }),
      }),
    }),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { increment: (n: number) => ({ increment: n }) },
}));

vi.mock("feature/logs/services/getUserRaprotsLogs.service", () => ({
  invalidateActivityLogsCache: vi.fn(),
}));

const { default: handler } =
  await import("../../../pages/api/user/report/manage");

const call = async (method: string, body: Record<string, unknown>) => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  await handler(
    { method, body } as NextApiRequest,
    res as unknown as NextApiResponse
  );
  return res;
};

const REPORT_ID = "2026-09-24T10:00:00.000Z";

const fullEdit = {
  title: "Edited",
  description: "note",
  timeSumary: {
    techniqueTime: 60000,
    theoryTime: 0,
    hearingTime: 0,
    creativityTime: 0,
  },
};

beforeEach(() => {
  reportData = { timeSumary: {}, reportDate: { toDate: () => new Date() } };
  updateMock.mockClear();
  deleteMock.mockClear();
});

describe("PATCH /api/user/report/manage — note only", () => {
  it.each([
    ["song", { songId: "song-1" }],
    ["plan", { planId: "plan-1" }],
    ["manual", {}],
  ])("saves a note on a %s report", async (_, extra) => {
    reportData = { ...reportData, ...extra };
    const res = await call("PATCH", {
      idToken: "good-token",
      reportId: REPORT_ID,
      updates: { description: "  Bridge still messy at 90 BPM  " },
    });

    expect(res.statusCode).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      description: "Bridge still messy at 90 BPM",
    });
  });

  it("rejects a note over the length limit", async () => {
    const res = await call("PATCH", {
      idToken: "good-token",
      reportId: REPORT_ID,
      updates: { description: "x".repeat(501) },
    });

    expect(res.statusCode).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects a non-string note", async () => {
    const res = await call("PATCH", {
      idToken: "good-token",
      reportId: REPORT_ID,
      updates: { description: 42 },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("PATCH /api/user/report/manage — full edit", () => {
  it("still refuses to edit time on a song report", async () => {
    reportData = { ...reportData, songId: "song-1" };
    const res = await call("PATCH", {
      idToken: "good-token",
      reportId: REPORT_ID,
      updates: fullEdit,
    });

    expect(res.statusCode).toBe(403);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("still refuses a note smuggled alongside a title on a plan report", async () => {
    reportData = { ...reportData, planId: "plan-1" };
    const res = await call("PATCH", {
      idToken: "good-token",
      reportId: REPORT_ID,
      updates: { description: "note", title: "Renamed" },
    });

    expect(res.statusCode).toBe(403);
  });

  it("edits a manual report", async () => {
    const res = await call("PATCH", {
      idToken: "good-token",
      reportId: REPORT_ID,
      updates: fullEdit,
    });

    expect(res.statusCode).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ exceriseTitle: "Edited", description: "note" })
    );
  });
});

describe("DELETE /api/user/report/manage", () => {
  it("still refuses to delete a song report", async () => {
    reportData = { ...reportData, songId: "song-1" };
    const res = await call("DELETE", {
      idToken: "good-token",
      reportId: REPORT_ID,
    });

    expect(res.statusCode).toBe(403);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
