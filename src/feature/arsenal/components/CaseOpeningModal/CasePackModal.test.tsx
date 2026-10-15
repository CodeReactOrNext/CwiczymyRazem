// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CASE_DEFINITIONS } from "../../data/caseDefinitions";
import { EFFECT_DEFINITIONS } from "../../data/effectDefinitions";
import { DROPPABLE_GUITARS } from "../../data/guitarDefinitions";
import { mergeDuplicates } from "../../services/arsenal.service";
import type {
  OpenCasePackResult,
  OpenCaseResult,
} from "../../types/arsenal.types";
import { CasePackModal } from "./CasePackModal";

vi.mock("../../services/arsenal.service", () => ({
  mergeDuplicates: vi.fn(),
}));

// Most of what this file checks is the finished screen, so the reveal is switched
// off for it; the tests that are about the reveal turn it back on.
let reduceMotion = true;

vi.mock("framer-motion", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("framer-motion")),
  useReducedMotion: () => reduceMotion,
}));

const mockedMerge = vi.mocked(mergeDuplicates);

beforeEach(() => {
  reduceMotion = true;
  mockedMerge.mockReset();
  mockedMerge.mockResolvedValue({
    kind: "guitar",
    merged: 1,
    gain: 2,
    rigLevel: 0,
    items: [],
  });
});

afterEach(cleanup);

const Wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const [guitarA, guitarB] = DROPPABLE_GUITARS;
const effect = EFFECT_DEFINITIONS[0];

const base = { newFame: 100, caseTokens: 0, usedToken: false };

const freshGuitar: OpenCaseResult = {
  ...base,
  type: "guitar",
  guitar: guitarA,
  newItem: { id: "g-new" } as OpenCaseResult["newItem"],
  isNewToDex: true,
};

const dupeGuitar: OpenCaseResult = {
  ...base,
  type: "guitar",
  guitar: guitarB,
  newItem: { id: "g-dupe" } as OpenCaseResult["newItem"],
  isNewToDex: false,
  merge: { targetId: "g-old", gain: 2, levelBefore: 20, levelAfter: 22 },
};

const dupeEffect: OpenCaseResult = {
  ...base,
  type: "effect",
  effect,
  effectItem: { id: "e-dupe" } as OpenCaseResult["effectItem"],
  isNewToDex: false,
  merge: { targetId: "e-old", gain: 1, levelBefore: 8, levelAfter: 9 },
};

const pack = (
  results: OpenCaseResult[],
  requested = results.length,
): OpenCasePackResult => ({
  results,
  requested,
  newFame: 100,
  caseTokens: 0,
});

const renderModal = (
  value: OpenCasePackResult | null,
  props: Partial<React.ComponentProps<typeof CasePackModal>> = {},
) => {
  const onClose = vi.fn();
  render(
    <CasePackModal
      pack={value}
      caseDef={CASE_DEFINITIONS.standard}
      onClose={onClose}
      {...props}
    />,
    { wrapper: Wrapper },
  );
  return { onClose };
};

