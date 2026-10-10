import { describe, expect, it } from "vitest";

import {
  railEdges,
  tabNavFadeClass,
  tabNavItemClass,
  tabNavListClass,
  tabNavTriggerClass,
} from "./tabNav";

/**
 * The underline *is* the active state — nine screens share these strings, and
 * an edit that drops it leaves every one of them with no way to tell which tab
 * you are on, on a bar that has no other colour to fall back to.
 */
describe("tabNav", () => {
  it("marks the active item with the underline and a brighter label", () => {
    const active = tabNavItemClass(true);

    expect(active).toContain("border-white");
    expect(active).toContain("text-zinc-50");
    expect(active).not.toContain("border-transparent");
  });

  it("leaves inactive items unmarked", () => {
    const inactive = tabNavItemClass(false);

    expect(inactive).toContain("border-transparent");
    expect(inactive).toContain("text-zinc-400");
    expect(inactive).not.toContain("border-white");
  });

  it("dims a disabled item without promoting it to active", () => {
    const disabled = tabNavItemClass(false, true);

    expect(disabled).toContain("cursor-not-allowed");
    expect(disabled).toContain("opacity-50");
  });

  it("carries the same underline on the Radix trigger, keyed off data-state", () => {
    expect(tabNavTriggerClass).toContain("data-[state=active]:border-white");
    expect(tabNavTriggerClass).toContain("data-[state=active]:text-zinc-50");
  });

  it("gives the rail a single line and lets it scroll rather than wrap", () => {
    expect(tabNavListClass).toContain("border-b border-zinc-800");
    expect(tabNavListClass).toContain("overflow-x-auto");
  });
});

describe("railEdges", () => {
  it("sees nothing past either end when every tab fits", () => {
    expect(
      railEdges({ scrollLeft: 0, scrollWidth: 300, clientWidth: 300 }),
    ).toEqual({ start: false, end: false });
  });

  it("flags the far end of a rail that overflows, before it is scrolled", () => {
    expect(
      railEdges({ scrollLeft: 0, scrollWidth: 634, clientWidth: 360 }),
    ).toEqual({ start: false, end: true });
  });

  it("flags both ends midway, and only the near end once scrolled to the last tab", () => {
    expect(
      railEdges({ scrollLeft: 100, scrollWidth: 634, clientWidth: 360 }),
    ).toEqual({ start: true, end: true });
    expect(
      railEdges({ scrollLeft: 273.6, scrollWidth: 634, clientWidth: 360 }),
    ).toEqual({ start: true, end: false });
  });
});

describe("tabNavFadeClass", () => {
  it("leaves a rail that fits unmasked", () => {
    expect(tabNavFadeClass({ start: false, end: false })).toBe("");
  });

  it("fades only the ends that have tabs past them", () => {
    expect(tabNavFadeClass({ start: false, end: true })).toContain("to_left");
    expect(tabNavFadeClass({ start: true, end: false })).toContain("to_right");
    expect(tabNavFadeClass({ start: true, end: true })).toContain(
      "calc(100%_-_2.5rem)",
    );
  });
});
