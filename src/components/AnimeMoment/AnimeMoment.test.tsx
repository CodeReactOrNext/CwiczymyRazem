// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnimeChip, AnimeMoment } from "./AnimeMoment";

describe("AnimeMoment", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("names itself after the title and shows the chips", () => {
    render(
      <AnimeMoment title='New record' onDone={() => undefined}>
        <AnimeChip>+120</AnimeChip>
      </AnimeMoment>,
    );
    expect(screen.getByRole("status", { name: "New record" })).toBeTruthy();
    expect(screen.getByText("+120")).toBeTruthy();
  });

  it("hands over on its own", () => {
    const onDone = vi.fn();
    render(<AnimeMoment title='Done' onDone={onDone} />);
    act(() => vi.advanceTimersByTime(3500));
    expect(onDone).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("is shorter when brief", () => {
    const onDone = vi.fn();
    render(<AnimeMoment title='Done' brief onDone={onDone} />);
    act(() => vi.advanceTimersByTime(2800));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("skips ahead on a click or Enter, once", () => {
    const onDone = vi.fn();
    render(<AnimeMoment title='Done' onDone={onDone} />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onDone).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(4000));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
