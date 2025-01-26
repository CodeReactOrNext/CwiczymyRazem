import { convertMsToHM } from "utils/converter";
import { getUserDisplayName } from "../utils/userUtils";
import { GeneralLogFormatter } from "../types/formatter.types";
import { ACTIVITY_MESSAGES, JOKES } from "../constants/messages";
import { FirebaseLogsInterface } from "utils/firebase/client/firebase.types";

export class ActivityLogFormatter implements GeneralLogFormatter {
  async format(log: FirebaseLogsInterface) {
    const displayName = await getUserDisplayName(log.uid);
    const fields = this.generateFields(log);
    const randomMessage = this.getRandomMessage(log);

    return {
      embeds: [
        {
          title: "📊 **Nowy Raport Aktywności**",
          description: ` **[${displayName}](https://www.cwiczymy-razem.pl/user/${log.uid})** zdobył **${log.points}** punktów! \n\nSprawdź jego szczegóły poniżej:`,
          color: 0x3498db,
          fields: [
            ...fields,
            {
              name: "A tak poza tym...",
              value: randomMessage,
              inline: false,
            },
          ],
          thumbnail: {
            url: "https://www.clipartmax.com/png/full/155-1559277_2nd-quarter-report-cards-were-emailed-today-report-cards.png",
          },
          footer: {
            text: "Keep pushing forward! 🚀",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  private generateFields(log: FirebaseLogsInterface) {
    const fields = [];

    if (log.newLevel?.isNewLevel) {
      fields.push({
        name: "🏅 **Nowy Poziom**",
        value: ` Gratulacje! Awans na poziom **${log.newLevel.level}**`,
        inline: false,
      });
    }

    if (log.newAchievements?.length) {
      fields.push({
        name: `🌟 **${log.newAchievements.length} Nowe Osiągnięcia!**`,
        inline: false,
      });
    }

    this.addTimeField(
      fields,
      log.timeSumary.creativityTime,
      "🎨 **Kreatywność**"
    );
    this.addTimeField(fields, log.timeSumary.hearingTime, "🎧 **Słuch**");
    this.addTimeField(fields, log.timeSumary.techniqueTime, "🎸 **Technika**");
    this.addTimeField(fields, log.timeSumary.theoryTime, "📚 **Teoria**");

    return fields;
  }

  private addTimeField(fields: any[], time: number, name: string) {
    if (time) {
      fields.push({
        name,
        value: `${convertMsToHM(time)}h`,
        inline: true,
      });
    }
  }

  private getRandomMessage(log: FirebaseLogsInterface): string {
    const applicableMessages = [
      ...ACTIVITY_MESSAGES.filter((msg) => msg.condition(log)),
      ...JOKES,
    ];
    return (
      applicableMessages[Math.floor(Math.random() * applicableMessages.length)]
        ?.message || ""
    );
  }
}
