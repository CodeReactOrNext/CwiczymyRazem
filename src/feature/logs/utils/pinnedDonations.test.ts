import type {
  FirebaseLogsDonationInterface,
  FirebaseLogsSongsInterface,
} from "feature/logs/types/logs.type";
import { describe, expect, it } from "vitest";

import { splitPinnedDonations } from "./pinnedDonations";

const TODAY = new Date("2026-07-09T18:00:00.000Z");

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
  it("lifts today's matched donation out of the feed", () => {
    const donation = donationLog();
    const song = songLog();

    const { pinned, rest } = splitPinnedDonations([song, donation], TODAY);

    expect(pinned).toEqual([donation]);
    expect(rest).toEqual([song]);
  });

  it("leaves a donation nobody was matched to where it is", () => {
    const donation = donationLog({ uid: undefined });

    const { pinned, rest } = splitPinnedDonations([donation], TODAY);

    expect(pinned).toEqual([]);
    expect(rest).toEqual([donation]);
  });

  it("leaves yesterday's donation where it is", () => {
    const donation = donationLog({
      timestamp: "2026-07-08T22:00:00.000Z",
      data: "2026-07-08T22:00:00.000Z",
    });

    const { pinned, rest } = splitPinnedDonations([donation], TODAY);

    expect(pinned).toEqual([]);
    expect(rest).toEqual([donation]);
  });

  it("pins the four newest and drops the rest of the day's donations", () => {
    const donations = Array.from({ length: 6 }, (_, index) =>
      donationLog({ id: `donation-${index}` }),
    );

    const { pinned, rest } = splitPinnedDonations(donations, TODAY);

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

    const { rest } = splitPinnedDonations(
      [first, donationLog(), second],
      TODAY,
    );

    expect(rest).toEqual([first, second]);
  });
});
