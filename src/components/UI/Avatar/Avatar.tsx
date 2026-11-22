/* eslint-disable @next/next/no-img-element */
import { cn } from "assets/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Always a circle — the size only scales it. Spans, not divs, so it can sit in
 * a line of text (a `<p>`, a link). Keep the two-element structure: some
 * callers resize the inner circle with `[&>span]:` selectors (`AVATAR_SHRINK`).
 */
const avatarVariants = cva(
  "relative z-10 flex items-center justify-center overflow-hidden rounded-full",
  {
    variants: {
      size: {
        // Inline, next to a line of text (owner of a playlist, a backer).
        "2xs": "h-5 w-5",
        xs: "h-8 w-8",
        sm: "h-10 w-10",
        md: "h-12 w-12",
        lg: "h-14 w-14",
        xl: "h-16 w-16",
        default: "h-20 w-20",
        "2xl": "h-32 w-32",
      },
    },
    defaultVariants: { size: "default" },
  },
);

const initialVariants = cva("font-bold leading-none text-zinc-200", {
  variants: {
    size: {
      "2xs": "text-[11px]",
      xs: "text-sm",
      sm: "text-base",
      md: "text-lg",
      lg: "text-xl",
      xl: "text-2xl",
      default: "text-4xl",
      "2xl": "text-4xl",
    },
  },
  defaultVariants: { size: "default" },
});

export type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>["size"]>;

interface AvatarProps {
  name: string;
  avatarURL?: string;
  size?: AvatarSize;
  className?: string;
}

const Avatar = ({ name, avatarURL, size, className }: AvatarProps) => (
  <span className={cn("relative inline-block", className)}>
    <span
      className={cn(
        avatarVariants({ size }),
        // The fill is only for the initial: behind a photo it leaks through the
        // anti-aliased edge of the clip and draws a pale, ragged hairline round it.
        !avatarURL && "bg-zinc-700",
      )}>
      {avatarURL ? (
        <img
          referrerPolicy='no-referrer'
          className='h-full w-full object-cover'
          src={avatarURL}
          alt={name}
        />
      ) : (
        <span className={initialVariants({ size })}>
          {name?.[0]?.toUpperCase()}
        </span>
      )}
    </span>
  </span>
);

export default Avatar;
