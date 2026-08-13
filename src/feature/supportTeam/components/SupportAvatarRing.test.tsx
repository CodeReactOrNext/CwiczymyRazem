import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SupportAvatarRing } from "./SupportAvatarRing";

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

  it("blurs the halo from a flat colour, so it stays an even circle", () => {
    const { layers } = renderRing();
    const halo = layers[0];

    // The conic sweep is near-dark where it starts and near-white on the
    // opposite side; blurred, that read as a squashed oval under the avatar.
    expect(halo.style.background).not.toContain("conic-gradient");
    expect(halo.className).not.toContain("animate-spin-slow");
    expect(halo.className).toContain("rounded-full");
  });

  it("only spins the rim, and reaches less far out than the halo", () => {
    const { layers } = renderRing();
    const [halo, rim] = layers;

    expect(rim.style.background).toContain("conic-gradient");
    expect(rim.className).toContain("animate-spin-slow");
    expect(parseInt(halo.style.inset)).toBeLessThan(parseInt(rim.style.inset));
  });

  it("stays square in a cramped flex row, so the rings cannot go elliptical", () => {
    const { wrapper } = renderRing();

    expect(wrapper.className).toContain("aspect-square");
    expect(wrapper.className).toContain("shrink-0");
  });
});
