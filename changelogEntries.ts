import { ChangelogEntry } from "layouts/LogsBoxLayout/components/Changelog/Changelog";

export const changelogEntries: ChangelogEntry[] = [
  {
    date: "2024-01-08",
    category: "new", 
    description:
      "Introduced song management module allowing users to add songs, rate their difficulty, and track learning progress with statuses like 'Learning', 'Want to Learn', and 'Learned'.",
  },
  {
    date: "2024-01-07",
    category: "improvement",
    description:
      "Added notification badges for new chat messages and logs. Logs section now updates in real-time to show the latest activity across the platform.",
  },
  {
    date: "2024-01-03",
    category: "new",
    description: 
      "Added real-time chat functionality allowing users to communicate and share their musical journey with other community members.",
  },
  {
    date: "2024-01-01", 
    category: "improvement",
    description:
      "Enhanced leaderboard performance and user experience by implementing pagination. Users can now navigate through pages smoothly to view all participants.",
  },
  {
    date: "2023-12-26",
    category: "improvement",
    description:
      "UI and UX improvement across the entire platform. Switched to a single color mode (dark mode), removed unused features, and implemented foundational adjustments to support upcoming features.",
  },
];
