import {
  LearnedSongFormatter,
  WantToLearnSongFormatter,
} from "feature/discordBot/formatters/songFormatters";
import { getUserDisplayName } from "feature/discordBot/utils/userUtils";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("SongFormatters", () => {
  const mockLog = {
    uid: "testUser",
    songArtist: "Test Artist",
    songTitle: "Test Song",
    status: "learned",
  };

  beforeEach(() => {
    vi.mocked(getUserDisplayName).mockResolvedValue("Test User");
  });

  describe("LearnedSongFormatter", () => {
    it("should format learned song message correctly", async () => {
      const formatter = new LearnedSongFormatter();
      const result = await formatter.format(mockLog as any);

      expect(result.embeds[0]).toMatchObject({
        title: "Utwór Opanowany",
        description: expect.stringContaining("Test User"),
        color: 0x2ecc71,
      });
    });
  });

  describe("WantToLearnSongFormatter", () => {
    it("should format want to learn song message correctly", async () => {
      const formatter = new WantToLearnSongFormatter();
      const result = await formatter.format(mockLog as any);

      expect(result.embeds[0]).toMatchObject({
        title: "Nauka Utworu",
        description: expect.stringContaining("Test User"),
        color: 0xf1c40f,
      });
    });
  });
});
