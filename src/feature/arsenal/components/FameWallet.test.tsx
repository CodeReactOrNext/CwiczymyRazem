// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FameWallet } from "./FameWallet";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settleIn = () =>
  act(() => {
    vi.advanceTimersByTime(2000);
  });

describe("FameWallet", () => {
  it("does not read the balance loading in as a windfall", () => {
    const { rerender } = render(<FameWallet fame={undefined} />);
    rerender(<FameWallet fame={5000} />);

    expect(screen.queryByText("+5,000")).toBeNull();
  });

  it("does not read the fresh balance replacing the boot snapshot as one", () => {
    const { rerender } = render(<FameWallet fame={1000} />);
    rerender(<FameWallet fame={1340} />);

    expect(screen.queryByText("+340")).toBeNull();
  });

  it("floats off what a sale brought in and what a purchase took", () => {
    const { rerender } = render(<FameWallet fame={1000} />);
    settleIn();

    rerender(<FameWallet fame={1250} />);
    expect(screen.getByText("+250")).toBeTruthy();

    rerender(<FameWallet fame={1100} />);
    expect(screen.getByText("−150")).toBeTruthy();
  });
});
