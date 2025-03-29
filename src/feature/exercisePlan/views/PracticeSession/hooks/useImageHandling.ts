import { useState } from 'react';


export const useImageHandling = () => {
  const [imageScale, setImageScale] = useState(1);
  
  const handleZoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const resetImagePosition = () => {
    setImageScale(1);
  };

  return {
    imageScale,
    setImageScale,
    handleZoomIn,
    handleZoomOut,
    resetImagePosition,
  };
}; 