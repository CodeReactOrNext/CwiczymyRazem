// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FRETWEAVER } from "../data/fretweaver";
import { useBossFightStore } from "../store/bossFightStore";
import { fightWith } from "../utils/fightFixtures";
import { BossWebOverlay } from "./BossWebOverlay";

describe("BossWebOverlay", () => {
  afterEach(cleanup);

  it("covers the tab while the spider's web is on it", () => {
    useBossFightStore.setState({ fight: { ...fightWith({}, { affixes: ["web"] }), webNotes: 3 } });
    render(<BossWebOverlay boss={FRETWEAVER} />);
    expect(screen.getByText("Webbed — play from memory")).toBeTruthy();
  });

  it("leaves the tab alone otherwise", () => {
    useBossFightStore.setState({ fight: fightWith({}, { affixes: ["web"] }) });
    render(<BossWebOverlay boss={FRETWEAVER} />);
    expect(screen.queryByText("Webbed — play from memory")).toBeNull();
  });
});
