import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Search, X } from "lucide-react";
import * as React from "react";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Shows an X on the right while the field has a value. */
  onClear?: () => void;
  /** aria-label of the clear button. */
  clearLabel?: string;
  /** Classes for the wrapper (width, margins, flex). `className` goes to the input. */
  containerClassName?: string;
  /** Left icon; the magnifier unless a field searches something specific. */
  icon?: LucideIcon;
  /** Extra classes for the left icon, e.g. `animate-spin` on a loader. */
  iconClassName?: string;
}

/**
 * The one search field of the app: the base Input at h-10 with a grey
 * magnifier on the left and, when `onClear` is given and there's a value, a
 * small clear key on the right.
 */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      containerClassName,
      onClear,
      clearLabel,
      value,
      type = "search",
      icon: Icon = Search,
      iconClassName,
      ...props
    },
    ref
  ) => {
    const showClear =
      !!onClear && value !== undefined && value !== null && `${value}` !== "";

    return (
      <div className={cn("relative w-full", containerClassName)}>
        <Icon
          aria-hidden='true'
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-500",
            iconClassName
          )}
        />
        <Input
          ref={ref}
          type={type}
          value={value}
          className={cn(
            "h-10 pl-10 [&::-webkit-search-cancel-button]:appearance-none",
            showClear && "pr-10",
            className
          )}
          {...props}
        />
        {showClear && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={clearLabel}
            onClick={onClear}
            className='absolute right-1.5 top-1/2 z-10 -translate-y-1/2'>
            <X />
          </Button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
