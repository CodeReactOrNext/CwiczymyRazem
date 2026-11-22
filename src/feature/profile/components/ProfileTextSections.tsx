import { Card } from "assets/components/ui/card";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import type { Song } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";

import { ProfileSongRow } from "./SongSkillShowcase";

/** The player's own words. Renders nothing until they write something. */
export const AboutSection = ({ text }: { text: string }) => {
  const { t } = useTranslation("profile");
  if (!text) return null;
  return (
    <Card className='h-full p-5 sm:p-6'>
      <SectionHeader
        title={t("layout.sections.about.title")}
        className='mb-0'
      />
      <p className='mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-zinc-300'>
        {text}
      </p>
    </Card>
  );
};

/** Songs on the "learning" list, newest effort first as stored. */
export const LearningSection = ({
  songs,
  practiceTimes,
}: {
  songs: Song[] | undefined;
  practiceTimes?: Record<string, number>;
}) => {
  const { t } = useTranslation("profile");
  if (!songs || songs.length === 0) return null;
  return (
    <Card className='h-full p-5 sm:p-6'>
      <SectionHeader
        title={t("layout.sections.learning.title")}
        description={`${songs.length} ${songs.length === 1 ? "song" : "songs"} in progress`}
        className='mb-0'
      />
      <div className='mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {songs.slice(0, 8).map((song) => (
          <ProfileSongRow
            key={song.id}
            song={song}
            practiceMs={practiceTimes?.[song.id]}
          />
        ))}
      </div>
    </Card>
  );
};
