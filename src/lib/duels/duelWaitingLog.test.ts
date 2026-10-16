import { describe, expect, it } from "vitest";

import { buildDuelWaitingLog, duelWaitingLogId } from "./duelWaitingLog";

const CREATED_AT = Date.parse("2026-10-16T12:00:00.000Z");
const EXPIRES_AT = CREATED_AT + 24 * 60 * 60 * 1000;

describe("duelWaitingLogId", () => {
  it("is the ticket's own id, so whoever drops the ticket can drop the row", () => {
    expect(duelWaitingLogId("t1")).toBe("duel-waiting-t1");
  });
});

describe("buildDuelWaitingLog", () => {
  it("dates the row from when the ticket was queued and carries its lifetime", () => {
    expect(
      buildDuelWaitingLog({
        id: "t1",
        createdAt: CREATED_AT,
        expiresAt: EXPIRES_AT,
      }),
    ).toEqual({
      type: "duel_waiting",
      data: "2026-10-16T12:00:00.000Z",
      timestamp: "2026-10-16T12:00:00.000Z",
      ticketId: "t1",
      expiresAt: EXPIRES_AT,
    });
  });

  it("never carries who is waiting, even when handed the whole ticket", () => {
    const row = buildDuelWaitingLog({
      id: "t1",
      userId: "secret-uid",
      createdAt: CREATED_AT,
      expiresAt: EXPIRES_AT,
    } as Parameters<typeof buildDuelWaitingLog>[0]);

    expect(JSON.stringify(row)).not.toContain("secret-uid");
    expect(Object.keys(row)).not.toContain("userId");
  });
});
