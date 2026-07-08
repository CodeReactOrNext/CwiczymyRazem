import { Slot } from "@radix-ui/react-slot";
import { cn } from "assets/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex font-openSans items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary  text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-transparen shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, onClick, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<
      { id: number; x: number; y: number }[]
    >([]);
    const rippleId = React.useRef(0);

    const content = (
      <span className="flex items-center justify-center">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </span>
    );

    // asChild renders the consumer's element (e.g. a Link) — Slot needs a single
    // child, so we pass through untouched without the click effects.
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...({ disabled: disabled || loading, onClick, ...props } as any)}>
          {content}
        </Slot>
      );
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setRipples((prev) => [
        ...prev,
        { id: rippleId.current++, x: e.clientX - rect.left, y: e.clientY - rect.top },
      ]);
      onClick?.(e);
    };

    return (
      <motion.button
        className={cn("relative", buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        {...(props as any)}>
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <AnimatePresence>
            {ripples.map((r) => (
              <motion.span
                key={r.id}
                initial={{ scale: 0, opacity: 0.35 }}
                animate={{ scale: 4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                onAnimationComplete={() =>
                  setRipples((prev) => prev.filter((p) => p.id !== r.id))
                }
                style={{ left: r.x, top: r.y }}
                className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
              />
            ))}
          </AnimatePresence>
        </span>
        {content}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
