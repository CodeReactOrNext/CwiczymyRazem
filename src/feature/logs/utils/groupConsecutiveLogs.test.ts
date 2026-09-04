import type {
  FirebaseLogsCaseOpenInterface,
  FirebaseLogsDonationInterface,
  FirebaseLogsMarketplaceInterface,
  FirebaseLogsMarketplacePurchaseInterface,
  FirebaseLogsSongsInterface,
} from "feature/logs/types/logs.type";
import { describe, expect, it } from "vitest";

import {
  dropIncompleteTailGroup,
  getLogActivityType,
  groupConsecutiveLogs,
} from "./groupConsecutiveLogs";

const caseOpenLog = (
  overrides: Partial<FirebaseLogsCaseOpenInterface> = {}
): FirebaseLogsCaseOpenInterface => ({
  type: "case_open",
  uid: "user-1",
  userName: "Cookie",
  avatarUrl: null,
  timestamp: "2026-07-09T21:20:00.000Z",
  data: "2026-07-09T21:20:00.000Z",
  caseType: "standard",
  caseName: "Standard Case",
  itemType: "guitar",
  itemName: "JSC",
  itemBrand: "Izanor",
  itemRarity: "Common",
  itemImageId: 1,
  ...overrides,
});

const marketplaceLog = (
  overrides: Partial<FirebaseLogsMarketplaceInterface> = {}
): FirebaseLogsMarketplaceInterface => ({
  type: "marketplace_listing",
  uid: "user-1",
  userName: "Cookie",
  avatarUrl: null,
  timestamp: "2026-07-09T21:20:00.000Z",
  data: "2026-07-09T21:20:00.000Z",
  itemType: "guitar",
  itemName: "JSC",
  itemBrand: "Izanor",
  itemRarity: "Common",
  itemImageId: 1,
  price: 70,
  ...overrides,
});

const marketplacePurchaseLog = (
  overrides: Partial<FirebaseLogsMarketplacePurchaseInterface> = {}
): FirebaseLogsMarketplacePurchaseInterface => ({
  type: "marketplace_purchase",
  uid: "user-1",
  userName: "Cookie",
  avatarUrl: null,
  timestamp: "2026-07-09T21:20:00.000Z",
  data: "2026-07-09T21:20:00.000Z",
  sellerId: "user-2",
  sellerName: "Other",
  itemType: "guitar",
  itemName: "JSC",
  itemBrand: "Izanor",
  itemRarity: "Common",
  itemImageId: 1,
  price: 70,
  ...overrides,
});

const songLog = (
  overrides: Partial<FirebaseLogsSongsInterface> = {}
): FirebaseLogsSongsInterface => ({
  uid: "user-1",
  data: "2026-07-09T21:20:00.000Z",
  userName: "Cookie",
  songTitle: "Song",
  songArtist: "Artist",
  status: "learning",
  avatarUrl: undefined,
  timestamp: "2026-07-09T21:20:00.000Z",
  ...overrides,
});

const donationLog = (
  overrides: Partial<FirebaseLogsDonationInterface> = {}
): FirebaseLogsDonationInterface => ({
  type: "donation_received",
  data: "2026-07-09T21:20:00.000Z",
  timestamp: "2026-07-09T21:20:00.000Z",
  supporterName: "Cookie",
  amount: 5,
  kind: "one_off",
  uid: "user-1",
  userName: "Cookie",
  ...overrides,
});

describe("groupConsecutiveLogs", () => {
  it("groups consecutive case-open and marketplace logs from the same user as one arsenal group", () => {
    const logs = [marketplaceLog(), caseOpenLog(), marketplaceLog(), marketplaceLog()];

    const groups = groupConsecutiveLogs(logs);

    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe("arsenal");
    expect(groups[0].logs).toHaveLength(4);
  });

  it("classifies a marketplace purchase as its own activity type inside the arsenal group", () => {
    const purchase = marketplacePurchaseLog();

    expect(getLogActivityType(purchase)).toBe("marketplacePurchase");

    const groups = groupConsecutiveLogs([marketplaceLog(), purchase, caseOpenLog()]);

    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe("arsenal");
    expect(groups[0].logs).toHaveLength(3);
  });

  it("breaks the arsenal group when a different user's log appears", () => {
    const logs = [caseOpenLog(), marketplaceLog({ uid: "user-2", userName: "Other" })];

    const groups = groupConsecutiveLogs(logs);

    expect(groups).toHaveLength(2);
    expect(groups[0].type).toBe("arsenal");
    expect(groups[1].type).toBe("arsenal");
  });

  it("breaks the arsenal group when an unrelated activity type appears in between", () => {
    const logs = [caseOpenLog(), songLog(), marketplaceLog()];

    const groups = groupConsecutiveLogs(logs);

    expect(groups).toHaveLength(3);
    expect(groups[0].type).toBe("arsenal");
    expect(groups[1].type).toBe("song");
    expect(groups[2].type).toBe("arsenal");
  });

  it("gathers one donor's coffees from the same day even with other activity in between", () => {
    const logs = [
      donationLog({ timestamp: "2026-07-09T21:20:00.000Z" }),
      songLog(),
      donationLog({ timestamp: "2026-07-09T09:05:00.000Z" }),
    ];

    const groups = groupConsecutiveLogs(logs);

    expect(groups).toHaveLength(2);
    expect(groups[0].type).toBe("donationReceived");
    expect(groups[0].logs).toHaveLength(2);
    expect(groups[1].type).toBe("song");
  });

  it("keeps a donor's coffees from different days apart", () => {
    const groups = groupConsecutiveLogs([
      donationLog({ timestamp: "2026-07-09T21:20:00.000Z" }),
      donationLog({ timestamp: "2026-07-08T21:20:00.000Z" }),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("keeps donations from different donors apart", () => {
    const groups = groupConsecutiveLogs([
      donationLog(),
      donationLog({ uid: "user-2", userName: "Other" }),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("never gathers donations that were not matched to an account", () => {
    const groups = groupConsecutiveLogs([
      donationLog({ uid: undefined }),
      donationLog({ uid: undefined }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].uid).toBeUndefined();
  });
});

describe("dropIncompleteTailGroup", () => {
  const groups = () =>
    groupConsecutiveLogs([
      caseOpenLog(),
      songLog({ uid: "user-2", userName: "Other" }),
      caseOpenLog({ uid: "user-3", userName: "Third" }),
    ]);

  it("drops the last group when older logs sit below the window", () => {
    const kept = dropIncompleteTailGroup(groups(), true);

    expect(kept).toHaveLength(2);
    expect(kept[1].uid).toBe("user-2");
  });

  it("keeps every group when the window already reaches the oldest log", () => {
    expect(dropIncompleteTailGroup(groups(), false)).toHaveLength(3);
  });

  it("keeps a lone group rather than emptying the feed", () => {
    const single = groupConsecutiveLogs([caseOpenLog(), marketplaceLog()]);

    expect(dropIncompleteTailGroup(single, true)).toEqual(single);
  });
});
