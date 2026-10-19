// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildController } from "../testing/buildController";
import { BackingTrackBar } from "./BackingTrackBar";

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

// Counts how often the player is actually mounted. Moving it in the React tree
// (rather than restyling it in place) would destroy the YouTube player and make
// it re-buffer — the whole reason cinema and the editor's box are CSS switches.
const youtubeMounts = vi.hoisted(() => ({ count: 0 }));
vi.mock("react-youtube", async () => {
  const { useEffect } = await import("react");
  return {
    default: function YouTubeStub() {
      useEffect(() => {
        youtubeMounts.count += 1;
      }, []);
      return <div data-testid='youtube-player' />;
    },
  };
});

// jsdom ships no ResizeObserver, which Radix's Slider measures its thumb with.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

// This project wires no vitest setup file, so RTL's auto-cleanup never runs.
afterEach(cleanup);
// The editor's first-run intro is its own test's business.
beforeEach(() => localStorage.setItem("rq_backing_intro_seen", "1"));

const withVideo = (overrides = {}) => buildController({ youtubeVideoId: "abc123", ...overrides });

describe("BackingTrackBar nudge keys", () => {
  it("nudges the recording from the keyboard, so the player never leaves the guitar", () => {
    const setAlignment = vi.fn();
    render(<BackingTrackBar controller={buildController({ setAlignment })} />);

    fireEvent.keyDown(window, { key: "]" });
    fireEvent.keyDown(window, { key: "[", shiftKey: true });

    expect(setAlignment).toHaveBeenNthCalledWith(1, { offsetMs: 20 });
    expect(setAlignment).toHaveBeenNthCalledWith(2, { offsetMs: -100 });
  });

  it("leaves the brackets alone while typing in a field", () => {
    const setAlignment = vi.fn();
    render(
      <>
        <input aria-label='somewhere to type' />
        <BackingTrackBar controller={buildController({ setAlignment })} />
      </>,
    );

    fireEvent.keyDown(screen.getByLabelText("somewhere to type"), { key: "]" });

    expect(setAlignment).not.toHaveBeenCalled();
  });

  it("has nothing to nudge without a recording", () => {
    const setAlignment = vi.fn();
    render(<BackingTrackBar controller={buildController({ setAlignment, stems: [] })} />);

    fireEvent.keyDown(window, { key: "]" });

    expect(setAlignment).not.toHaveBeenCalled();
  });
});

describe("BackingTrackBar above the tab", () => {
  it("takes no room when there is no picture to show", () => {
    const { container } = render(<BackingTrackBar controller={buildController()} />);

    expect(container.firstChild).toBeNull();
  });

  it("shows the video, muted picture only, when the song has one", () => {
    render(<BackingTrackBar controller={withVideo()} />);

    expect(screen.getByTestId("youtube-player")).toBeTruthy();
  });

  it("hides the video when it was switched off for the song", () => {
    render(<BackingTrackBar controller={withVideo({ videoOverlay: false })} />);

    expect(screen.queryByTestId("youtube-player")).toBeNull();
  });
});

describe("BackingTrackBar cinema mode", () => {
  it("turns cinema on from the button on the picture", () => {
    const setCinema = vi.fn();
    render(<BackingTrackBar controller={withVideo({ setCinema })} />);

    fireEvent.click(screen.getByText("Cinema"));

    expect(setCinema).toHaveBeenCalledWith(true);
  });

  it("offers the way back out once the video has taken the screen", () => {
    const setCinema = vi.fn();
    render(<BackingTrackBar controller={withVideo({ setCinema, isCinema: true })} />);

    fireEvent.click(screen.getByText(/Leave cinema/));

    expect(setCinema).toHaveBeenCalledWith(false);
  });

  it("leaves cinema on Escape, the way every full-screen surface does", () => {
    const setCinema = vi.fn();
    render(<BackingTrackBar controller={withVideo({ setCinema, isCinema: true })} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(setCinema).toHaveBeenCalledWith(false);
  });

  it("does not listen for Escape when it isn't in cinema", () => {
    const setCinema = vi.fn();
    render(<BackingTrackBar controller={withVideo({ setCinema })} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(setCinema).not.toHaveBeenCalled();
  });

  it("keeps the very same player across the switch, so it never re-buffers", () => {
    youtubeMounts.count = 0;

    const { rerender } = render(<BackingTrackBar controller={withVideo({ isCinema: false })} />);
    rerender(<BackingTrackBar controller={withVideo({ isCinema: true })} />);
    rerender(<BackingTrackBar controller={withVideo({ isCinema: false })} />);

    expect(youtubeMounts.count).toBe(1);
  });
});

describe("BackingTrackBar editor", () => {
  it("stays out of the way until the session opens it", () => {
    render(<BackingTrackBar controller={buildController()} />);

    expect(screen.queryByRole("dialog", { name: "Backing track" })).toBeNull();
  });

  it("opens the editor, and asks the session to close it on Done", () => {
    const onAligningChange = vi.fn();
    render(
      <BackingTrackBar
        controller={buildController()}
        isAligning
        onAligningChange={onAligningChange}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Backing track" })).toBeTruthy();
    fireEvent.click(screen.getByText("Done"));

    expect(onAligningChange).toHaveBeenCalledWith(false);
  });

  it("keeps the same player while the editor opens and shuts", () => {
    youtubeMounts.count = 0;

    const { rerender } = render(<BackingTrackBar controller={withVideo()} />);
    rerender(<BackingTrackBar controller={withVideo()} isAligning />);
    rerender(<BackingTrackBar controller={withVideo()} />);

    expect(youtubeMounts.count).toBe(1);
  });

  it("leaves Escape to the editor while it is open, even in cinema", () => {
    const setCinema = vi.fn();
    const onAligningChange = vi.fn();
    render(
      <BackingTrackBar
        controller={withVideo({ setCinema, isCinema: true })}
        isAligning
        onAligningChange={onAligningChange}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onAligningChange).toHaveBeenCalledWith(false);
    expect(setCinema).not.toHaveBeenCalled();
  });
});
