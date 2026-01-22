import type { FirebaseLogsInterface } from "feature/logs/types/logs.type";
import { convertMsToHM } from "utils/converter";

import { ACTIVITY_MESSAGES, DISCORD_JOKES } from "../constants/messages";
import type { DiscordEmbed } from "../types/discord.types";
import type { GeneralLogFormatter } from "../types/formatter.types";
import { getUserDisplayName } from "../utils/userUtils";

export class ActivityLogFormatter implements GeneralLogFormatter {
  async format(log: FirebaseLogsInterface, lang: "PL" | "EN" = "PL") {
    const displayName = await getUserDisplayName(log.uid);
    const isEn = lang === "EN";
    const randomMessage =
      lang === "PL"
        ? this.getRandomMessage(log)
        : "Keep practicing and reach for the stars! 🌟";

    const totalTime =
      log.timeSumary.creativityTime +
      log.timeSumary.hearingTime +
      log.timeSumary.techniqueTime +
      log.timeSumary.theoryTime;

    const sessionHours = Math.floor(totalTime / (1000 * 60 * 60));
    const sessionMinutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
    const timeString = isEn
      ? `${sessionHours}h ${sessionMinutes}m`
      : `${sessionHours}godz. ${sessionMinutes}min`;


    // Main Embed
    const embed: DiscordEmbed = {
      author: {
        name: displayName,
        url: `https://www.riff.quest/user/${log.uid}`,
        ...(isEn && log.avatarUrl && { icon_url: log.avatarUrl }),
      },
      title: isEn ? "🎸 Session Report" : "🎸 Raport Sesji",
      url: `https://www.riff.quest/user/${log.uid}`,
      color: 0x3498db, // Example Blue
      description: isEn
        ? `Finished a practice session!\n\n**🏆 ${log.points} PTS**   •   **⏱️ ${timeString}**`
        : `Zakończył sesję ćwiczeń!\n\n**🏆 ${log.points} PKT**   •   **⏱️ ${timeString}**`,
      fields: [] as any[],
      footer: {
        text: isEn
          ? `🔥 Streak: ${log.streak || 0} days | Keep it up!`
          : `🔥 Seria: ${log.streak || 0} dni | Tak trzymaj!`,
        // icon_url: "https://www.riff.quest/icons/fire-icon.png", 
      },
      timestamp: new Date().toISOString(),
    };


    // Level Up Field
    if (log.newLevel?.isNewLevel) {
      embed.fields?.push({
        name: isEn ? "🎉 **LEVEL UP!**" : "🎉 **POZIOM W GÓRĘ!**",
        value: isEn
          ? `Reached **Level ${log.newLevel.level}**! 🚀`
          : `Osiągnął **Poziom ${log.newLevel.level}**! 🚀`,
        inline: false,
      });
    }

    // Achievements Field
    if (log.newAchievements?.length) {
      const achievementCount = log.newAchievements.length;
      embed.fields?.push({
        name: isEn ? "🏅 **Achievements**" : "🏅 **Osiągnięcia**",
        value: isEn
          ? `Unlocked **${achievementCount}** new achievement${achievementCount > 1 ? 's' : ''}!`
          : `Odblokował **${achievementCount}** nowe osiągnięci${achievementCount > 1 ? 'a' : 'e'}!`,
        inline: false,
      });
    }

    // Breakdown Fields with Progress Bars
    const categories = [
      { key: 'techniqueTime', labelPL: 'Technika', labelEN: 'Technique', emoji: '🎸' },
      { key: 'theoryTime', labelPL: 'Teoria', labelEN: 'Theory', emoji: '📚' },
      { key: 'hearingTime', labelPL: 'Słuch', labelEN: 'Hearing', emoji: '🎧' },
      { key: 'creativityTime', labelPL: 'Kreatywność', labelEN: 'Creativity', emoji: '🎨' },
    ];

    let breakdownStr = "";
    categories.forEach(cat => {
      const time = log.timeSumary[cat.key as keyof typeof log.timeSumary];
      if (time > 0) {
        const percentage = totalTime > 0 ? Math.round((time / totalTime) * 100) : 0;
        const progressBar = this.generateProgressBar(percentage);
        const catLabel = isEn ? cat.labelEN : cat.labelPL;
        const timeStr = convertMsToHM(time);

        // Compact format: Emoji | Bar | Time
        breakdownStr += `\`${progressBar}\` **${catLabel}** (${timeStr}h)\n`;
      }
    });

    if (breakdownStr) {
      embed.fields?.push({
        name: isEn ? "📊 **Details**" : "📊 **Szczegóły**",
        value: breakdownStr,
        inline: false
      })
    }

    // Random Motivational Quote/Joke
    if (!isEn) {
      embed.fields?.push({
        name: isEn ? "💡 **Daily Wisdom**" : "💡 **Myśl Przewodnia**",
        value: `*${randomMessage}*`,
        inline: false,
      });
    }


    return {
      embeds: [embed],
    };
  }

  // ... (generateFields is no longer needed in this structure but keeping helper methods)

  private generateProgressBar(percentage: number): string {
    const totalBars = 8;
    const filledBars = Math.round((percentage / 100) * totalBars);
    const emptyBars = totalBars - filledBars;

    // Sleeker unicode blocks
    const filledChar = "■";
    const emptyChar = "□";

    return `${filledChar.repeat(filledBars)}${emptyChar.repeat(emptyBars)}`;
  }

  // ... getRandomMessage logic remains same
  private getRandomMessage(log: FirebaseLogsInterface): string {
    const applicableMessages = [
      ...ACTIVITY_MESSAGES.filter((msg) => msg.condition(log)),
      ...DISCORD_JOKES,
    ];
    return (
      applicableMessages[Math.floor(Math.random() * applicableMessages.length)]
        ?.message || ""
    );
  }

  // Helper no longer used but kept if needed for reference, or can be removed. 
  // Cleaning it up to avoid unused code warnings if possible, but let's just leave the class clean.
}
