// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { TooltipProvider } from "assets/components/ui/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";

import AchievementIcon from "./AchievementIcon";

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderIcon = (id: string) =>
  render(
    <TooltipProvider>
      <AchievementIcon id={id as never} />
    </TooltipProvider>,
  );

describe("AchievementIcon", () => {
  afterEach(cleanup);

  it("renders the icon of an achievement the catalog defines", () => {
    expect(renderIcon("record").container.querySelector("svg")).not.toBeNull();
  });

  it("renders nothing for an id the catalog no longer defines", () => {
    // Stale ids live on in old user documents and old log entries; rendering one
    // used to throw and take the whole surrounding feed down with it.
    expect(renderIcon("achievement_that_was_removed").container.innerHTML).toBe("");
  });
});
