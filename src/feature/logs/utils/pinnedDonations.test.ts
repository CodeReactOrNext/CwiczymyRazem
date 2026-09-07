import type {
  FirebaseLogsDonationInterface,
  FirebaseLogsSongsInterface,
} from "feature/logs/types/logs.type";
import { describe, expect, it } from "vitest";

import type { AnyFirebaseLog } from "./groupConsecutiveLogs";
import {
  mergePinnedDonations,
  pinnedDonationsSince,
  splitPinnedDonations,
} from "./pinnedDonations";

const NOW = new Date("2026-07-09T18:00:00.000Z");

/** Just inside the 24h window — last night's coffee, still owed its place at the top. */
const LAST_NIGHT = "2026-07-08T22:00:00.000Z";
/** Just past it. */
const TOO_OLD = "2026-07-08T17:59:59.000Z";

const donationLog = (
  overrides: Partial<FirebaseLogsDonationInterface> = {},
): FirebaseLogsDonationInterface => ({
  type: "donation_received",
  data: "2026-07-09T12:00:00.000Z",
  timestamp: "2026-07-09T12:00:00.000Z",
  supporterName: "Cookie",
  amount: 5,
  kind: "one_off",
  uid: "user-1",
  userName: "Cookie",
  ...overrides,
});

const songLog = (
  overrides: Partial<FirebaseLogsSongsInterface> = {},
): FirebaseLogsSongsInterface => ({
  uid: "user-2",
  data: "2026-07-09T13:00:00.000Z",
  userName: "Other",
  songTitle: "Song",
  songArtist: "Artist",
  status: "learning",
  avatarUrl: undefined,
  timestamp: "2026-07-09T13:00:00.000Z",
  ...overrides,
});

describe("splitPinnedDonations", () => {
  it("lifts a recent matched donation out of the feed", () => {
    const donation = donationLog();
    const song = songLog();

    const { pinned, rest } = splitPinnedDonations([song, donation], NOW);

    expect(pinned).toEqual([donation]);
    expect(rest).toEqual([song]);
  });

  it("leaves a donation nobody was matched to where it is", () => {
    const donation = donationLog({ uid: undefined });

    const { pinned, rest } = splitPinnedDonations([donation], NOW);

    expect(pinned).toEqual([]);
    expect(rest).toEqual([donation]);
  });

  it("still pins last night's donation the next afternoon", () => {
    const donation = donationLog({ timestamp: LAST_NIGHT, data: LAST_NIGHT });

    const { pinned, rest } = splitPinnedDonations([donation], NOW);

    expect(pinned).toEqual([donation]);
    expect(rest).toEqual([]);
  });

  it("leaves a donation older than 24h where it is", () => {
    const donation = donationLog({ timestamp: TOO_OLD, data: TOO_OLD });

    const { pinned, rest } = splitPinnedDonations([donation], NOW);

    expect(pinned).toEqual([]);
    expect(rest).toEqual([donation]);
  });

  it("pins the four newest and drops the rest", () => {
    const donations = Array.from({ length: 6 }, (_, index) =>
      donationLog({ id: `donation-${index}` }),
    );

    const { pinned, rest } = splitPinnedDonations(donations, NOW);

    expect(pinned.map((log) => log.id)).toEqual([
      "donation-0",
      "donation-1",
      "donation-2",
      "donation-3",
    ]);
    expect(rest).toEqual([]);
  });

  it("keeps the order of everything it does not pin", () => {
    const first = songLog({ id: "song-1" });
    const second = songLog({ id: "song-2" });

    const { rest } = splitPinnedDonations([first, donationLog(), second], NOW);

    expect(rest).toEqual([first, second]);
  });
});

describe("mergePinnedDonations", () => {
  it("puts back a donation the page has scrolled past", () => {
    const donation = donationLog({ id: "donation-1" });
    const page: AnyFirebaseLog[] = [songLog({ id: "song-1" })];

    const merged = mergePinnedDonations(page, [donation], NOW);

    expect(merged).toEqual([donation, ...page]);
    expect(splitPinnedDonations(merged, NOW).pinned).toEqual([donation]);
  });

  it("does not render a donation the page still carries twice", () => {
    const donation = donationLog({ id: "donation-1" });
    const page: AnyFirebaseLog[] = [donation, songLog({ id: "song-1" })];

    expect(mergePinnedDonations(page, [donation], NOW)).toEqual(page);
  });

  it("leaves the page untouched when there is nothing to splice in", () => {
    const page: AnyFirebaseLog[] = [songLog({ id: "song-1" })];

    expect(mergePinnedDonations(page, [], NOW)).toBe(page);
  });

  it("ignores a donation that would not be pinned anyway", () => {
    const page: AnyFirebaseLog[] = [songLog({ id: "song-1" })];
    const anonymous = donationLog({ id: "donation-1", uid: undefined });
    const expired = donationLog({
      id: "donation-2",
      timestamp: TOO_OLD,
      data: TOO_OLD,
    });

    expect(mergePinnedDonations(page, [anonymous, expired], NOW)).toBe(page);
  });

  it("keeps the donations newest first, ahead of the page", () => {
    const newer = donationLog({
      id: "donation-newer",
      timestamp: "2026-07-09T15:00:00.000Z",
    });
    const older = donationLog({
      id: "donation-older",
      timestamp: "2026-07-09T09:00:00.000Z",
    });

    const merged = mergePinnedDonations<AnyFirebaseLog>(
      [songLog()],
      [newer, older],
      NOW,
    );

    expect(merged.slice(0, 2)).toEqual([newer, older]);
  });
});

describe("pinnedDonationsSince", () => {
  it("bounds the query 24h back, not at midnight", () => {
    expect(pinnedDonationsSince(NOW)).toBe("2026-07-08T18:00:00.000Z");
  });

  it("sorts before every timestamp inside the window and after every one outside it", () => {
    const since = pinnedDonationsSince(NOW);

    expect(LAST_NIGHT >= since).toBe(true);
    expect(TOO_OLD >= since).toBe(false);
  });
});
