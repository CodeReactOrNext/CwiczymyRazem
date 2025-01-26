import { describe, it, expect, beforeEach, vi } from "vitest";
import { ActivityLogFormatter } from "../formatters/generalLogFormatter";
import { getUserDisplayName } from "../utils/userUtils";

describe("ActivityLogFormatter", () => {
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
  };

  beforeEach(() => {
    vi.mocked(getUserDisplayName).mockResolvedValue("Test User");
  });

  it("should format activity log correctly", async () => {
    const formatter = new ActivityLogFormatter();
    const result = await formatter.format(mockLog as any);

    expect(result.embeds[0]).toMatchObject({
      title: expect.stringContaining("Raport Aktywności"),
      description: expect.stringContaining("Test User"),
      color: 0x3498db,
      fields: expect.arrayContaining([
        expect.objectContaining({ name: "🏅 **Nowy Poziom**" }),
        expect.objectContaining({ name: "🌟 **2 Nowe Osiągnięcia!**" }),
      ]),
    });
  });
});
