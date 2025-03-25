import { describe, expect,it } from "vitest";

import { SeasonUpdateFormatter } from "../formatters/seasonFormatter";

describe("SeasonUpdateFormatter", () => {
  it("should format season update correctly", () => {
    const formatter = new SeasonUpdateFormatter();
    const seasonData = {
      players: [
        { displayName: "Player 1", points: 100 },
        { displayName: "Player 2", points: 80 },
        { displayName: "Player 3", points: 60 },
      ],
      daysLeft: 15,
    };

    const result = formatter.format(seasonData);

    expect(result.embeds).toHaveLength(2);
    expect(result.embeds[0]).toMatchObject({
      title: expect.stringContaining("Liderzy Sezonu"),
      fields: expect.arrayContaining([
        expect.objectContaining({
          name: expect.stringContaining("🥇"),
          value: expect.stringContaining("100"),
        }),
      ]),
      footer: {
        text: expect.stringContaining("15 dni"),
      },
    });
  });
});
