import { describe, expect, it } from "vitest";

import type { CalendarItem, CalendarLinks } from "../types/calendar.types";
import {
  copySlots,
  diffLinks,
  linkDates,
  linkedSiblings,
  syncLinkedDays,
  unlinkDates,
} from "./linkedDays";

const item = (
  id: string,
  change: Partial<CalendarItem> = {},
): CalendarItem => ({
  id,
  kind: "exercise",
  area: "technique",
  minutes: 10,
  role: "main",
  auto: false,
  done: false,
  exerciseId: id,
  ...change,
});

const MON = "2026-11-02";
const WED = "2026-11-04";
const SUN = "2026-11-08";
const TUE = "2026-11-03";

const LINKS: CalendarLinks = { [MON]: "g1", [WED]: "g1", [SUN]: "g1" };

describe("linkedSiblings", () => {
  it("lists the other days of the group, oldest first", () => {
    expect(linkedSiblings(LINKS, SUN)).toEqual([MON, WED]);
  });

  it("is empty for a day in no group", () => {
    expect(linkedSiblings(LINKS, TUE)).toEqual([]);
  });
});

describe("copySlots", () => {
  it("keeps the target's own ticks, by slot id", () => {
    const source = [item("a", { done: true }), item("b")];
    const target = [item("a"), item("b", { done: true })];
    expect(copySlots(source, target).map((slot) => slot.done)).toEqual([
      false,
      true,
    ]);
  });
});

describe("syncLinkedDays", () => {
  it("copies an edit to every other day of the group", () => {
    const days = {
      [MON]: [item("a")],
      [WED]: [item("a")],
      [SUN]: [item("a")],
    };
    const patch = { [WED]: [item("a"), item("b")] };
    const synced = syncLinkedDays(patch, LINKS, days);
    expect(Object.keys(synced).sort()).toEqual([MON, WED, SUN]);
    expect(synced[MON].map((slot) => slot.id)).toEqual(["a", "b"]);
    expect(synced[SUN].map((slot) => slot.id)).toEqual(["a", "b"]);
  });

  it("does not spread one day's tick to the others", () => {
    const days = {
      [MON]: [item("a")],
      [WED]: [item("a")],
      [SUN]: [item("a")],
    };
    const synced = syncLinkedDays(
      { [MON]: [item("a", { done: true })] },
      LINKS,
      days,
    );
    // Nothing else changes, so nothing else is written.
    expect(Object.keys(synced)).toEqual([MON]);
  });

  it("leaves a day alone that is not linked", () => {
    const synced = syncLinkedDays({ [TUE]: [item("x")] }, LINKS, {});
    expect(synced).toEqual({ [TUE]: [item("x")] });
  });

  it("keeps a sibling as the patch has it; the first day written leads", () => {
    const patch = { [MON]: [item("a")], [WED]: [item("z")] };
    const synced = syncLinkedDays(patch, LINKS, {});
    expect(synced[WED]).toEqual([item("z")]);
    expect(synced[SUN].map((slot) => slot.id)).toEqual(["a"]);
  });
});

describe("linkDates", () => {
  it("joins the targets to the source's group", () => {
    expect(linkDates(LINKS, MON, [TUE], () => "new")).toEqual({
      ...LINKS,
      [TUE]: "g1",
    });
  });

  it("opens a group when the source has none", () => {
    expect(linkDates({}, TUE, [SUN], () => "g2")).toEqual({
      [TUE]: "g2",
      [SUN]: "g2",
    });
  });

  it("moves a target out of its old group, dissolving a group left alone", () => {
    const links = { [MON]: "g1", [WED]: "g1", [TUE]: "g2" };
    expect(linkDates(links, TUE, [WED], () => "new")).toEqual({
      [TUE]: "g2",
      [WED]: "g2",
    });
  });
});

describe("unlinkDates", () => {
  it("takes a day out and keeps the rest of the group", () => {
    expect(unlinkDates(LINKS, [SUN])).toEqual({ [MON]: "g1", [WED]: "g1" });
  });

  it("dissolves a group of one", () => {
    expect(unlinkDates(LINKS, [SUN, WED])).toEqual({});
  });
});

describe("diffLinks", () => {
  it("names the changed days and nulls the dropped ones", () => {
    expect(diffLinks(LINKS, { [MON]: "g1", [WED]: "g2", [TUE]: "g2" })).toEqual(
      { [SUN]: null, [WED]: "g2", [TUE]: "g2" },
    );
  });
});
