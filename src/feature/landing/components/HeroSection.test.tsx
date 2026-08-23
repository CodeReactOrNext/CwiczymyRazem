// @vitest-environment jsdom

import { HeroSection } from "feature/landing/components/HeroSection";
import { HERO_STATS } from "feature/landing/data/heroStats";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("HeroSection", () => {
  /**
   * The count-up used to start its motion value at 0, so the server-rendered
   * HTML shipped "0+ guitarists on board" to crawlers and no-JS readers.
   */
  it("ships the real stat numbers in the server-rendered HTML", () => {
    const html = renderToString(<HeroSection />);

    HERO_STATS.forEach((stat) => {
      expect(html).toContain(`${stat.value.toLocaleString("en-US")}+`);
      expect(html).toContain(stat.label);
    });
    expect(html).not.toContain(">0+<");
  });

  it("keeps both target keywords in the H1", () => {
    const html = renderToString(<HeroSection />);

    expect(html).toContain("The free guitar practice app");
    expect(html).toContain("that tracks real progress");
  });
});
