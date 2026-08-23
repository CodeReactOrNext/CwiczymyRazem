// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BuildLog } from "./BuildLog";

const entries = Array.from({ length: 8 }, (_, i) => ({
  label: `Bench work · build ${i + 1}`,
  at: Date.UTC(2026, 0, i + 1),
}));

afterEach(cleanup);

describe("BuildLog", () => {
  it("stays folded away until asked for", () => {
    render(<BuildLog entries={entries} />);
    expect(screen.queryByText(entries[7].label)).toBe(null);
  });

  it("shows the last five jobs, newest first", () => {
    render(<BuildLog entries={entries} />);
    fireEvent.click(screen.getByRole("button"));

    const shown = screen.getAllByText(/build \d/);
    expect(shown).toHaveLength(5);
    expect(shown[0].textContent).toBe("Bench work · build 8");
    expect(shown[4].textContent).toBe("Bench work · build 4");
  });

  it("renders nothing for an item that has never been on the bench", () => {
    const { container } = render(<BuildLog entries={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
