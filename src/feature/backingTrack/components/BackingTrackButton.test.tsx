// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BackingTrackButton } from "./BackingTrackButton";

afterEach(cleanup);

describe("BackingTrackButton", () => {
  it("asks for a recording while there is none", () => {
    render(<BackingTrackButton status='empty' onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Add backing track" })).toBeTruthy();
  });

  it("names the same action whether or not the recording is lined up yet", () => {
    const { rerender } = render(<BackingTrackButton status='unaligned' onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Sync backing track" }).title).toMatch(
      /Not lined up/,
    );

    rerender(<BackingTrackButton status='aligned' onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Sync backing track" }).title).toMatch(
      /\[ and \]/,
    );
  });

  it("opens the editor", () => {
    const onClick = vi.fn();
    render(<BackingTrackButton status='aligned' onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Sync backing track" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
