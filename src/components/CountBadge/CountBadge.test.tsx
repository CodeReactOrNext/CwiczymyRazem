// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CountBadge, formatCount } from "./CountBadge";

describe("formatCount", () => {
  it("caps numbers above max", () => {
    expect(formatCount(3, 9)).toBe("3");
    expect(formatCount(9, 9)).toBe("9");
    expect(formatCount(10, 9)).toBe("9+");
    expect(formatCount(150, Infinity)).toBe("150");
  });

  it("passes strings through", () => {
    expect(formatCount("!", 9)).toBe("!");
  });
});

describe("CountBadge", () => {
  afterEach(() => cleanup());

  it("renders the capped count, hidden from screen readers by default", () => {
    render(<CountBadge count={12} tone='alert' />);
    const badge = screen.getByText("9+");
    expect(badge.getAttribute("aria-hidden")).toBe("true");
    expect(badge.className).toContain("bg-red-500");
  });

  it("uses the cyan fill for info and can be announced", () => {
    render(<CountBadge count={4} tone='info' aria-hidden={false} />);
    const badge = screen.getByText("4");
    expect(badge.hasAttribute("aria-hidden")).toBe(false);
    expect(badge.className).toContain("bg-cyan-500");
  });

  it("lets className override the corner position", () => {
    render(<CountBadge count={2} tone='alert' className='static' />);
    const badge = screen.getByText("2");
    expect(badge.className).toContain("static");
    expect(badge.className).not.toContain("absolute");
  });
});
