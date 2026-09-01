// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { BOARD_TIERS } from "feature/arsenal/data/rigHardware";
import type {
  ChainLink,
  ChainNode,
  ChainVerdict,
} from "feature/arsenal/data/signalChain";
import type { EffectJackLayout } from "feature/arsenal/types/arsenal.types";
import {
  geometryFor,
  SIDE_JACKS,
} from "feature/arsenal/utils/pedalboardLayout";
import { describe, expect, it } from "vitest";

import { SignalCable } from "./SignalCable";

/**
 * The cable is drawn, not computed, so what is worth pinning down is where it
 * ends up: the return run has to take the channel between the two rows instead
 * of cutting a diagonal, a top-mounted pedal has to be met over the board
 * rather than through its side, and a pair standing nose to nose has to give up
 * its plugs for a coupler. All three are easy to lose in a refactor and none of
 * them shows up in a type error.
 */

/**
 * The case these boards stand on: the two-row `Touring Case`, which is the deck
 * the cable was drawn against before a board had a size you could buy.
 */
const GEO = geometryFor(BOARD_TIERS[0]);
const ROW_Y_PCT = GEO.rowYPct;
const PEDAL_H_PCT = GEO.pedalHPct;

/** Board percent a test pedal takes — near enough a standard single. */
const W = 11;

/** The jacket stroke is the one path per run, so counting it counts runs. */
const JACKET = "#0b3b2e";

/** …and the one the read-only profile board swaps in for it. */
const PLAIN_JACKET = "#0c0c0e";

const TOP_JACKS: EffectJackLayout = {
  edge: "top",
  in: { x: 0.3, y: 0.04 },
  out: { x: 0.45, y: 0.04 },
};

const toViewY = (yPct: number) => (yPct / 100) * 70;

/** A row of pedals, `gap` board percent apart, laid the way the signal runs:
 *  the first is hard against the input jack on the right, and the chain walks
 *  leftwards from there. */
