import { format } from 'date-fns';
import { User } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface BlogHeaderProps {
  title: string;
  description: string;
  date: string;
  /** Shown instead of the publish date when the post has actually been revised. */
  updatedAt?: string;
  image: string;
  author?: string;
  authorImage?: string;
  readTime?: string;
  /** BCP 47 code of the post's language, so a translated title and subtitle are
   *  announced correctly on a page whose <html> stays lang='en'. */
  lang?: string;
}

/**
 * Post header on the white reading page: title, lead, byline, then the cover
 * image — all in the same column as the text below. The old full-bleed parallax
 * hero put the title over a darkened photo; here nothing competes with the words.
 */
export const BlogHeader = ({ title, description, date, updatedAt, image, author, authorImage, readTime = "5 min", lang = "en" }: BlogHeaderProps) => {
  const showUpdated = Boolean(updatedAt) && updatedAt !== date;
  const shownDate = showUpdated
    ? `Updated ${format(new Date(updatedAt as string), 'MMM dd, yyyy')}`
    : format(new Date(date), 'MMM dd, yyyy');

  return (
    <header lang={lang}>
      <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 md:text-5xl">
        {title}
      </h1>

      <p className="mt-5 text-xl leading-relaxed text-zinc-600">
        {description}
      </p>

      <div className="mt-8 flex items-center gap-3">
        {authorImage ? (
          <Image
            src={authorImage}
            alt={author || "Riff Quest"}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
            <User className="h-4 w-4 text-zinc-500" />
          </div>
        )}
        <div className="text-sm">
          <p className="font-semibold text-zinc-900">{author || "Riff Quest"}</p>
          <p className="text-zinc-500">
            {shownDate} · {readTime} read
          </p>
        </div>
      </div>

      <img
        src={image}
        alt={title}
        width={1280}
        height={720}
        fetchPriority="high"
        decoding="async"
        className="mt-10 aspect-video w-full rounded-lg object-cover"
      />
    </header>
  );
};
