import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GlobalSearch } from "./GlobalSearch";

// The result title is split across sibling text nodes by highlightMatch()
// (the matched substring is wrapped in its own <span>), so exact-string
// queries need to check the row's full textContent instead of a single node.
const findByTitle = (title: string) =>
  screen.findByText(
    (_content, element) => element?.textContent === title && element.tagName === "P",
  );

const push = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("store/hooks", () => ({
  useAppSelector: () => null,
  useAppDispatch: () => vi.fn(),
}));

const renderGlobalSearch = () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<GlobalSearch />, { wrapper });
};

describe("GlobalSearch", () => {
  afterEach(() => {
    cleanup();
    push.mockClear();
  });

  it("opens on click and searches the static exercise library", async () => {
    renderGlobalSearch();

    fireEvent.click(screen.getByLabelText("Search"));
    const input = await screen.findByPlaceholderText(
      "Search plans, exercises, songs...",
    );

    fireEvent.change(input, { target: { value: "shifting up the neck" } });

    expect(await screen.findByText("Exercises")).toBeTruthy();
    expect(await findByTitle("Spider — Shifting Up the Neck")).toBeTruthy();
  });

  it("shows nothing for a query shorter than 2 characters", async () => {
    renderGlobalSearch();

    fireEvent.click(screen.getByLabelText("Search"));
    const input = await screen.findByPlaceholderText(
      "Search plans, exercises, songs...",
    );

    fireEvent.change(input, { target: { value: "s" } });

    expect(screen.queryByText("Exercises")).toBeNull();
  });

  it("navigates to the highlighted result and closes on Enter", async () => {
    renderGlobalSearch();

    fireEvent.click(screen.getByLabelText("Search"));
    const input = await screen.findByPlaceholderText(
      "Search plans, exercises, songs...",
    );

    fireEvent.change(input, { target: { value: "shifting up the neck" } });
    await findByTitle("Spider — Shifting Up the Neck");

    fireEvent.keyDown(input, { key: "Enter" });

    expect(push).toHaveBeenCalledWith("/practice/exercise/spider-basic");
    expect(screen.queryByPlaceholderText("Search plans, exercises, songs...")).toBeNull();
  });
});
