import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface AuthorBioProps {
  name: string;
  image: string;
  role: string;
  bio: string;
}

export const AuthorBio = ({ name, image, role, bio }: AuthorBioProps) => {
  return (
    <div className="not-prose my-10 rounded-lg bg-zinc-900/40 p-6 sm:p-8">
      <p className="text-xs tracking-widest text-white">About the Author</p>

      <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Image
          src={image}
          alt={name}
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="text-lg font-bold text-white">{name}</p>
          <p className="text-sm text-zinc-500">{role}</p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-zinc-400">{bio}</p>

      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300">
        Try Riff Quest
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};
