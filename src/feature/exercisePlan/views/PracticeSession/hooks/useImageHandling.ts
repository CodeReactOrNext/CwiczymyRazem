import { useState } from 'react';

interface ImageHandlingOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  initialScale?: number;
}

export const useImageHandling = ({ containerRef, initialScale = 1 }: ImageHandlingOptions) => {
  const [imageScale, setImageScale] = useState(initialScale);
  
  const handleZoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const resetImagePosition = () => {
    setImageScale(initialScale);
  };

  return {
    imageScale,
    setImageScale,
    handleZoomIn,
    handleZoomOut,
    resetImagePosition,
  };
}; 