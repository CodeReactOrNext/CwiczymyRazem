import { getRecordingLikers } from "feature/recordings/services/getRecordingLikers";
import { documentId, where } from "firebase/firestore";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ __collection: "users" })),
  documentId: vi.fn(() => "__name__"),
  query: vi.fn((...args: unknown[]) => ({ __query: args })),
  where: vi.fn((field: string, op: string, value: string[]) => ({ field, op, value })),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
}));

vi.mock("utils/firebase/client/firestoreTracking", () => ({
  trackedGetDocs: vi.fn(),
}));

/** Answers every `in` query with whichever of `users` it asked for. */
const mockUsers = (users: Record<string, { displayName?: string } | undefined>) => {
  vi.mocked(trackedGetDocs).mockImplementation(async (q: any) => {
    const asked: string[] = q.__query[1].value;
    return {
      docs: asked
        .filter((id) => users[id])
        .map((id) => ({ id, data: () => users[id] })),
    } as any;
  });
};

describe("getRecordingLikers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns names in the order of the ids it was given", async () => {
    mockUsers({ a: { displayName: "Apoth" }, b: { displayName: "Cookie" } });

    await expect(getRecordingLikers(["b", "a"])).resolves.toEqual([
      { id: "b", displayName: "Cookie" },
      { id: "a", displayName: "Apoth" },
    ]);
  });

  it("leaves out accounts that no longer exist", async () => {
    mockUsers({ a: { displayName: "Apoth" } });

    await expect(getRecordingLikers(["gone", "a"])).resolves.toEqual([
      { id: "a", displayName: "Apoth" },
    ]);
  });

  it("keeps an account with no display name, as null", async () => {
    mockUsers({ a: {} });

    await expect(getRecordingLikers(["a"])).resolves.toEqual([{ id: "a", displayName: null }]);
  });

  it("reads nothing for an empty list", async () => {
    await expect(getRecordingLikers([])).resolves.toEqual([]);
    expect(trackedGetDocs).not.toHaveBeenCalled();
  });

  it("asks once per user, however many times an id repeats", async () => {
    mockUsers({ a: { displayName: "Apoth" } });

    await getRecordingLikers(["a", "a", "a"]);

    expect(where).toHaveBeenCalledWith(documentId(), "in", ["a"]);
    expect(trackedGetDocs).toHaveBeenCalledTimes(1);
  });

  it("splits more than ten ids across queries, since `in` takes ten at most", async () => {
    const ids = Array.from({ length: 23 }, (_, i) => `u${i}`);
    mockUsers(Object.fromEntries(ids.map((id) => [id, { displayName: id.toUpperCase() }])));

    const likers = await getRecordingLikers(ids);

    expect(trackedGetDocs).toHaveBeenCalledTimes(3);
    expect(likers.map((liker) => liker.id)).toEqual(ids);
  });
});
