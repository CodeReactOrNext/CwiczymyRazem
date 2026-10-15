// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  loadLessonProgress,
  saveLessonProgress,
} from "feature/aiCoach/utils/lessonProgress";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LessonPracticeModal from "./LessonPracticeModal";

const NOW = 1_800_000_000_000;
const VIDEO = "lesson-video";
const lesson = {
  videoId: VIDEO,
  title: "Understanding the Chord/Scale Relationship",
  channelName: "",
  thumbnailUrl: "",
};

const player = vi.hoisted(() => ({
  seconds: 0,
  opts: null as null | { playerVars?: { start?: number } },
}));

vi.mock("react-youtube", async () => {
  const { useEffect } = await import("react");
  return {
    default: function YouTubeStub(props: {
      opts: { playerVars?: { start?: number } };
      onReady: (event: { target: unknown }) => void;
    }) {
      player.opts = props.opts;
      useEffect(() => {
        props.onReady({ target: { getCurrentTime: () => player.seconds } });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return <div data-testid='youtube-player' />;
    },
  };
});

const dispatch = vi.hoisted(() =>
  vi.fn(() => ({ unwrap: () => Promise.resolve() })),
);

vi.mock("store/hooks", () => ({
  useAppDispatch: () => dispatch,
  useAppSelector: () => null,
}));
vi.mock("components/ActivityLog/hooks/useActivityLog", () => ({
  useActivityLog: () => ({ reportList: [] }),
}));
vi.mock("feature/user/store/userSlice", () => ({
  selectUserAuth: () => null,
  selectUserAvatar: () => null,
  setActivity: (payload: unknown) => ({ type: "setActivity", payload }),
}));
vi.mock("feature/user/store/userSlice.asyncThunk", () => ({
  updateUserStats: (payload: unknown) => ({ type: "updateUserStats", payload }),
}));
vi.mock("feature/user/store/userSlice.questActions", () => ({
  updateQuestProgress: (payload: unknown) => ({
    type: "updateQuestProgress",
    payload,
  }),
}));
vi.mock("utils/gameLogic", () => ({ getClientReportContext: () => ({}) }));

const renderModal = () => {
  const onClose = vi.fn();
  const onFinish = vi.fn();
  const view = render(
    <LessonPracticeModal
      lesson={lesson}
      onClose={onClose}
      onFinish={onFinish}
    />,
  );
  return { ...view, onClose, onFinish };
};

/** Radix arms its outside-click listener on the next tick after opening. */
const flushRadix = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

const pressEscape = () =>
  fireEvent.keyDown(document.activeElement ?? document.body, {
    key: "Escape",
  });

const advanceClock = (ms: number) => vi.setSystemTime(Date.now() + ms);

describe("LessonPracticeModal", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    player.seconds = 0;
    player.opts = null;
    dispatch.mockClear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.useRealTimers();
  });

  it("ignores a click outside the window", async () => {
    const { onClose } = renderModal();
    await flushRadix();

    fireEvent.pointerDown(document.body);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText("Leave this lesson?")).toBeNull();
  });

  it("closes right away when nothing has been practiced yet", async () => {
    const { onClose } = renderModal();
    await flushRadix();

    pressEscape();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks before leaving once there is time on the clock", async () => {
    const { onClose } = renderModal();
    await flushRadix();
    advanceClock(15_000);

    pressEscape();
    expect(screen.getByText("Leave this lesson?")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Keep practicing"));
    expect(screen.queryByText("Leave this lesson?")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Close"));
    fireEvent.click(screen.getByText("Leave"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("saves the stopwatch and the video spot when the window goes", async () => {
    const { unmount } = renderModal();
    await flushRadix();
    advanceClock(50 * 60_000);
    player.seconds = 3012.4;

    unmount();

    expect(loadLessonProgress(VIDEO)).toEqual({
      elapsedMs: 50 * 60_000,
      videoSeconds: 3012,
    });
  });

  it("carries on from the saved progress", async () => {
    saveLessonProgress(VIDEO, { elapsedMs: 50 * 60_000, videoSeconds: 3000 });

    const { onClose } = renderModal();
    await flushRadix();

    expect(screen.getByText("50:00")).toBeTruthy();
    expect(player.opts?.playerVars?.start).toBe(3000);

    // Already past the threshold, so even an instant Escape asks first.
    pressEscape();
    expect(screen.getByText("Leave this lesson?")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("forgets the progress once the time is logged", async () => {
    saveLessonProgress(VIDEO, { elapsedMs: 20 * 60_000, videoSeconds: 1200 });
    const { onFinish, unmount } = renderModal();
    await flushRadix();

    await act(async () => {
      fireEvent.click(screen.getByText("Finish & log time"));
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    unmount();
    expect(loadLessonProgress(VIDEO)).toBeNull();
  });
});
