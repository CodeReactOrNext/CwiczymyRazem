// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useLocaleStore } from "lib/i18n/localeStore";
import { LocalizedRegion } from "lib/i18n/LocalizedRegion";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTranslation } from "./useTranslation";

/** Reads two settings keys: one the Polish overlay below covers, one it does not. */
const Probe = () => {
  const { t } = useTranslation("settings");
  return (
    <>
      <span data-testid='title'>{t("language.title")}</span>
      <span data-testid='subtitle'>{t("language.subtitle")}</span>
    </>
  );
};

const PL_SETTINGS = { language: { title: "Język" } };

const fetchMock = vi.fn(async (url: string) => ({
  ok: url === "/locales/pl/settings.json",
  json: async () => PL_SETTINGS,
}));

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  // A fresh store per test: the overlay cache is what the assertions are about.
  useLocaleStore.setState({
    locale: "en",
    catalogs: { en: useLocaleStore.getState().catalogs.en },
    requested: {},
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useTranslation", () => {
  it("renders the bundled English strings with nothing fetched", () => {
    render(<Probe />);

    expect(screen.getByTestId("title").textContent).toBe("Language");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores the chosen language outside the app", async () => {
    // The landing page, the blog, the public song guides: no LocalizedRegion
    // around them, so they stay in the language they were server-rendered in.
    useLocaleStore.setState({ locale: "pl" });

    render(<Probe />);

    expect(screen.getByTestId("title").textContent).toBe("Language");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("applies the chosen language inside the app", async () => {
    useLocaleStore.setState({ locale: "pl" });

    render(
      <LocalizedRegion>
        <Probe />
      </LocalizedRegion>,
    );

    // English until the overlay lands — never a blank screen.
    expect(screen.getByTestId("title").textContent).toBe("Language");

    await waitFor(() =>
      expect(screen.getByTestId("title").textContent).toBe("Język"),
    );
    expect(fetchMock).toHaveBeenCalledWith("/locales/pl/settings.json");
    expect(document.documentElement.lang).toBe("pl");
  });

  it("keeps English for keys the overlay does not translate", async () => {
    useLocaleStore.setState({ locale: "pl" });

    render(
      <LocalizedRegion>
        <Probe />
      </LocalizedRegion>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("title").textContent).toBe("Język"),
    );
    expect(screen.getByTestId("subtitle").textContent).toBe(
      "Applies to the app on this device.",
    );
  });

  it("asks for each namespace file once, however many components want it", async () => {
    useLocaleStore.setState({ locale: "pl" });

    render(
      <LocalizedRegion>
        <Probe />
        <Probe />
        <Probe />
      </LocalizedRegion>,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stays on English when the overlay cannot be fetched", async () => {
    useLocaleStore.setState({ locale: "de" });

    render(
      <LocalizedRegion>
        <Probe />
      </LocalizedRegion>,
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/locales/de/settings.json"),
    );
    expect(screen.getByTestId("title").textContent).toBe("Language");
  });
});
