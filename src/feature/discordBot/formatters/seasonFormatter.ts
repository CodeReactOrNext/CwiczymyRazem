import { SeasonData } from "../types/season.types";

export class SeasonUpdateFormatter {
  format(seasonData: SeasonData) {
    return {
      embeds: [
        {
          title: "🏆 **Aktualni Liderzy Sezonu**",
          description: "Sprawdź, kto prowadzi w tym sezonie! 🔥",
          color: 0xf1c40f,
          fields: seasonData.players.map((player, index) => ({
            name: `${index + 1}. ${["🥇", "🥈", "🥉"][index] || "🎖️"} **${
              player.displayName
            }**`,
            value: `Punkty: **${player.points}**`,
            inline: false,
          })),
          footer: {
            text: `Do końca sezonu zostało ${seasonData.daysLeft} dni.`,
          },
          thumbnail: {
            url: "https://www.cwiczymy-razem.pl/discord-leadboard.png",
          },
        },
        {
          title: "➡️ **Dołącz do zabawy!**",
          description: " https://www.cwiczymy-razem.pl",
          color: 0x3498db,
        },
      ],
    };
  }
}
