export interface AuthorProfile {
  name: string;
  image: string;
  role: string;
  bio: string;
}

export const AUTHORS: Record<string, AuthorProfile> = {
  "Michael Apfel": {
    name: "Michael Apfel",
    image: "/images/authors/michael-apfel.webp",
    role: "Guitarist & Creator of Riff Quest",
    bio: "Has been playing guitar for 14 years, including time performing live in two bands. Built Riff Quest to solve his own practice-tracking problems, and writes about practice and learning guitar drawing on hands-on experience with the instrument.",
  },
};

export const getAuthorProfile = (name?: string): AuthorProfile | null => {
  if (!name) return null;
  return AUTHORS[name] ?? null;
};
