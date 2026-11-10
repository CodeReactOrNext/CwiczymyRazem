// @vitest-environment jsdom

import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StartGate, useStartGate } from "./StartGate";

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("useStartGate", () => {
  it("is open before the first start", () => {
    const { result } = renderHook(() => useStartGate(false));
    expect(result.current.open).toBe(true);
  });

  it("stays down for good once the clock has run", () => {
    const { result, rerender } = renderHook(({ playing }) => useStartGate(playing), {
      initialProps: { playing: false },
    });
    rerender({ playing: true });
    expect(result.current.open).toBe(false);
    rerender({ playing: false });
    expect(result.current.open).toBe(false);
  });

  it("goes down on preview without the clock", () => {
    const { result } = renderHook(() => useStartGate(false));
    act(() => result.current.dismiss());
    expect(result.current.open).toBe(false);
  });
});

describe("StartGate", () => {
  it("starts and previews from its two keys", () => {
    const onStart = vi.fn();
    const onPreview = vi.fn();
    render(<StartGate onStart={onStart} onPreview={onPreview} countsIn />);

    fireEvent.click(screen.getByText("start_gate.start"));
    fireEvent.click(screen.getByText("start_gate.preview"));

    expect(onStart).toHaveBeenCalledOnce();
    expect(onPreview).toHaveBeenCalledOnce();
    expect(screen.getByText("start_gate.hint_count_in")).toBeTruthy();
  });
});