const row = (yPct: number, count: number, gap = 1.5): ChainNode[] =>
  Array.from({ length: count }, (_, i) => ({
    itemId: `${yPct}-${i}`,
    name: `pedal ${i}`,
    type: "overdrive" as ChainNode["type"],
    stage: i,
    xPct: 100 - 3 - W - i * (W + gap),
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

interface DrawOptions {
  /** Item ids whose pedal takes its cable off the top edge. */
  topJacked?: string[];
  plain?: boolean;
}

const draw = (nodes: ChainNode[], options: DrawOptions = {}) => {
  const { container } = render(
    <SignalCable
      geo={GEO}
      verdict={verdictOf(nodes)}
      widthOf={() => W}
      jacksOf={(itemId) =>
        options.topJacked?.includes(itemId) ? TOP_JACKS : SIDE_JACKS
      }
      plain={options.plain}
    />,
  );
  const strokeOf = options.plain ? PLAIN_JACKET : JACKET;
  const runs = Array.from(container.querySelectorAll("path"))
    .filter((path) => path.getAttribute("stroke") === strokeOf)
    .map((path) => path.getAttribute("d") ?? "");
  const parts = Array.from(container.querySelectorAll("g[transform]")).map(
    (group) => group.getAttribute("transform") ?? "",
  );
  return { container, runs, parts };
};

/** Every point a path passes through, in view units. */
const pointsOf = (d: string) =>
  (d.match(/-?\d+(?:\.\d+)?\s-?\d+(?:\.\d+)?/g) ?? []).map((pair) => {
    const [x, y] = pair.split(/\s+/).map(Number);
    return { x, y };
  });

/** Every plug on the board, with how far it stands out of its socket. */
const plugsOf = (container: Element) =>
  Array.from(container.querySelectorAll("g[transform]"))
    .map((group) => ({
      transform: group.getAttribute("transform") ?? "",
      // The boot is the one part drawn from the back of the handle outwards.
      boot: group.querySelector('path[d^="M -0.95"]')?.getAttribute("d") ?? "",
    }))
    // A coupler carries no strain-relief boot; a plug is the one that does.
    .filter((part) => part.boot)
    .map((part) => ({
      x: Number(part.transform.match(/translate\((-?[\d.]+) /)?.[1]),
      y: Number(part.transform.match(/translate\(-?[\d.]+ (-?[\d.]+)\)/)?.[1]),
      // The boot's first curve starts at its back face: how far it stands out.
      reach: -Number(part.boot.match(/Q (-?[\d.]+) /)?.[1]),
    }))
    .sort((a, b) => a.x - b.x);

describe("SignalCable", () => {
  it("draws into the board's own coordinate space", () => {
    // Every run below is measured in board units, and an svg whose viewBox
    // disagrees with them renders the whole loom at the wrong scale in the
    // corner of the deck — while every one of those assertions still passes,
    // because the paths themselves are right. So the box is pinned here.
    const { container } = draw(row(ROW_Y_PCT[0], 3));

    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      `0 0 ${GEO.viewW} ${GEO.viewH}`,
    );
  });

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

  it("takes a top-mounted pedal's cable over the board, not through its side", () => {
    // A gap wide enough that a side-mounted pair would simply sag across it.
    const nodes = row(ROW_Y_PCT[0], 2, 6);
    const { runs } = draw(nodes, { topJacked: [nodes[1].itemId] });

    const rowTop = toViewY(ROW_Y_PCT[0]);
    const link = pointsOf(runs[1]);

    // It has to climb clear of the enclosure it is heading into…
    expect(Math.min(...link.map((point) => point.y))).toBeLessThan(rowTop);
    // …and finish on the top edge rather than half way down a side.
    expect(link[link.length - 1].y).toBeLessThan(rowTop + PEDAL_H_PCT * 0.2);
  });

  it("couples a pair standing nose to nose instead of jamming two plugs in", () => {
    const roomy = row(ROW_Y_PCT[0], 2, 6);
    const tight = row(ROW_Y_PCT[0], 2, 0.4);

    // Two pedals, so four sockets: roomy gets a plug in each.
    expect(draw(roomy).parts).toHaveLength(4);
    // Tight gives the middle pair up for a single coupler: 2 plugs + 1 coupler.
    expect(draw(tight).parts).toHaveLength(3);
  });

  it("plugs both sides of every pedal, and nothing else", () => {
    const nodes = row(ROW_Y_PCT[0], 3, 6);
    const { parts } = draw(nodes);

    // The board's own sockets are drawn at life size by `BoardJack` and show
    // only the cable going in, so nothing is plugged into them here.
    expect(parts).toHaveLength(nodes.length * 2);
    // The input is on the right face, so its plug is the mirrored one; the
    // output on the left face takes the plug as it is drawn.
    expect(parts[0]).toContain("scale(-1 1)");
    expect(parts[1]).not.toContain("scale(-1 1)");
  });

  it("wires the board right to left, into the faces the artwork prints", () => {
    const nodes = row(ROW_Y_PCT[0], 3, 6);
    const { runs } = draw(nodes);

    // Every run travels leftwards — the feed out of the input jack, each link
    // between two pedals, and the last hop down to the amp.
    runs.forEach((d) => {
      const points = pointsOf(d);
      expect(points[points.length - 1].x).toBeLessThan(points[0].x);
    });

    // …and a link leaves the left face of one enclosure to arrive at the right
    // face of the next, which is the side each socket is silkscreened on.
    const link = pointsOf(runs[1]);
    const toView = (xPct: number) => (xPct / 100) * 160;
    expect(link[0].x).toBeCloseTo(toView(nodes[0].xPct), 1);
    expect(link[link.length - 1].x).toBeCloseTo(toView(nodes[1].xPct + W), 1);
  });

  it("drops the verdict colours on a read-only board", () => {
    const nodes = row(ROW_Y_PCT[0], 3, 6);
    const { container, runs } = draw(nodes, { plain: true });

    expect(runs).toHaveLength(4);
    expect(container.innerHTML).not.toContain(JACKET);
    // No travelling pulse either — there is nothing to reward a visitor for.
    expect(container.innerHTML).not.toContain("stroke-dasharray");
  });

  it("casts no cable shadow on a read-only board", () => {
    const nodes = row(ROW_Y_PCT[0], 3, 6);
    const cast = (options: DrawOptions) =>
      Array.from(
        draw(nodes, options).container.querySelectorAll("path"),
      ).filter(
        (path) => path.getAttribute("transform") === "translate(0 0.75)",
      );

    expect(cast({}).length).toBeGreaterThan(0);
    expect(cast({ plain: true })).toHaveLength(0);
  });

  it("still reaches both jacks with a single pedal on the board", () => {
    const { runs } = draw(row(ROW_Y_PCT[0], 1));

    expect(runs).toHaveLength(2);
    runs.forEach((d) => expect(d).not.toContain("NaN"));
  });

  it("draws nothing at all for an empty board", () => {
    const { container } = render(
      <SignalCable geo={GEO} verdict={verdictOf([])} widthOf={() => W} />,
    );

    expect(container.querySelector("svg")).toBeNull();
  });
  it("cuts a facing pair back to the gap they stand in, not through each other", () => {
    // Room for two plugs, but not for two whole ones.
    const tight = plugsOf(draw(row(ROW_Y_PCT[0], 2, 3.4)).container);
    const roomy = plugsOf(draw(row(ROW_Y_PCT[0], 2, 6)).container);

    // Sockets two and three are the pair facing each other across the gap.
    expect(tight[1].reach + tight[2].reach).toBeLessThanOrEqual(
      tight[2].x - tight[1].x,
    );
    // …and one with the whole gap to itself keeps its full length.
    expect(roomy[1].reach).toBeGreaterThan(tight[1].reach);
  });

  it("stands a top-mounted plug proud of the enclosure, and turns above it", () => {
    const nodes = row(ROW_Y_PCT[1], 2, 6);
    const { container, runs } = draw(nodes, { topJacked: [nodes[1].itemId] });
    const rowTop = toViewY(ROW_Y_PCT[1]);

    // Its two sockets are the only ones up near the pedal's top edge; a
    // side-mounted pair sits half way down it.
    const top = plugsOf(container).filter((plug) => plug.y < rowTop + 5);
    expect(top).toHaveLength(2);

    top.forEach((plug) => {
      // Seated any deeper and the enclosure swallows the plug whole.
      expect(plug.y - plug.reach).toBeLessThan(rowTop);
    });
    // …and the run bends clear of the boot rather than through it.
    const climb = Math.min(...pointsOf(runs[1]).map((point) => point.y));
    expect(climb).toBeLessThanOrEqual(top[0].y - top[0].reach);
  });

  it("leaves the boot straight before the cable starts to hang", () => {
    const link = pointsOf(draw(row(ROW_Y_PCT[0], 2, 10)).runs[1]);

    // The run holds the socket's own height until it is clear of the plug,
    // travelling leftwards towards the pedal it feeds.
    expect(link[1].y).toBe(link[0].y);
    expect(link[0].x - link[1].x).toBeGreaterThan(2.65);
  });
});
