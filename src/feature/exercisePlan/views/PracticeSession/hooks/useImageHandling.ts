import { useCallback, useEffect,useRef, useState } from 'react';

interface ImageHandlingOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  initialScale?: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

export const useImageHandling = ({ containerRef, initialScale = 1 }: ImageHandlingOptions) => {
  const [imageScale, setImageScale] = useState(initialScale);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({
    width: 0,
    height: 0,
  });
  
  // For drag functionality
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>();
  
  // For pinch-to-zoom and double-tap functionality
  const lastTap = useRef(0);
  const lastDistance = useRef(0);
  const initialTouchDistance = useRef(0);
  const initialScaleRef = useRef(imageScale);
  const isTouchZooming = useRef(false);
  const initialScaleApplied = useRef(false);

  const resetImagePosition = useCallback(() => {
    lastPosition.current = { x: 0, y: 0 };
    setImagePosition({ x: 0, y: 0 });
    setImageScale(initialScale);
  }, [initialScale]);

  const handleZoomIn = useCallback(() => {
    setImageScale((prev) => Math.min(prev + 0.5, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setImageScale((prev) => Math.max(prev - 0.5, 0.5));
  }, []);

  const calculateBounds = useCallback(
    (x: number, y: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const container = containerRef.current.getBoundingClientRect();
      const scaledWidth = imageDimensions.width * imageScale;
      const scaledHeight = imageDimensions.height * imageScale;

      const canMoveHorizontally = scaledWidth > container.width;
      const canMoveVertically = scaledHeight > container.height;

      // Calculate the maximum allowed movement
      const maxX = canMoveHorizontally
        ? (scaledWidth - container.width) / 2
        : 0;
      const maxY = canMoveVertically
        ? (scaledHeight - container.height) / 2
        : 0;

      // Constrain the position within bounds
      const boundedX = canMoveHorizontally
        ? Math.max(-maxX, Math.min(maxX, x))
        : 0;
      const boundedY = canMoveVertically
        ? Math.max(-maxY, Math.min(maxY, y))
        : 0;

      return { x: boundedX, y: boundedY };
    },
    [imageScale, imageDimensions, containerRef]
  );

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - lastPosition.current.x,
      y: e.clientY - lastPosition.current.y,
    };
  }, []);

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    animationFrame.current = requestAnimationFrame(() => {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      const { x, y } = calculateBounds(newX, newY);

      lastPosition.current = { x, y };
      setImagePosition({ x, y });
    });
  }, [isDragging, calculateBounds]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
  }, []);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });

    // Check if we're on a mobile device and set initial scale
    if (!initialScaleApplied.current) {
      const isMobile = window.innerWidth < 768;

      // For mobile: We need a much larger scale to make the image visible
      if (isMobile) {
        // Force a much higher scale for mobile visibility
        setImageScale(6.5); // Much higher default zoom for visibility
      } else {
        // For desktop: also increase default scale
        setImageScale(2.0);
      }
      initialScaleApplied.current = true;
    }
  }, []);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent browser defaults like scroll

    if (e.touches.length === 1) {
      // Single touch - for dragging
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX - lastPosition.current.x,
        y: e.touches[0].clientY - lastPosition.current.y,
      };

      // Handle double-tap to zoom
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        if (imageScale > 1.5) {
          resetImagePosition();
        } else {
          setImageScale(2);
          // Center on the tap position
          const touch = e.touches[0];
          if (containerRef.current) {
            const container = containerRef.current.getBoundingClientRect();
            const centerX =
              touch.clientX - container.left - container.width / 2;
            const centerY =
              touch.clientY - container.top - container.height / 2;
            const { x, y } = calculateBounds(-centerX, -centerY);
            setImagePosition({ x, y });
            lastPosition.current = { x, y };
          }
        }
      }
      lastTap.current = now;
    } else if (e.touches.length === 2) {
      // Two touches - for pinch zoom
      isTouchZooming.current = true;
      initialScaleRef.current = imageScale;

      // Calculate initial distance between two fingers
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialTouchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  }, [imageScale, resetImagePosition, calculateBounds, containerRef]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent browser defaults

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    animationFrame.current = requestAnimationFrame(() => {
      if (e.touches.length === 1 && !isTouchZooming.current) {
        // Single touch - handle dragging
        if (!isDragging) return;

        const touch = e.touches[0];
        const newX = touch.clientX - dragStart.current.x;
        const newY = touch.clientY - dragStart.current.y;

        const { x, y } = calculateBounds(newX, newY);
        lastPosition.current = { x, y };
        setImagePosition({ x, y });
      } else if (e.touches.length === 2) {
        // Two touches - handle pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Calculate current distance between fingers
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        // Determine the new scale based on the change in distance
        if (initialTouchDistance.current > 0) {
          const scaleFactor = currentDistance / initialTouchDistance.current;
          const newScale = Math.max(
            0.5,
            Math.min(3, initialScaleRef.current * scaleFactor)
          );

          // Calculate the midpoint between the two touches
          const midX = (touch1.clientX + touch2.clientX) / 2;
          const midY = (touch1.clientY + touch2.clientY) / 2;

          if (containerRef.current) {
            const container = containerRef.current.getBoundingClientRect();

            // Adjust pinch center point relative to the container
            const centerX = midX - container.left;
            const centerY = midY - container.top;

            // When zooming, we want to zoom toward the pinch center
            // This is a simplified version and might need fine-tuning
            const scaleChange = newScale / imageScale;
            const newPosX =
              (lastPosition.current.x - (centerX - container.width / 2)) *
                scaleChange +
              (centerX - container.width / 2);
            const newPosY =
              (lastPosition.current.y - (centerY - container.height / 2)) *
                scaleChange +
              (centerY - container.height / 2);

            const { x, y } = calculateBounds(newPosX, newPosY);

            setImageScale(newScale);
            setImagePosition({ x, y });
            lastPosition.current = { x, y };
          }
        }
      }
    });
  }, [isDragging, calculateBounds, imageScale, containerRef]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      // Reset pinch zoom state when fingers are lifted
      isTouchZooming.current = false;
    }

    if (e.touches.length === 0) {
      // All fingers lifted
      setIsDragging(false);
    }

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
  }, []);

  // Clean up animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  // Set initial scale for mobile devices
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;

      // Only set initial scale once when loading and if on mobile
      if (!initialScaleApplied.current) {
        if (isMobile) {
          // Default scale for mobile before image load - make it much larger
          setImageScale(6.5);
        } else {
          // Default scale for desktop before image load
          setImageScale(2.0);
        }
        initialScaleApplied.current = true;
      }
    };

    // Call once on mount
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    imageScale,
    imagePosition,
    isDragging,
    imageDimensions,
    handleZoomIn,
    handleZoomOut,
    resetImagePosition,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleImageLoad,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setImageScale
  };
}; 