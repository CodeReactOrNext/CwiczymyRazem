// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PAGE_CONTENT, PAGE_GUTTER, PageShell } from "./PageShell";

describe("PageShell", () => {
  afterEach(cleanup);

  it("renders its children in the page frame", () => {
    render(<PageShell>Content</PageShell>);

    const frame = screen.getByText("Content");
    expect(frame.tagName).toBe("DIV");
    expect(frame.className).toContain("bg-zinc-900/60");
    expect(frame.className).toContain("rounded-lg");
    expect(frame.className).not.toMatch(/shadow|border/);
  });

  it("merges a caller's classes and can render as another element", () => {
    render(
      <PageShell as='main' className='overflow-hidden md:overflow-visible'>
        Content
      </PageShell>
    );

    const frame = screen.getByText("Content");
    expect(frame.tagName).toBe("MAIN");
    expect(frame.className).toContain("overflow-hidden");
    expect(frame.className).toContain("md:overflow-visible");
    expect(frame.className).not.toMatch(/(^| )overflow-visible/);
  });

  it("paints only the outer frame when frames nest", () => {
    render(
      <PageShell>
        <PageShell>Inner</PageShell>
      </PageShell>
    );

    const inner = screen.getByText("Inner");
    expect(inner.className).not.toContain("bg-zinc-900/60");
    expect(inner.className).not.toContain("min-h-");
    expect(inner.parentElement?.className).toContain("bg-zinc-900/60");
  });

  it("builds the content block from the shared gutter", () => {
    expect(PAGE_CONTENT).toContain(PAGE_GUTTER);
    expect(PAGE_CONTENT).toContain("pt-6");
  });
});
