import type { SeasonData } from "../types/season.types";

export class SeasonUpdateFormatter {
  format(seasonData: SeasonData, lang: "PL" | "EN" = "PL") {
    const isEn = lang === "EN";
    return {
      embeds: [
        {
          title: isEn
            ? "🏆 **Current Season Leaders**"
            : "🏆 **Aktualni Liderzy Sezonu**",
          description: isEn
            ? "Check who is leading this season! 🔥"
            : "Sprawdź, kto prowadzi w tym sezonie! 🔥",
          color: 0xf1c40f,
          fields: seasonData.players.map((player, index) => ({
            name: `${index + 1}. ${["🥇", "🥈", "🥉"][index] || "🎖️"} **${player.displayName
              }**`,
            value: isEn
              ? `Points: **${player.points}**`
              : `Punkty: **${player.points}**`,
            inline: false,
          })),
          footer: {
            text: isEn
              ? `${seasonData.daysLeft} days left until season ends.`
              : `Do końca sezonu zostało ${seasonData.daysLeft} dni.`,
          },
          thumbnail: {
            url: "https://raw.githubusercontent.com/CodeReactOrNext/CwiczymyRazem/develop/discord-leadboard.png",
          },
        },
        {
          title: isEn ? "➡️ **Join the fun!**" : "➡️ **Dołącz do zabawy!**",
          description: "https://riff.quest",
          color: 0x3498db,
        },
      ],
    };
  }
}
