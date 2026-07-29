import { FaYoutube } from "react-icons/fa6";

import type { GuideVideoLesson } from "../types";
import { GuideSection } from "./GuideSection";

interface GuideVideoLessonsProps {
  lessons: GuideVideoLesson[];
}

export const GuideVideoLessons = ({ lessons }: GuideVideoLessonsProps) => {
  if (lessons.length === 0) return null;

  return (
    <GuideSection heading='Video lessons'>
      <div className='grid gap-4 sm:grid-cols-3'>
        {lessons.map((lesson) => (
          <a
            key={lesson.videoId}
            href={`https://www.youtube.com/watch?v=${lesson.videoId}`}
            target='_blank'
            rel='noopener noreferrer'
            className='group block overflow-hidden rounded-lg bg-zinc-900/40 transition-background hover:bg-zinc-900/70'>
            <div className='relative aspect-video overflow-hidden bg-zinc-800'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${lesson.videoId}/hqdefault.jpg`}
                alt=''
                loading='lazy'
                className='h-full w-full object-cover'
              />
              <div className='absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/50'>
                <div className='flex h-11 w-11 items-center justify-center rounded-full bg-red-600/90'>
                  <FaYoutube className='h-6 w-6 text-white' />
                </div>
              </div>
            </div>
            <div className='p-4'>
              <p className='line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white'>
                {lesson.title}
              </p>
              <p className='mt-1 truncate text-xs text-zinc-500'>
                {lesson.channelName}
              </p>
            </div>
          </a>
        ))}
      </div>
    </GuideSection>
  );
};
