import { useEffect, useState } from 'react';

export const useUIState = () => {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isFullSessionModalOpen, setIsFullSessionModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  

  
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);

      if (isMobile && !isFullSessionModalOpen) {
        setIsFullSessionModalOpen(true);
      } else if (!isMobile && isFullSessionModalOpen) {
        setIsFullSessionModalOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [isFullSessionModalOpen]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  return {
    showCompleteDialog,
    setShowCompleteDialog,
    isMobileView,
    isFullSessionModalOpen, 
    isImageModalOpen,
    setIsImageModalOpen,
    isMounted,
  };
}; 