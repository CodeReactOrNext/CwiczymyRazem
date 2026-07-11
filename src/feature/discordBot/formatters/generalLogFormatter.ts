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
        url: `https://riff.quest/user/${log.uid}`,
        ...(isEn && log.avatarUrl && { icon_url: log.avatarUrl }),
      },
      title: isEn ? "🎸 Session Report" : "🎸 Raport Sesji",
      url: `https://riff.quest/user/${log.uid}`,
      color: 0x3498db, // Example Blue
      description: isEn
        ? `Finished a practice session!\n\n**🏆 ${log.points} PTS**   •   **⏱️ ${timeString}**`
        : `Zakończył sesję ćwiczeń!\n\n**🏆 ${log.points} PKT**   •   **⏱️ ${timeString}**`,
      fields: [] as any[],
      footer: {
        text: isEn
          ? `🔥 Streak: ${log.streak || 0} days | Keep it up!`
          : `🔥 Seria: ${log.streak || 0} dni | Tak trzymaj!`,
        // icon_url: "https://riff.quest/icons/fire-icon.png",
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

    // Skills Field
    if (log.skillPointsGained && Object.keys(log.skillPointsGained).length > 0) {
      const skillEntries = Object.entries(log.skillPointsGained)
        .filter(([, pts]) => pts > 0)
        .map(([skillId, pts]) => {
          const name = skillId.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          return `**${name}** +${pts}`;
        });
      if (skillEntries.length > 0) {
        embed.fields?.push({
          name: isEn ? "🎯 **Skills**" : "🎯 **Skille**",
          value: skillEntries.join("  •  "),
          inline: false,
        });
      }
    }

    // Records Field
    {
      const recordLines: string[] = [];
      if (log.newRecords?.maxPoints) {
        recordLines.push(isEn ? "🏆 New points record!" : "🏆 Nowy rekord punktów!");
      }
      if (log.newRecords?.longestSession) {
        recordLines.push(isEn ? "⏱️ Longest session ever!" : "⏱️ Najdłuższa sesja w historii!");
      }
      if (log.newRecords?.maxStreak) {
        recordLines.push(isEn ? "🔥 New streak record!" : "🔥 Nowy rekord serii!");
      }
      if (log.exerciseRecords?.micHighScore) {
        const r = log.exerciseRecords.micHighScore;
        recordLines.push(
          isEn
            ? `🎤 New mic high score on **${r.exerciseTitle}**: ${r.score} pts (${r.accuracy}%)`
            : `🎤 Nowy rekord mic w **${r.exerciseTitle}**: ${r.score} pkt (${r.accuracy}%)`
        );
      }
      if (log.exerciseRecords?.earTrainingHighScore) {
        const r = log.exerciseRecords.earTrainingHighScore;
        recordLines.push(
          isEn
            ? `🎧 New ear training high score on **${r.exerciseTitle}**: ${r.score} pts`
            : `🎧 Nowy rekord ear training w **${r.exerciseTitle}**: ${r.score} pkt`
        );
      }
      if (recordLines.length > 0) {
        embed.fields?.push({
          name: isEn ? "📈 **New Records!**" : "📈 **Nowe Rekordy!**",
          value: recordLines.join("\n"),
          inline: false,
        });
      }
    }

    // Performance Field (Non-records)
    {
      const performanceLines: string[] = [];
      const hasMicRecord = !!log.exerciseRecords?.micHighScore;
      const hasEtRecord = !!log.exerciseRecords?.earTrainingHighScore;

      if (log.micPerformance && !hasMicRecord) {
        performanceLines.push(
          isEn
            ? `🎤 Mic: **${log.micPerformance.score}** pts (${log.micPerformance.accuracy}%)`
            : `🎤 Mic: **${log.micPerformance.score}** pkt (${log.micPerformance.accuracy}%)`
        );
      }
      if (log.earTrainingPerformance && !hasEtRecord) {
        performanceLines.push(
          isEn
            ? `🎧 Ear training: **${log.earTrainingPerformance.score}** correct`
            : `🎧 Ear training: **${log.earTrainingPerformance.score}** poprawnych`
        );
      }

      if (performanceLines.length > 0) {
        embed.fields?.push({
          name: isEn ? "✨ **Session Results**" : "✨ **Wyniki Sesji**",
          value: performanceLines.join("\n"),
          inline: false,
        });
      }
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
