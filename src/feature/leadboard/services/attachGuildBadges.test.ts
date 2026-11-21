import { attachGuildBadges } from "feature/leadboard/services/attachGuildBadges";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  documentId: vi.fn(() => "__id__"),
  query: vi.fn((_col: unknown, filter: unknown) => filter),
  where: vi.fn((_field: unknown, _op: string, ids: string[]) => ({ ids })),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

vi.mock("utils/firebase/client/firestoreTracking", () => ({
  trackedGetDocs: vi.fn(),
}));

const row = (profileId: string) =>
  ({ profileId, displayName: profileId }) as FirebaseUserDataInterface;

const badge = (tag: string) => ({
  guildId: "g1",
  tag,
  accent: "accent:zinc",
  frame: "frame:plain",
  level: 1,
});

describe("attachGuildBadges", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds the badge to players who wear one and leaves the rest alone", async () => {
    vi.mocked(trackedGetDocs).mockResolvedValue({
      docs: [
        { id: "anna", data: () => ({ guildBadge: badge("RIFF") }) },
        { id: "bob", data: () => ({}) },
      ],
    } as never);

    const result = await attachGuildBadges([row("anna"), row("bob")]);

    expect(result[0].guildBadge?.tag).toBe("RIFF");
    expect(result[1].guildBadge).toBeUndefined();
  });

  it("asks in batches of thirty ids", async () => {
    vi.mocked(trackedGetDocs).mockResolvedValue({ docs: [] } as never);

    await attachGuildBadges(
      Array.from({ length: 31 }, (_, index) => row(`p${index}`)),
    );

    const calls = vi.mocked(trackedGetDocs).mock.calls;
    expect(calls).toHaveLength(2);
    expect((calls[0][0] as unknown as { ids: string[] }).ids).toHaveLength(30);
    expect((calls[1][0] as unknown as { ids: string[] }).ids).toHaveLength(1);
  });

  it("returns the rows untouched when the lookup fails", async () => {
    vi.mocked(trackedGetDocs).mockRejectedValue(new Error("denied"));
    const rows = [row("anna")];

    expect(await attachGuildBadges(rows)).toBe(rows);
  });

  it("does not query for an empty page", async () => {
    expect(await attachGuildBadges([])).toEqual([]);
    expect(trackedGetDocs).not.toHaveBeenCalled();
  });
});
