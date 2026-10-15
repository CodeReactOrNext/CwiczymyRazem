/* eslint-disable @next/next/no-img-element */

interface AvatarProps {
  name: string;
  avatarURL?: string;
  size?: "xs" | "sm" | "md" | "2xl";
  className?: string;
}

const Avatar = ({ name, avatarURL, size, className }: AvatarProps) => {
  const isCompact = size === "xs" || size === "sm" || size === "md";

  let containerSizeClass = "h-20 w-20 rounded-xl";
  if (size === "xs") containerSizeClass = "h-8 w-8 rounded-full";
  if (size === "sm") containerSizeClass = "h-10 w-10 rounded-full";
  if (size === "md") containerSizeClass = "h-12 w-12 rounded-lg";
  if (size === "2xl") containerSizeClass = "h-32 w-32 rounded-2xl";

  // The light fill is only for the initial: behind a photo it leaks through the
  // anti-aliased edge of the clip and draws a pale, ragged hairline round it.
  const fillClass = avatarURL ? "" : "bg-tertiary-400";

  return (
    <div className={`relative inline-block ${className || ""}`}>
      <div
        className={`relative z-10 flex items-center justify-center overflow-hidden ${fillClass} ${containerSizeClass}`}>
        {avatarURL ? (
          <img
            referrerPolicy='no-referrer'
            className='h-full w-full object-cover'
            src={avatarURL}
            alt={name}
          />
        ) : (
          <p
            className={`font-openSans font-bold text-zinc-800 ${
              isCompact ? "text-base" : "text-4xl"
            }`}>
            {name?.[0]?.toUpperCase()}
          </p>
        )}
      </div>
    </div>
  );
};

export default Avatar;
