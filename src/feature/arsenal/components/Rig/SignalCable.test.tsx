// @vitest-environment jsdom

import { render } from "@testing-library/react";
import type {
  ChainLink,
  ChainNode,
  ChainVerdict,
} from "feature/arsenal/data/signalChain";
import { PEDAL_H_PCT, ROW_Y_PCT } from "feature/arsenal/utils/pedalboardLayout";
import { describe, expect, it } from "vitest";

import { SignalCable } from "./SignalCable";

/**
 * The cable is drawn, not computed, so what is worth pinning down is where it
 * ends up: the return run has to take the channel between the two rows instead
 * of cutting a diagonal across the board, and every jack has to get a plug
 * pointing the right way. Both are easy to lose in a refactor and neither shows
 * up in a type error.
 */

/** Board percent a test pedal takes — near enough a standard single. */
const W = 11;

/** The jacket stroke is the one path per run, so counting it counts runs. */
const JACKET = "#0b3b2e";

const toViewY = (yPct: number) => (yPct / 100) * 70;

const row = (yPct: number, count: number): ChainNode[] =>
  Array.from({ length: count }, (_, i) => ({
    itemId: `${yPct}-${i}`,
    name: `pedal ${i}`,
    type: "overdrive" as ChainNode["type"],
    stage: i,
    xPct: 3 + i * (W + 1.5),
    yPct,
  }));

const verdictOf = (nodes: ChainNode[]): ChainVerdict => {
  const links: ChainLink[] = nodes
    .slice(1)
    .map((_, i) => ({ from: i, to: i + 1, ok: true }));
  return {
    nodes,
    links,
    okLinks: links.length,
    wrongLinks: 0,
    flawless: true,
    rate: 30,
    tier: "book",
    tip: null,
    filledStages: [],
  };
};

const draw = (nodes: ChainNode[]) => {
  const { container } = render(
    <SignalCable verdict={verdictOf(nodes)} widthOf={() => W} />,
  );
  const runs = Array.from(container.querySelectorAll("path"))
    .filter((path) => path.getAttribute("stroke") === JACKET)
    .map((path) => path.getAttribute("d") ?? "");
  const plugs = Array.from(container.querySelectorAll("g[transform]")).map(
    (group) => group.getAttribute("transform") ?? "",
  );
  return { runs, plugs };
};

/** Every point a path passes through, in view units. */
const pointsOf = (d: string) =>
  (d.match(/-?\d+(?:\.\d+)?\s-?\d+(?:\.\d+)?/g) ?? []).map((pair) => {
    const [x, y] = pair.split(/\s+/).map(Number);
    return { x, y };
  });

describe("SignalCable", () => {
  it("draws one run per pedal plus the two to the board's own jacks", () => {
    const { runs } = draw([...row(ROW_Y_PCT[0], 4), ...row(ROW_Y_PCT[1], 3)]);

    expect(runs).toHaveLength(8);
    runs.forEach((d) => expect(d).not.toContain("NaN"));
  });

  it("routes the return run through the channel between the rows", () => {
    const nodes = [...row(ROW_Y_PCT[0], 7), ...row(ROW_Y_PCT[1], 5)];
    const { runs } = draw(nodes);

    // The eighth run is the one leaving the last pedal of the top row.
    const rowBottom = toViewY(ROW_Y_PCT[0] + PEDAL_H_PCT);
    const nextRowTop = toViewY(ROW_Y_PCT[1]);
    const crossing = pointsOf(runs[7]).filter(
      (point) => point.x > 20 && point.x < 130,
    );

    expect(crossing.length).toBeGreaterThan(0);
    crossing.forEach((point) => {
      expect(point.y).toBeGreaterThanOrEqual(rowBottom);
      expect(point.y).toBeLessThanOrEqual(nextRowTop);
    });
  });

  it("plugs both sides of every pedal, and nothing else", () => {
    const nodes = [...row(ROW_Y_PCT[0], 3)];
    const { plugs } = draw(nodes);

    // The board's own sockets are drawn at life size by `BoardJack` and show
    // only the cable going in, so nothing is plugged into them here.
    expect(plugs).toHaveLength(nodes.length * 2);
    // A pedal's input faces into the enclosure; its output faces back out.
    expect(plugs[0]).not.toContain("scale(-1 1)");
    expect(plugs[1]).toContain("scale(-1 1)");
  });

  it("still reaches both jacks with a single pedal on the board", () => {
    const { runs } = draw(row(ROW_Y_PCT[0], 1));

    expect(runs).toHaveLength(2);
    runs.forEach((d) => expect(d).not.toContain("NaN"));
  });

  it("draws nothing at all for an empty board", () => {
    const { container } = render(
      <SignalCable verdict={verdictOf([])} widthOf={() => W} />,
    );

    expect(container.querySelector("svg")).toBeNull();
  });
});
