import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActivityLogFormatter } from "../formatters/generalLogFormatter";
import { getUserDisplayName } from "../utils/userUtils";

vi.mock("../utils/userUtils", () => ({
  getUserDisplayName: vi.fn(),
}));

describe("ActivityLogFormatter", () => {
  const mockDate = new Date(2024, 0, 15);
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);

  const mockLog = {
    uid: "testUser",
    points: 75,
    timeSumary: {
      creativityTime: 100 * 60 * 1000,
      theoryTime: 60 * 60 * 1000,
      hearingTime: 45 * 60 * 1000,
      techniqueTime: 120 * 60 * 1000,
    },
    newLevel: {
      isNewLevel: true,
      level: 5,
    },
    newAchievements: ["achievement1", "achievement2"],
    streak: 10,
  };

  beforeEach(() => {
    vi.mocked(getUserDisplayName).mockResolvedValue("Test User");
  });

  it("should format activity log correctly", async () => {
    const formatter = new ActivityLogFormatter();
    const result = await formatter.format(mockLog as any);

    expect(result.embeds[0]).toMatchObject({
      author: {
        name: "Test User",
      },
      title: expect.stringContaining("Raport Sesji"),
      description: expect.stringContaining("75 PKT"),
      color: 0x3498db,
      fields: expect.arrayContaining([
        expect.objectContaining({ name: "🎉 **POZIOM W GÓRĘ!**" }),
        expect.objectContaining({ name: "🏅 **Osiągnięcia**" }),
      ]),
    });
  });
});
