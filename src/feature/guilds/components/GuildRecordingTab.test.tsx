// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  getRecordingContract,
  getRecordingTier,
  RECORDING_CONTRACTS,
  sessionBpm,
} from "feature/guilds/data/guildRecording";
import type {
  RecordingShelf,
  RecordingView,
} from "feature/guilds/utils/guildRecording.utils";
import {
  drawClient,
  layTake,
  openSession,
  recordingPerks,
  sessionView,
  tierViews,
} from "feature/guilds/utils/guildRecording.utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GuildRecordingTabProps } from "./GuildRecordingTab";
import { GuildRecordingTab } from "./GuildRecordingTab";

const perks = recordingPerks({ roomLevel: 1, items: {} });
const NOW = new Date("2026-11-11T12:00:00Z");

/** A seed that draws The Rust Buckets, whose parts the tests name. */
const RUST = (() => {
  for (let seed = 1; seed < 5000; seed++)
    if (drawClient(seed).id === "rust-buckets") return seed;
  throw new Error("no seed draws the client");
})();
const rust = getRecordingContract("rust-buckets")!;
// Off the balance table, so a rebalance moves these with it.
const T1 = getRecordingTier(1);
const T6 = getRecordingTier(6);
const percent = (share: number) => `${Math.round(share * 100)}%`;

const idle = (shelf: RecordingShelf = {}, bank = 5_000): RecordingView => ({
  bank,
  perks,
  tiers: tierViews(shelf, perks),
  session: null,
  last: null,
  pay: 0,
});

const recording = (takesLeft: number): RecordingView => {
  const session = layTake(
    openSession(1, {}, perks, "ann", NOW, RUST),
    "ann",
    "riff",
    160,
    NOW,
    92,
  );
  const view = sessionView(session, perks, "ann", "ann", NOW, () => ({
    displayName: "Ann",
    avatar: null,
  }))!;
  return {
    ...idle(),
    session: { ...view, me: { ...view.me, takesLeft } },
  };
};

