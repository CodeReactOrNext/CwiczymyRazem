import { useEffect, useState, useMemo } from "react";

import { isMobileDevice } from "../utils/deviceDetection";
import { useMetronome } from "./useMetronome";
import { useMobileMetronome } from "./useMobileMetronome";

interface UseDeviceMetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  recommendedBpm?: number;
  isMuted?: boolean;
  speedMultiplier?: number;
  onTick?: () => void;
  /** Shared AudioContext — forwarded to the underlying metronome hook (e.g. AlphaTab's context). */
  externalAudioContext?: AudioContext | null;
}

export const useDeviceMetronome = (props: UseDeviceMetronomeProps) => {
  // Use useState to ensure the device detection only runs once on component mount
  const [isMobile] = useState(() => isMobileDevice());

  // Use the appropriate hook based on device type
  const mobileMetronome = useMobileMetronome({ ...props, enabled: isMobile });
  const desktopMetronome = useMetronome({ ...props, enabled: !isMobile });

  // On mobile, we need to initialize audio on the first user interaction
  useEffect(() => {
    if (isMobile) {
      const handleUserInteraction = () => {
        if (!mobileMetronome.audioInitialized) {
          mobileMetronome.initializeAudio();
        }
      };

      // Add event listeners for common user interactions
      const events = ["touchstart", "mousedown", "keydown"];
      events.forEach(event => {
        document.addEventListener(event, handleUserInteraction, { once: true });
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserInteraction);
        });
      };
    }
  }, [isMobile, mobileMetronome]);

  return useMemo(() => (isMobile ? mobileMetronome : desktopMetronome), [isMobile, mobileMetronome, desktopMetronome]);
}; 