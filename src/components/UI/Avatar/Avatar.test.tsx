// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import Avatar from "./Avatar";

const circle = (container: HTMLElement) =>
  container.firstElementChild?.firstElementChild as HTMLElement;

afterEach(cleanup);

describe("Avatar", () => {
  it("is a circle at every size", () => {
    for (const size of ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const) {
      const { container, unmount } = render(<Avatar name='Ann' size={size} />);
      expect(circle(container).className).toContain("rounded-full");
      unmount();
    }
    const { container } = render(<Avatar name='Ann' />);
    expect(circle(container).className).toContain("rounded-full");
    expect(circle(container).className).toContain("h-20");
  });

  it("shows the initial on a zinc fill when there is no photo", () => {
    const { container } = render(<Avatar name='bob' size='sm' />);
    expect(screen.getByText("B")).toBeTruthy();
    expect(circle(container).className).toContain("bg-zinc-700");
  });

  it("drops the fill behind a photo and keeps the name as alt", () => {
    const { container } = render(
      <Avatar name='Cat' avatarURL='https://example.com/a.png' size='xs' />,
    );
    expect(screen.getByAltText("Cat")).toBeTruthy();
    expect(circle(container).className).not.toContain("bg-zinc-700");
  });

  it("merges className onto the wrapper", () => {
    const { container } = render(
      <Avatar name='Dee' size='2xs' className='shrink-0' />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("shrink-0");
    expect(circle(container).className).toContain("h-5");
  });
});