const show = (props: Partial<GuildRecordingTabProps> = {}) => {
  const handlers = {
    onBook: vi.fn(),
    onRecord: vi.fn(),
    onRehearse: vi.fn(),
    onDeliver: vi.fn(),
    onClaim: vi.fn(),
    onOpenStudio: vi.fn(),
  };
  render(
    <GuildRecordingTab
      view={idle()}
      lastTake={null}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

describe("GuildRecordingTab", () => {
  afterEach(cleanup);

  it("shows every tier on the strip and opens on the highest one the guild may book", () => {
    const { onBook } = show();
    const tiles = screen.getAllByRole("button", { pressed: false });
    // Five waiting in grey, the open one picked.
    expect(tiles.length).toBeGreaterThanOrEqual(5);
    const picked = screen.getByRole("button", { pressed: true });
    expect(picked.textContent).toContain("Garage label");
    expect(screen.getByRole("heading", { name: "Garage label" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /book a session/i }));
    expect(onBook).toHaveBeenCalledWith(1);
  });

  it("shows a locked tier's stage with what opens it, and no key to book it", () => {
    const { onBook } = show();
    fireEvent.click(
      screen.getByRole("button", { name: /Local label/, pressed: false }),
    );
    expect(screen.getByRole("heading", { name: "Local label" })).toBeTruthy();
    expect(
      screen.getByText(/Release a record on “Garage label” first/),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /book a session/i }),
    ).toBeNull();
    expect(onBook).not.toHaveBeenCalled();
  });

  it("opens on the next tier once a record is out on the one before", () => {
    const { onBook } = show({
      view: idle({ 1: { best: "gold", count: 2, at: 1 } }, 50_000),
    });
    expect(screen.getByRole("heading", { name: "Local label" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /book a session/i }));
    expect(onBook).toHaveBeenCalledWith(2);

    // Back on the tier it has recorded on: what the guild did there.
    fireEvent.click(
      screen.getByRole("button", { name: /Garage label/, pressed: false }),
    );
    expect(screen.getByText(/Gold record ×2/)).toBeTruthy();
  });

  it("holds the booking while the treasury is short", () => {
    show({ view: idle({}, 500) });
    const book = screen.getByRole("button", { name: /book a session/i });
    expect((book as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/1.?500 Fame short/)).toBeTruthy();
  });

  it("says a higher tier is harder and pays more", () => {
    show();
    expect(screen.getByText(percent(T1.tempo))).toBeTruthy();
    expect(screen.getByText("Eighths")).toBeTruthy();
    expect(screen.getByText(String(T1.fame))).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Hall of fame/, pressed: false }),
    );
    expect(screen.getByText(percent(T6.tempo))).toBeTruthy();
    expect(screen.getByText("Sixteenths")).toBeTruthy();
    expect(screen.getByText(String(T6.fame))).toBeTruthy();
    expect(T6.tempo).toBeGreaterThan(T1.tempo);
    expect(T6.fame).toBeGreaterThan(T1.fame);
  });

  it("shows who might walk in, without letting anybody be picked", () => {
    show();
    for (const contract of RECORDING_CONTRACTS)
      expect(screen.getByText(contract.client)).toBeTruthy();
    // The only way in is a tier.
    expect(screen.getAllByRole("button", { name: /book/i })).toHaveLength(1);
  });

  it("shows the open session's client, tier and parts, each with a rehearsal and a take", () => {
    const { onRecord, onRehearse } = show({ view: recording(1) });
    expect(screen.getByText(rust.track)).toBeTruthy();
    expect(
      screen.getByText(`Tier 1 · Garage label · ${sessionBpm(rust, 1)} BPM`, {
        exact: false,
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /rehearse/i })).toHaveLength(
      3,
    );
    expect(
      screen.getByText(`160 / ${T1.tape} on tape`, { exact: false }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getAllByRole("button", { name: /record a take/i })[1],
    );
    expect(onRecord).toHaveBeenCalledWith("bass");
    fireEvent.click(screen.getAllByRole("button", { name: /rehearse/i })[0]);
    expect(onRehearse).toHaveBeenCalledWith("riff");
  });

  it("says how many takes are still to go, in one big number and part by part", () => {
    show({ view: recording(1) });
    // 160 on one tape and two tapes untouched, at 160 a take.
    const started = Math.ceil((T1.tape - 160) / 160);
    const whole = Math.ceil(T1.tape / 160);
    expect(screen.getByText(String(started + 2 * whole))).toBeTruthy();
    expect(screen.getByText("takes to a release")).toBeTruthy();
    const toGo = (count: number) =>
      screen.getAllByText(`about ${count} takes to go`, { exact: false });
    expect(
      toGo(started).length + (started === whole ? 0 : toGo(whole).length),
    ).toBe(3);
    // The first part's own share of its tape, in big.
    expect(screen.getByText(percent(160 / T1.tape))).toBeTruthy();
    expect(
      screen.getByText(/released once every part's tape reaches 100%/),
    ).toBeTruthy();
  });

  it("shows how good the takes were and how the client takes them", () => {
    show({ view: recording(1) });
    expect(screen.getByRole("heading", { name: "Grinning" })).toBeTruthy();
    expect(screen.getByText("+10%")).toBeTruthy();
    expect(screen.getByText(/1 takes, 92% average/)).toBeTruthy();
    // The take on the list of the last ones, with who played it.
    expect(screen.getAllByText("92%").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("+160")).toBeTruthy();
  });

  it("leaves rehearsing open and takes shut once the day's takes are gone", () => {
    show({ view: recording(0) });
    for (const button of screen.getAllByRole("button", {
      name: /record a take/i,
    }))
      expect((button as HTMLButtonElement).disabled).toBe(true);
    for (const button of screen.getAllByRole("button", { name: /rehearse/i }))
      expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it("says what became of the take the player came back from", () => {
    show({
      view: recording(1),
      lastTake: {
        kept: true,
        points: 87,
        takesLeft: 1,
        partId: "riff",
        accuracy: 87.4,
        bpm: 74,
      },
    });
    expect(screen.getByRole("status").textContent).toMatch(
      /87% at 74 BPM, 87 on the tape/,
    );
  });

  it("offers the Fame a finished session owes", () => {
    const { onClaim } = show({ view: { ...idle(), pay: 240 } });
    fireEvent.click(screen.getByRole("button", { name: /collect/i }));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });
});
