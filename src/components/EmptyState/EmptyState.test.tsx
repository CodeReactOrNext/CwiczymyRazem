// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  afterEach(cleanup);

  it("renders the title, description and action", () => {
    render(
      <EmptyState
        title='Nothing here yet'
        description='Add your first song to get going.'
        action={<button type='button'>Add song</button>}
      />
    );

    expect(screen.getByText("Nothing here yet")).toBeTruthy();
    expect(screen.getByText("Add your first song to get going.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add song" })).toBeTruthy();
  });

  it("renders only the title when nothing else is given", () => {
    const { container } = render(<EmptyState title='Empty' />);

    expect(screen.getByText("Empty")).toBeTruthy();
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the icon in place of Kostek", () => {
    render(
      <EmptyState title='No results' icon={<svg data-testid='icon' />} />
    );

    expect(screen.getByTestId("icon")).toBeTruthy();
  });

  it("lets the caller drop the card in compact mode", () => {
    const { container } = render(
      <EmptyState title='Empty' size='compact' className='bg-transparent px-0' />
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain("py-8");
    expect(root.className).toContain("bg-transparent");
    expect(root.className).not.toContain("bg-zinc-800/40");
  });
});
