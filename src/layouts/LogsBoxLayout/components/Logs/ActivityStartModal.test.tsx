// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useCommunityDrawer } from "feature/logsBox/hooks/useCommunityDrawer";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActivityStartModal } from "./ActivityStartModal";

const push = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push }),
}));

const exercise = (id: string, title: string): Exercise =>
  ({
    id,
    title,
    description: `About ${title}`,
    difficulty: "medium",
    category: "technique",
    timeInMinutes: 5,
  }) as Exercise;

const startButton = () => screen.queryByRole("button", { name: /start/i });

describe("ActivityStartModal", () => {
  afterEach(() => {
    cleanup();
    push.mockClear();
    useCommunityDrawer.setState({ isOpen: false });
  });

  it("lists a routine's exercises without offering to start the whole routine", () => {
    render(
      <ActivityStartModal
        preview={{
          kind: "routine",
          title: "Shred Hour",
          exercises: [
            exercise("spider", "Spider Walk"),
            exercise("legato", "Legato Runs"),
          ],
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Shred Hour")).toBeTruthy();
    expect(screen.getByText("Spider Walk")).toBeTruthy();
    expect(screen.getByText("Legato Runs")).toBeTruthy();
    expect(startButton()).toBeNull();
  });

  it("opens an exercise picked from a routine, starts it and closes the drawer", () => {
    useCommunityDrawer.setState({ isOpen: true });
    const onClose = vi.fn();
    render(
      <ActivityStartModal
        preview={{
          kind: "routine",
          title: "Shred Hour",
          exercises: [
            exercise("spider", "Spider Walk"),
            exercise("legato", "Legato Runs"),
          ],
        }}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("Legato Runs"));
    expect(screen.getByText("About Legato Runs")).toBeTruthy();

    fireEvent.click(startButton()!);
    expect(push).toHaveBeenCalledWith("/practice/exercise/legato");
    expect(useCommunityDrawer.getState().isOpen).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });

  it("goes back from a picked exercise to the routine", () => {
    render(
      <ActivityStartModal
        preview={{
          kind: "routine",
          title: "Shred Hour",
          exercises: [exercise("spider", "Spider Walk")],
        }}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Spider Walk"));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));

    expect(screen.getByText("Shred Hour")).toBeTruthy();
    expect(startButton()).toBeNull();
  });

  it("hands a lesson to the caller's practice window instead of navigating", () => {
    const onStartLesson = vi.fn();
    render(
      <ActivityStartModal
        preview={{
          kind: "lesson",
          title: "Sweep Picking 101",
          videoId: "dQw4w9WgXcQ",
        }}
        onClose={vi.fn()}
        onStartLesson={onStartLesson}
      />,
    );

    fireEvent.click(startButton()!);

    expect(onStartLesson).toHaveBeenCalledWith({
      title: "Sweep Picking 101",
      videoId: "dQw4w9WgXcQ",
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("only lets a lesson be watched when nobody can open its practice window", () => {
    render(
      <ActivityStartModal
        preview={{
          kind: "lesson",
          title: "Sweep Picking 101",
          videoId: "dQw4w9WgXcQ",
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTitle("Sweep Picking 101")).toBeTruthy();
    expect(startButton()).toBeNull();
  });
});
