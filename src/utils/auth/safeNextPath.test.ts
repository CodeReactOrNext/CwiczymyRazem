import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safeNextPath";

describe("safeNextPath", () => {
  it("keeps a same-origin path", () => {
    expect(safeNextPath("/songs/practice/abc123")).toBe("/songs/practice/abc123");
  });

  it("keeps a query string", () => {
    expect(safeNextPath("/song-library?tier=D")).toBe("/song-library?tier=D");
  });

  it("falls back when nothing was asked for", () => {
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath(["/a", "/b"])).toBe("/a");
  });

  it("refuses anything that could leave the site", () => {
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath("/ /evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\n/evil.com")).toBe("/dashboard");
    expect(safeNextPath("javascript:alert(1)")).toBe("/dashboard");
  });
});
