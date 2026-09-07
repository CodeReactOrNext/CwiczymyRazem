// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SongTierBadge } from "./SongTierBadge";

const learnedSongs = (count: number, avgDifficulty: number) =>
  Array.from({ length: count }, () => ({ avgDifficulty }));

describe("SongTierBadge", () => {
  afterEach(cleanup);

  it("says how many songs are still missing instead of only a '?'", () => {
    // Players read the bare "?" as a broken profile, so the badge spells out
    // that the tier is gated behind five learned songs.
    render(<SongTierBadge learnedSongs={learnedSongs(2, 8)} />);

    expect(screen.getByText("?")).toBeTruthy();
    expect(screen.getByText("3 more songs")).toBeTruthy();
  });

  it("shows the tier once enough learned songs are rated", () => {
    render(<SongTierBadge learnedSongs={learnedSongs(6, 8)} />);

    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("A-Tier")).toBeTruthy();
  });

  it("renders a skeleton while the songs load, not a '?' that reads as an answer", () => {
    const { container } = render(
      <SongTierBadge learnedSongs={undefined} isLoading />,
    );

    expect(screen.queryByText("?")).toBeNull();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("says a failed fetch is unavailable, not a player short of songs", () => {
    render(<SongTierBadge learnedSongs={undefined} isError />);

    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.queryByText("5 more songs")).toBeNull();
  });

  it("distinguishes a repertoire nobody has rated from a missing one", () => {
    render(<SongTierBadge learnedSongs={learnedSongs(6, 0)} />);

    expect(screen.getByText("No rated songs")).toBeTruthy();
  });
});
