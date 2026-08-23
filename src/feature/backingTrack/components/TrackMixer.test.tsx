// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MixerTrack } from "./TrackMixer";
import { TrackMixer } from "./TrackMixer";

// jsdom ships no ResizeObserver, which Radix's Slider measures its thumb with.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(cleanup);

const track = (over: Partial<MixerTrack> = {}): MixerTrack => ({
  id: "gp-1",
  name: "Rhythm Guitar",
  trackType: "guitar",
  volume: 0.8,
  isMuted: false,
  ...over,
});

describe("TrackMixer", () => {
  it("renders nothing when there is nothing to mix", () => {
    const { container } = render(<TrackMixer tracks={[]} onChange={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows one strip per instrument, with its level", () => {
    render(
      <TrackMixer
        tracks={[track(), track({ id: "gp-2", name: "Drums", trackType: "drums", volume: 0.5 })]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Rhythm Guitar")).toBeTruthy();
    expect(screen.getByText("Drums")).toBeTruthy();
    expect(screen.getByText("80%")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
  });

  it("names the exercise's own track rather than showing its id", () => {
    render(
      <TrackMixer tracks={[track({ id: "main", name: "Główny Instrument" })]} onChange={vi.fn()} />,
    );

    expect(screen.getByText("Main instrument")).toBeTruthy();
  });

  it("still labels a track the file left unnamed", () => {
    render(<TrackMixer tracks={[track({ name: undefined })]} onChange={vi.fn()} />);

    expect(screen.getByText("Instrument")).toBeTruthy();
  });

  it("mutes and unmutes the track it belongs to", () => {
    const onChange = vi.fn();
    const { rerender } = render(<TrackMixer tracks={[track()]} onChange={onChange} />);

    fireEvent.click(screen.getByTitle("Mute Rhythm Guitar"));
    expect(onChange).toHaveBeenCalledWith("gp-1", { isMuted: true });

    rerender(<TrackMixer tracks={[track({ isMuted: true })]} onChange={onChange} />);
    fireEvent.click(screen.getByTitle("Unmute Rhythm Guitar"));
    expect(onChange).toHaveBeenLastCalledWith("gp-1", { isMuted: false });
  });

  it("reads a muted track as silent rather than showing a level it is not playing at", () => {
    render(<TrackMixer tracks={[track({ isMuted: true })]} onChange={vi.fn()} />);

    expect(screen.getByText("muted")).toBeTruthy();
    expect(screen.queryByText("80%")).toBeNull();
    expect(screen.getByRole("slider").getAttribute("aria-valuenow")).toBe("0");
  });

  it("changes only the track that was touched", () => {
    const onChange = vi.fn();
    render(
      <TrackMixer tracks={[track(), track({ id: "gp-2", name: "Drums" })]} onChange={onChange} />,
    );

    fireEvent.click(screen.getByTitle("Mute Drums"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("gp-2", { isMuted: true });
  });
});
