import { useEffect, useRef, useState } from "react";

interface MountOnVisibleProps {
  children: React.ReactNode;
  /** Rendered until the container scrolls near the viewport. */
  placeholder?: React.ReactNode;
  /**
   * Fixed height of the container in px. Both the placeholder and the mounted
   * children live inside a box of exactly this height, so the swap — and any
   * async growth inside the children afterwards — cannot change the page's
   * height. Without it, an embed that renders taller than its placeholder
   * shifts the whole article below it, mid-scroll, seconds after it mounted.
   */
  reserveHeightPx?: number;
  className?: string;
}

/**
 * Defers mounting heavy children (canvas tab viewers spawn a Web Worker each)
 * until the container approaches the viewport, so a page with 10+ embedded
 * exercises doesn't boot every viewer on load.
 */
export const MountOnVisible = ({
  children,
  placeholder = null,
  reserveHeightPx,
  className,
}: MountOnVisibleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  // Always starts hidden so the first client render matches the server-rendered
  // placeholder — checking `typeof IntersectionObserver` during render instead
  // (it differs between server and browser) caused a hydration mismatch.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={className}
      style={reserveHeightPx ? { height: reserveHeightPx } : undefined}>
      {visible ? children : placeholder}
    </div>
  );
};
