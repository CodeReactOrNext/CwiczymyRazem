// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { getRimMask, SupportAvatarRing } from "./SupportAvatarRing";

afterEach(cleanup);

const renderRing = () => {
  const { container } = render(
    <SupportAvatarRing>
      <div data-testid='avatar' />
    </SupportAvatarRing>,
  );
  const wrapper = container.firstElementChild as HTMLElement;
  return { wrapper, layers: [...wrapper.children] as HTMLElement[] };
};

describe("SupportAvatarRing", () => {
  it("keeps the avatar it wraps", () => {
    renderRing();
    expect(screen.getByTestId("avatar")).toBeTruthy();
  });

  it("renders no blurred glow behind the avatar", () => {
    const { layers } = renderRing();

    expect(layers.some((layer) => layer.className.includes("blur"))).toBe(false);
  });

  it("spins the gold rim", () => {
    const { layers } = renderRing();
    const rim = layers[0];

    expect(rim.style.background).toContain("conic-gradient");
    expect(rim.className).toContain("animate-spin-slow");
    expect(rim.className).toContain("rounded-full");
  });

  it("masks the rim down to a ring, so a mis-layered rim cannot cover the avatar", () => {
    // jsdom drops mask-image from inline styles, so read the server markup.
    const markup = renderToStaticMarkup(
      <SupportAvatarRing>
        <div />
      </SupportAvatarRing>,
    );

    expect(markup).toContain(`mask-image:${getRimMask(2)}`);
    expect(getRimMask(2)).toBe(
      "radial-gradient(circle closest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
    );
  });

  it("stays square in a cramped flex row, so the rings cannot go elliptical", () => {
    const { wrapper } = renderRing();

    expect(wrapper.className).toContain("aspect-square");
    expect(wrapper.className).toContain("shrink-0");
  });
});
