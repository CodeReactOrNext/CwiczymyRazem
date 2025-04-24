/**
 * Utility functions for device detection
 */

export const isMobileDevice = (): boolean => {
  const userAgent = 
    typeof window !== 'undefined' && window.navigator.userAgent
      ? window.navigator.userAgent
      : '';
  
  const mobileRegex = 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent);
};

export const isIOSDevice = (): boolean => {
  const userAgent = 
    typeof window !== 'undefined' && window.navigator.userAgent
      ? window.navigator.userAgent
      : '';
  
  return /iPhone|iPad|iPod/i.test(userAgent);
}; 