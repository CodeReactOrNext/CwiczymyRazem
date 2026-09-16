import { Dialog, DialogContent, DialogTitle } from 'assets/components/ui/dialog';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

interface ZoomedImage {
  src: string;
  alt: string;
}

interface ZoomableImagesProps {
  children: ReactNode;
  className?: string;
}

/**
 * Click-to-zoom for the screenshots inside an article.
 *
 * Post bodies are compiled to static HTML at build time, so nothing inside them
 * hydrates and `PhotoBlock` cannot carry its own handler. The click is delegated
 * from this wrapper instead: any `[data-zoomable]` element in the subtree opens
 * the image it wraps at full size.
 */
export const ZoomableImages = ({ children, className }: ZoomableImagesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState<ZoomedImage | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const image = target?.closest('[data-zoomable]')?.querySelector('img');
      if (!image) return;
      setZoomed({ src: image.currentSrc || image.src, alt: image.alt });
    };

    container?.addEventListener('click', handleClick);
    return () => container?.removeEventListener('click', handleClick);
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children}

      <Dialog open={zoomed !== null} onOpenChange={(open) => !open && setZoomed(null)}>
        {zoomed && (
          <DialogContent className='left-1/2 top-1/2 h-auto max-w-[96vw] -translate-x-1/2 -translate-y-1/2 gap-0 border-0 bg-transparent p-0 shadow-none sm:max-w-5xl'>
            <DialogTitle className='sr-only'>{zoomed.alt}</DialogTitle>
            <img
              src={zoomed.src}
              alt={zoomed.alt}
              className='max-h-[88dvh] w-full rounded-lg object-contain'
            />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
