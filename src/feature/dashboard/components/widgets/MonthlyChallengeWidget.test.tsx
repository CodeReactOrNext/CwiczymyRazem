// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { DashboardDataContextValue } from "feature/dashboard/context/DashboardContext";
import { DashboardDataProvider } from "feature/dashboard/context/DashboardContext";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MonthlyChallengeWidget } from "./MonthlyChallengeWidget";

const submitDialog = vi.fn();
const practicePicker = vi.fn();

const challenge = {
  id: "2026-10",
  title: "October 2026 Challenge",
  status: "active",
  songs: [
    { songId: "s1", title: "Under the Bridge", artist: "RHCP", votes: 3 },
    { songId: "s2", title: "Burn", artist: "Deep Purple", votes: 2 },
  ],
  endsAt: undefined,
};

vi.mock("feature/challenges/hooks/useChallenges", () => ({
  useCurrentChallenge: () => ({ data: challenge, isLoading: false }),
  useChallengeSubmissions: () => ({
    data: [{ userId: "uid-1", songId: "s1" }],
  }),
}));

vi.mock("feature/challenges/components/SubmitRecordingDialog", () => ({
  SubmitRecordingDialog: (props: {
    song: { songId: string } | null;
    isFinalSong: boolean;
  }) => {
    submitDialog(props);
    return props.song ? <div>submit {props.song.songId}</div> : null;
  },
}));

vi.mock(
  "feature/songs/components/SongPracticePickerModal/SongPracticePickerLauncher",
  () => ({
    SongPracticePickerLauncher: (props: { songId: string | null }) => {
      practicePicker(props);
      return props.songId ? <div>practice {props.songId}</div> : null;
    },
  }),
);

vi.mock("store/hooks", () => ({
  useAppSelector: () => "Player One",
}));

const renderWidget = () =>
  render(
    <DashboardDataProvider
      value={{ userAuth: "uid-1" } as unknown as DashboardDataContextValue}>
      <MonthlyChallengeWidget />
    </DashboardDataProvider>,
  );

describe("MonthlyChallengeWidget", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("puts a check on recorded songs and a plus on the rest", () => {
    renderWidget();

    expect(screen.getByLabelText("Recorded")).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: "Submit a recording of Under the Bridge",
      }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Submit a recording of Burn" }),
    ).toBeTruthy();
  });

  it("opens the submit dialog for the song whose plus was clicked", () => {
    renderWidget();

    fireEvent.click(
      screen.getByRole("button", { name: "Submit a recording of Burn" }),
    );

    expect(screen.getByText("submit s2")).toBeTruthy();
    // One of two songs is in, so this recording finishes the board.
    expect(submitDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({ isFinalSong: true }),
    );
  });

  it("opens the practice picker from a song row, recorded or not", () => {
    renderWidget();

    fireEvent.click(
      screen.getByRole("button", { name: "Practice Under the Bridge by RHCP" }),
    );

    expect(screen.getByText("practice s1")).toBeTruthy();
  });
});
