import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const settleRecentDailyBoards = vi.fn(async () => ["2026-10-01"]);
vi.mock("lib/dailyExercise/settleDailyBoard", () => ({ settleRecentDailyBoards }));

const { default: handler } = await import("../../pages/api/cron/daily-exercise");

const call = async (authorization?: string) => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  await handler({ headers: { authorization } } as NextApiRequest, res as unknown as NextApiResponse);
  return res;
};

describe("cron/daily-exercise", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    settleRecentDailyBoards.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("turns away anything but Vercel's cron", async () => {
    const res = await call("Bearer wrong");

    expect(res.status).toHaveBeenCalledWith(401);
    expect(settleRecentDailyBoards).not.toHaveBeenCalled();
  });

  it("settles the closed boards when the cron calls", async () => {
    const res = await call("Bearer s3cret");

    expect(settleRecentDailyBoards).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ settled: ["2026-10-01"] });
  });
});
