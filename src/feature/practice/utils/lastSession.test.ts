import { describe, expect, it } from "vitest";

import { parseLastSessions } from "./lastSession";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("parseLastSessions", () => {
  it("reads nothing out of an empty or broken store", () => {
    expect(parseLastSessions(null)).toStrictEqual([]);
    expect(parseLastSessions("not json")).toStrictEqual([]);
    expect(parseLastSessions('{"title":"a"}')).toStrictEqual([]);
  });

  it("drops entries missing a field", () => {
    const at = Date.now();
    const raw = JSON.stringify([
      { title: "Spider", href: "/timer/plans/1", at },
      { title: "No link", at },
      null,
    ]);
    expect(parseLastSessions(raw)).toStrictEqual([
      { title: "Spider", href: "/timer/plans/1", at },
    ]);
  });

  it("forgets a session older than two weeks", () => {
    const fresh = { title: "Fresh", href: "/a", at: Date.now() - DAY_MS };
    const stale = { title: "Stale", href: "/b", at: Date.now() - 15 * DAY_MS };
    expect(parseLastSessions(JSON.stringify([fresh, stale]))).toStrictEqual([
      fresh,
    ]);
  });
});
