// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HuntSuccessBurst } from "./HuntSuccessBurst";

afterEach(cleanup);

const rings = (container: HTMLElement) => container.querySelectorAll(".ring-emerald-400").length;

describe("HuntSuccessBurst", () => {
  it("rings on a found note", () => {
    const { container, rerender } = render(<HuntSuccessBurst foundCount={0} complete={false} />);
    expect(rings(container)).toBe(0);
    rerender(<HuntSuccessBurst foundCount={1} complete={false} />);
    expect(rings(container)).toBe(1);
  });

  it("does not ring for the next target once this one is solved", () => {
    const { container, rerender } = render(<HuntSuccessBurst foundCount={2} complete={false} />);
    rerender(<HuntSuccessBurst foundCount={3} complete />);
    rerender(<HuntSuccessBurst foundCount={0} complete={false} />);
    expect(rings(container)).toBe(0);
  });
});
