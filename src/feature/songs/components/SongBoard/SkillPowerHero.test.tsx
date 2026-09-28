// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SkillPowerHero } from "./SkillPowerHero";

afterEach(cleanup);

const tier = { tier: "C", color: "#22c55e" };

describe("SkillPowerHero", () => {
  it("shows an unassessed state instead of a 0.0 score when nothing is mastered", () => {
    render(
      <SkillPowerHero skillPower={0} playerTier={tier} learnedCount={0} totalCount={1} />,
    );

    expect(screen.getByText("Tier not assessed yet")).toBeDefined();
    expect(screen.queryByText("0.0")).toBeNull();
    expect(screen.queryByText("Power score")).toBeNull();
  });

  it("shows the power score once a song is mastered", () => {
    render(
      <SkillPowerHero skillPower={2.4} playerTier={tier} learnedCount={1} totalCount={3} />,
    );

    expect(screen.getByText("2.4")).toBeDefined();
    expect(screen.queryByText("Tier not assessed yet")).toBeNull();
  });
});
