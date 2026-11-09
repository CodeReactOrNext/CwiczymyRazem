// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  COLOR_THEME_BOOT_SCRIPT,
  COLOR_THEME_STORAGE_KEY,
  LIGHT_THEME_CLASS,
  readableText,
  setColorTheme,
  useColorTheme,
} from "./colorTheme";

afterEach(() => {
  document.documentElement.classList.remove(LIGHT_THEME_CLASS);
  localStorage.clear();
});

describe("setColorTheme", () => {
  it("puts the light class on <html> and remembers the choice", () => {
    setColorTheme("light");
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBe(true);
    expect(localStorage.getItem(COLOR_THEME_STORAGE_KEY)).toBe("light");

    setColorTheme("dark");
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBe(false);
    expect(localStorage.getItem(COLOR_THEME_STORAGE_KEY)).toBe("dark");
  });

  it("re-renders subscribers", () => {
    const { result } = renderHook(() => useColorTheme());
    expect(result.current).toBe("dark");
    act(() => setColorTheme("light"));
    expect(result.current).toBe("light");
  });
});

describe("COLOR_THEME_BOOT_SCRIPT", () => {
  it("restores the light class from storage before React runs", () => {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, "light");
    new Function(COLOR_THEME_BOOT_SCRIPT)();
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBe(true);
  });

  it("leaves the page dark without a stored choice", () => {
    new Function(COLOR_THEME_BOOT_SCRIPT)();
    expect(document.documentElement.classList.contains(LIGHT_THEME_CLASS)).toBe(false);
  });
});

describe("readableText", () => {
  it("wraps a hex in its light-theme variable with the hex as fallback", () => {
    expect(readableText("#FBBF24")).toBe("var(--tx-fbbf24, #FBBF24)");
  });

  it("passes anything else through", () => {
    expect(readableText(undefined)).toBeUndefined();
    expect(readableText("rgb(1 2 3)")).toBe("rgb(1 2 3)");
    expect(readableText("var(--x)")).toBe("var(--x)");
  });
});
