import { useEffect, useRef, useState } from "react";

interface MountOnVisibleProps {
  children: React.ReactNode;
  /** Rendered until the container scrolls near the viewport. */
  placeholder?: React.ReactNode;
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
      { rootMargin: "300px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : placeholder}
    </div>
  );
};
