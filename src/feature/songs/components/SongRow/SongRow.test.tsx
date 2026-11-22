// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SONG_ARTIST_CLASS,
  SONG_TITLE_CLASS,
  SONG_TITLE_SM_CLASS,
  SongRow,
  SongThumb,
} from "./SongRow";

afterEach(cleanup);

describe("SongThumb", () => {
  it("shows the cover when there is one", () => {
    render(<SongThumb coverUrl='https://example.com/c.jpg' alt='Cover' />);
    expect(screen.getByAltText("Cover")).toBeTruthy();
  });

  it("falls back to an icon on a zinc tile", () => {
    const { container } = render(<SongThumb size='sm' />);
    const thumb = container.firstElementChild as HTMLElement;
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toBeTruthy();
    expect(thumb.className).toContain("bg-zinc-800");
    expect(thumb.className).toContain("h-10");
    expect(thumb.className).toContain("rounded");
  });

  it("is a span, so it can sit inside a button", () => {
    const { container } = render(<SongThumb />);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });
});

describe("SongRow", () => {
  it("renders title, artist and the slots", () => {
    render(
      <SongRow
        title='Paranoid'
        artist='Black Sabbath'
        leading={<span>1</span>}
        trailing={<button type='button'>Play</button>}
        meta={<span>3 sessions</span>}
      />,
    );
    expect(screen.getByText("Paranoid").className).toBe(SONG_TITLE_CLASS);
    expect(screen.getByText("Black Sabbath").className).toBe(SONG_ARTIST_CLASS);
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    expect(screen.getByText("3 sessions")).toBeTruthy();
  });

  it("uses the dense text in a small row", () => {
    render(<SongRow title='Iron Man' artist='Black Sabbath' size='sm' />);
    expect(screen.getByText("Iron Man").className).toBe(SONG_TITLE_SM_CLASS);
  });

  it("calls onClick for the whole row", () => {
    const onClick = vi.fn();
    render(<SongRow title='War Pigs' onClick={onClick} data-testid='row' />);
    fireEvent.click(screen.getByTestId("row"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("becomes a link with href", () => {
    render(<SongRow title='Planet Caravan' href='/songs/1' />);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/songs/1");
  });

  it("takes a custom cover", () => {
    render(<SongRow title='Solitude' cover={<span data-testid='cover' />} />);
    expect(screen.getByTestId("cover")).toBeTruthy();
  });
});
