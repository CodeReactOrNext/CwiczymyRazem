import {
  feedScrollClass,
  MOBILE_PANEL_SCROLL_CLASS,
  PANEL_SCROLL_CLASS,
  panelHeightClass,
} from "layouts/LogsBoxLayout/logsBoxPanel";
import { describe, expect, it } from "vitest";

describe("panelHeightClass", () => {
  it("bounds every tab to the screen on phones", () => {
    for (const tab of ["logs", "chat", "guild", "changelog"] as const) {
      expect(panelHeightClass({ tab, hasOwnHeight: false })).toContain(
        "h-[70dvh]",
      );
    }
  });

  it("lets the feed grow the page from sm up, as it always has", () => {
    expect(panelHeightClass({ tab: "logs", hasOwnHeight: false })).toContain(
      "sm:h-auto",
    );
  });

  it("keeps the tall tabs' desktop box", () => {
    for (const tab of ["chat", "guild", "changelog"] as const) {
      const height = panelHeightClass({ tab, hasOwnHeight: false });
      expect(height).toContain("sm:h-[650px]");
      expect(height).toContain("lg:h-[800px]");
    }
  });

  it("adds no height when something outside already sized the panel", () => {
    for (const tab of ["logs", "chat", "guild", "changelog"] as const) {
      expect(panelHeightClass({ tab, hasOwnHeight: true })).toBe("");
    }
  });
});

describe("feedScrollClass", () => {
  it("scrolls at every width inside the drawer", () => {
    expect(feedScrollClass(true)).toBe(PANEL_SCROLL_CLASS);
  });

  it("scrolls only on phones on a page, where the panel is bounded", () => {
    expect(feedScrollClass(false)).toBe(MOBILE_PANEL_SCROLL_CLASS);
    expect(feedScrollClass(false)).toContain("sm:overflow-visible");
  });
});
