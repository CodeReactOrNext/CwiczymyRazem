// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useAutoBackingStore } from "feature/autoBacking/store/autoBackingStore";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StartGate, useStartGate } from "./StartGate";

afterEach(cleanup);

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
    fireEvent.click(screen.getByText("start_gate.preview_first"));

    expect(onStart).toHaveBeenCalledOnce();
    expect(onPreview).toHaveBeenCalledOnce();
    expect(screen.getByText("start_gate.count_in_short")).toBeTruthy();
  });
});

describe("StartGate mic question", () => {
  const gate = (enabled: boolean) => {
    const onEnable = vi.fn();
    const onSkip = vi.fn();
    render(
      <StartGate
        onStart={() => {}}
        onPreview={() => {}}
        countsIn={false}
        mic={{ enabled, isListening: false, volumeRef: { current: 0 }, onEnable, onSkip }}
      />,
    );
    return { onEnable, onSkip };
  };

  it("marks the way the player plays now and takes the other answer", () => {
    const { onEnable, onSkip } = gate(false);
    const [withMic, without] = screen.getAllByRole("radio");
    expect(withMic.getAttribute("aria-checked")).toBe("false");
    expect(without.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(withMic);
    fireEvent.click(without);
    expect(onEnable).toHaveBeenCalledOnce();
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("asks nothing where the mic is no choice", () => {
    render(<StartGate onStart={() => {}} onPreview={() => {}} countsIn={false} />);
    expect(screen.queryByRole("radio")).toBeNull();
  });
});

describe("StartGate backing note", () => {
  const withBacking = () => {
    localStorage.clear();
    useAutoBackingStore.setState({ available: true, enabled: true, leakNoticeDismissed: false });
  };
  const gate = (micOn: boolean) =>
    render(<StartGate onStart={() => {}} onPreview={() => {}} countsIn={false} micOn={micOn} />);

  it("warns a microphone player that the mic can hear the backing", () => {
    withBacking();
    gate(true);
    expect(screen.getByText("auto_backing.leak_notice.title")).toBeTruthy();
  });

  it("says nothing to a player on an interface", () => {
    withBacking();
    localStorage.setItem("mic_setup_input_source", "interface");
    gate(true);
    expect(screen.queryByText("auto_backing.leak_notice.title")).toBeNull();
  });

  it("says nothing with the mic off or the backing off", () => {
    withBacking();
    const { unmount } = gate(false);
    expect(screen.queryByText("auto_backing.leak_notice.title")).toBeNull();
    unmount();
    useAutoBackingStore.setState({ enabled: false });
    gate(true);
    expect(screen.queryByText("auto_backing.leak_notice.title")).toBeNull();
  });

  it("stays away once read", () => {
    withBacking();
    gate(true);
    fireEvent.click(screen.getByText("auto_backing.leak_notice.ok"));
    expect(screen.queryByText("auto_backing.leak_notice.title")).toBeNull();
    expect(useAutoBackingStore.getState().leakNoticeDismissed).toBe(true);
  });

  it("can switch the backing off on the spot", () => {
    withBacking();
    gate(true);
    fireEvent.click(screen.getByText("auto_backing.leak_notice.off"));
    expect(useAutoBackingStore.getState().enabled).toBe(false);
  });
});
