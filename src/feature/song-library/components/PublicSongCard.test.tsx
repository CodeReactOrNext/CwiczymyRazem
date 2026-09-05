// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { LibrarySong } from "feature/song-library/services/getSongsForStaticProps";
import { afterEach, describe, expect, it } from "vitest";

import { PublicSongCard } from "./PublicSongCard";

// No global setup file wires this up, so each case tears down its own DOM.
afterEach(cleanup);

const song: LibrarySong = {
  id: "KwZ17fUDZNnEw32VM6mS",
  title: "Master of Puppets",
  artist: "Metallica",
  avgDifficulty: 8.5,
  ratingsCount: 14,
  tier: "S",
  genres: ["metal"],
  popularity: 42,
  coverUrl: null,
  isVerified: true,
};

const hrefOf = (name: string) =>
  screen.getByRole("link", { name: new RegExp(name, "i") }).getAttribute("href");

describe("PublicSongCard", () => {
  it("carries the song through sign-up so the choice is not lost", () => {
    render(<PublicSongCard song={song} />);

    expect(hrefOf("start learning")).toBe(
      "/signup?next=%2Fsongs%2Fpractice%2FKwZ17fUDZNnEw32VM6mS"
    );
  });

  it("leads with the difficulty guide when one exists", () => {
    render(<PublicSongCard song={song} guideSlug='master-of-puppets' />);

    expect(hrefOf("difficulty guide")).toBe("/song-library/master-of-puppets");
  });

  it("shows only the sign-up route for a song with no guide", () => {
    render(<PublicSongCard song={song} />);

    expect(screen.queryByText(/difficulty guide/i)).toBeNull();
  });
});
