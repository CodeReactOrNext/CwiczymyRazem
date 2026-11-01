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
    <div className="not-prose my-10 rounded-lg bg-zinc-900/40 p-6 light:bg-zinc-100 sm:p-8">
      <p className="text-sm font-medium text-zinc-400 light:text-zinc-500">About the Author</p>

      <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Image
          src={image}
          alt={name}
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="text-lg font-bold text-white light:text-zinc-900">{name}</p>
          <p className="text-sm text-zinc-400 light:text-zinc-600">{role}</p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-zinc-400 light:text-zinc-700">{bio}</p>

      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 light:text-cyan-700 light:hover:text-cyan-800">
        Try Riff Quest
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};
