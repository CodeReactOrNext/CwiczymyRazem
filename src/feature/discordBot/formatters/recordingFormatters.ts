import type { FirebaseLogsRecordingsInterface } from "feature/logs/types/logs.type";
import { getUserDisplayName } from "../utils/userUtils";

export class RecordingAddedFormatter {
  async format(log: FirebaseLogsRecordingsInterface, lang: "PL" | "EN" = "PL") {
    // Ideally fetch fresh display name, but log.userName is also available
    const displayName = await getUserDisplayName(log.uid) || log.userName;
    const isPl = lang === "PL";
    const title = isPl ? "Nowe Nagranie!" : "New Recording!";
    const description = isPl
      ? `**${displayName}** dodał(a) nowe nagranie!`
      : `**${displayName}** added a new recording!`;

    const fields = [
      {
        name: isPl ? "Tytuł" : "Title",
        value: log.recordingTitle,
        inline: true,
      },
      {
        name: "Video",
        value: log.videoUrl,
        inline: false,
      }
    ];

    if (log.songTitle) {
      fields.splice(1, 0, { // Insert after Title
        name: isPl ? "Piosenka" : "Song",
        value: `${log.songArtist} - ${log.songTitle}`,
        inline: true,
      });
    }

    if (log.recordingDescription) {
      // Truncate description
      const desc = log.recordingDescription.length > 100
        ? log.recordingDescription.substring(0, 100) + "..."
        : log.recordingDescription;

      fields.push({
        name: isPl ? "Opis" : "Description",
        value: desc,
        inline: false,
      });
    }

    return {
      embeds: [
        {
          title,
          description,
          color: 0x3498db,
          thumbnail: {
            url: log.avatarUrl || "https://www.riff.quest/images/default-avatar.png",
          },
          fields,
          footer: {
            text: `RiffQuest • ${new Date(log.timestamp).toLocaleDateString()}`,
          },
        },
      ],
    };
  }
}