describe("CasePackModal", () => {
  it("renders nothing until there is a pack", () => {
    renderModal(null);
    expect(document.body.textContent).toBe("");
  });

  it("summarises the pack: new, duplicates and parts", () => {
    renderModal(pack([freshGuitar, dupeGuitar, dupeEffect]));

    expect(screen.getByText("New: 1")).toBeTruthy();
    expect(screen.getByText("Duplicates: 2")).toBeTruthy();
    expect(screen.queryByText(/Parts:/)).toBeNull();
  });

  it("offers one merge for every duplicate with a copy to land on", () => {
    renderModal(pack([freshGuitar, dupeGuitar, dupeEffect]));

    // 2 + 1 levels across both duplicates.
    expect(
      screen.getByRole("button", { name: /Merge duplicates · \+3 lvl/ }),
    ).toBeTruthy();
  });

  it("offers no merge when nothing in the pack is a duplicate", () => {
    renderModal(pack([freshGuitar]));
    expect(
      screen.queryByRole("button", { name: /Merge duplicates/ }),
    ).toBeNull();
  });

  it("merges guitars and pedals separately, naming only the duplicates", async () => {
    renderModal(pack([freshGuitar, dupeGuitar, dupeEffect]));

    fireEvent.click(screen.getByRole("button", { name: /Merge duplicates/ }));

    await waitFor(() => expect(mockedMerge).toHaveBeenCalledTimes(2));
    expect(mockedMerge).toHaveBeenCalledWith("guitar", ["g-dupe"]);
    expect(mockedMerge).toHaveBeenCalledWith("effect", ["e-dupe"]);
    // The first copy of a new model is never offered up.
    expect(
      mockedMerge.mock.calls.some(([, ids]) => ids.includes("g-new")),
    ).toBe(false);
  });

  it("marks the duplicates merged and disables the button afterwards", async () => {
    renderModal(pack([freshGuitar, dupeGuitar]));

    fireEvent.click(screen.getByRole("button", { name: /Merge duplicates/ }));

    const done = await screen.findAllByText("Merged");
    expect(done.length).toBeGreaterThan(0);
    const button = screen
      .getAllByRole("button")
      .find((b) => b.textContent === "Merged") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("badges every duplicate that was folded in with what it earned", async () => {
    renderModal(pack([freshGuitar, dupeGuitar, dupeEffect]));

    expect(screen.queryByText("+2")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Merge duplicates/ }));

    expect(await screen.findByText("+2")).toBeTruthy();
    expect(await screen.findByText("+1")).toBeTruthy();
    expect(await screen.findByText(/Merged — +/)).toBeTruthy();
  });

  it("keeps the merge button available when the merge fails", async () => {
    mockedMerge.mockRejectedValue(new Error("nope"));
    renderModal(pack([freshGuitar, dupeGuitar]));

    fireEvent.click(screen.getByRole("button", { name: /Merge duplicates/ }));

    await waitFor(() => expect(mockedMerge).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: /Merge duplicates/,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
  });

  it("says so when Fame ran out part-way through the pack", () => {
    renderModal(pack([freshGuitar, dupeGuitar], 5));

    expect(screen.getByText("Fame ran out — 2 of 5 opened")).toBeTruthy();
  });

  it("closes, and opens the same pack again only when the player can pay", () => {
    const onOpenAgain = vi.fn();
    const { onClose } = renderModal(pack([freshGuitar, dupeGuitar], 2), {
      onOpenAgain,
      canOpenAgain: false,
    });

    const again = screen.getByRole("button", {
      name: /Open ×2 again/,
    }) as HTMLButtonElement;
    expect(again.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("opens the pack again when it is affordable", () => {
    const onOpenAgain = vi.fn();
    renderModal(pack([freshGuitar, dupeGuitar], 2), {
      onOpenAgain,
      canOpenAgain: true,
    });

    fireEvent.click(screen.getByRole("button", { name: /Open ×2 again/ }));
    expect(onOpenAgain).toHaveBeenCalledTimes(1);
  });

  it("lays the cards out commonest first, so the rarest is the last to turn", () => {
    const rarest = [...DROPPABLE_GUITARS]
      .reverse()
      .find((g) => g.rarity === "Mythic" || g.rarity === "Legendary")!;
    const common = DROPPABLE_GUITARS.find((g) => g.rarity === "Common")!;
    renderModal(
      pack([
        { ...dupeGuitar, guitar: rarest },
        { ...freshGuitar, guitar: common },
      ]),
    );

    const cards = Array.from(document.querySelectorAll("ul > li"));
    expect(cards[0].textContent).toContain(common.name);
    expect(cards[cards.length - 1].textContent).toContain(rarest.name);
  });
});

describe("CasePackModal reveal", () => {
  const three = pack([freshGuitar, dupeGuitar, dupeEffect]);

  beforeEach(() => {
    reduceMotion = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("holds back the summary and the buttons until every card has turned", () => {
    renderModal(three);

    expect(screen.queryByText("New: 1")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Merge duplicates/ }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();
  });

  it("is still going partway through", () => {
    renderModal(three);

    // Past the lead-in and the first card, well short of the third.
    act(() => {
      vi.advanceTimersByTime(500 + 450);
    });
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("brings the summary and the buttons in once the last card has turned", () => {
    renderModal(three);

    act(() => {
      vi.advanceTimersByTime(500 + 450 * 3 + 100);
    });

    expect(screen.getByText("New: 1")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Merge duplicates/ }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    // Nothing left to skip.
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
  });

  it("turns everything at once on Skip", () => {
    renderModal(three);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    expect(screen.getByText("Duplicates: 2")).toBeTruthy();
  });

  it("does not walk the count back when a tick lands after Skip", () => {
    renderModal(three);

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });

  it("starts over for a new pack rather than inheriting the last one's progress", () => {
    const { rerender } = render(
      <CasePackModal
        pack={three}
        caseDef={CASE_DEFINITIONS.standard}
        onClose={vi.fn()}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();

    rerender(
      <CasePackModal
        pack={pack([freshGuitar, dupeGuitar, dupeEffect])}
        caseDef={CASE_DEFINITIONS.standard}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();
  });

  it("does not let a click on the backdrop dismiss it mid-reveal", () => {
    const { onClose } = renderModal(three);

    const backdrop = document.querySelector(
      "[class*='bg-black/95']",
    ) as HTMLElement;
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CasePackModal while the request is out", () => {
  beforeEach(() => {
    reduceMotion = false;
  });

  it("shows the case and what is being opened, straight away", () => {
    renderModal(null, { opening: true, count: 5 });

    expect(screen.getByRole("status").textContent).toContain("Opening ×5");
    expect(
      document.querySelector("img[src='/images/case-guitar-standard.webp']"),
    ).toBeTruthy();
  });

  it("shows the art of the case that was actually opened", () => {
    renderModal(null, {
      opening: true,
      count: 10,
      caseDef: CASE_DEFINITIONS.parts,
    });

    expect(
      document.querySelector("img[src='/images/case-parts.webp']"),
    ).toBeTruthy();
  });

  it("shows nothing at all when nothing is being opened", () => {
    renderModal(null, { opening: false });

    expect(document.body.textContent).toBe("");
  });

  it("gives way to the pack when the answer lands", () => {
    reduceMotion = true;
    renderModal(pack([freshGuitar, dupeGuitar]), { opening: true });

    expect(screen.queryByText(/Opening ×/)).toBeNull();
    expect(screen.getByText("New: 1")).toBeTruthy();
  });
});
