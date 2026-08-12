import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StashTile } from "./StashTile";

afterEach(cleanup);

describe("StashTile", () => {
  it("opens the item when the socket holds something to act on", () => {
    const onClick = vi.fn();
    render(
      <StashTile
        color='#f43f5e'
        imageSrc='/guitar.webp'
        label='Fender Stratocaster'
        onClick={onClick}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Fender Stratocaster" }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("stays a plain socket when there is nothing to open", () => {
    render(<StashTile color='#9ca3af' label='Standard Screw ×12' count={12} />);

    expect(screen.queryByRole("button")).toBeNull();
    // The × keeps a stack of 12 from being read as level 12.
    expect(screen.getByText("×12")).toBeTruthy();
  });

  it("shows the level but hides a stack size the player does not have", () => {
    render(
      <StashTile
        color='#3b82f6'
        imageSrc='/pedal.png'
        label='Boss DS-1'
        level={17}
      />,
    );

    expect(screen.getByText("17")).toBeTruthy();
    expect(screen.queryByText(/×/)).toBeNull();
  });

  it("marks a rescued mod's bonus as a bonus, not a level", () => {
    render(
      <StashTile
        color='#c084fc'
        label='Hot Pickups +8'
        level={8}
        levelPrefix='+'
      />,
    );

    expect(screen.getByText("+8")).toBeTruthy();
  });
});
