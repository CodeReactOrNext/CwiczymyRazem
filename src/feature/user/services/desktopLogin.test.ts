import { describe, expect, it } from "vitest";

import { parseDesktopLoginRequest } from "./desktopLogin";

const STATE = "a".repeat(64);

describe("parseDesktopLoginRequest", () => {
  it("reads the port and state the app opened the page with", () => {
    expect(parseDesktopLoginRequest({ port: "51234", state: STATE })).toEqual({
      kind: "sign-in",
      port: 51234,
      state: STATE,
    });
  });

  it("recognises the app's redirect after a finished sign-in", () => {
    expect(parseDesktopLoginRequest({ done: "1" })).toEqual({ kind: "done" });
  });

  it.each([
    [{}],
    [{ port: "51234" }],
    [{ state: STATE }],
    [{ port: "80", state: STATE }],
    [{ port: "70000", state: STATE }],
    [{ port: "51234abc", state: STATE }],
    [{ port: "51234", state: "short" }],
    [{ port: "51234", state: "Z".repeat(64) }],
    [{ port: ["51234", "51235"], state: STATE }],
  ])("refuses %o", (query) => {
    expect(parseDesktopLoginRequest(query)).toEqual({ kind: "invalid" });
  });
});
