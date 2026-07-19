import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { RippleButton } from "hooks/useRipple";
import {
  Bug,
  Globe,
  Headphones,
  Mic,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Volume2,
} from "lucide-react";
import { useState } from "react";

// localStorage keys the app uses for mic/calibration state. Clearing these
// returns the microphone setup to a clean slate without touching anything else.
const MIC_STORAGE_KEYS = [
  "guitar_calibration_data",
  "mic_tracking_enabled",
  "guitar_playback_enabled",
];

interface TroubleshootingTip {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const TIPS: TroubleshootingTip[] = [
  {
    icon: ShieldCheck,
    title: "Allow microphone access",
    description:
      'Click the lock / mic icon in your browser\'s address bar and make sure this site is allowed to use the microphone. If you accidentally blocked it, switch it back to "Allow" and reload the page.',
  },
  {
    icon: Mic,
    title: "Pick the right input device",
    description:
      "If you have several mics or an audio interface, set the correct one as the default input in your system sound settings (and in the browser's site permissions), then reload.",
  },
  {
    icon: Headphones,
    title: "Free up the microphone",
    description:
      "Close other apps that might be holding the mic — Zoom, Discord, OBS, Teams, or another browser tab. Only one app can capture a low-latency input at a time.",
  },
  {
    icon: RotateCcw,
    title: "Recalibrate",
    description:
      'Use the Recalibrate button to re-run the tuning calibration. This fixes most "notes not detected" or "wrong note" problems after changing gear or rooms.',
  },
  {
    icon: Volume2,
    title: "Check levels & tuning",
    description:
      "Make sure your guitar is in tune and loud enough. Move closer to the mic, raise the input gain, and reduce background noise. Very quiet or distorted signals are hard to detect.",
  },
  {
    icon: ShieldCheck,
    title: "Check OS privacy settings",
    description:
      "On Windows: Settings → Privacy & security → Microphone, and allow your browser. On macOS: System Settings → Privacy & Security → Microphone. The browser must be enabled there too.",
  },
  {
    icon: Trash2,
    title: "Clear cookies & site data",
    description:
      "Stale permissions or cached data can break capture. Clear cookies and site data for this site in your browser settings, then reload and allow the mic again. (Use the reset button below to clear this app's saved mic setup.)",
  },
  {
    icon: Globe,
    title: "Try another browser",
    description:
      "Chrome and Edge have the most reliable audio capture. Some browsers throttle or block the mic in background tabs or on insecure connections — keep this tab focused and on https.",
  },
];

interface MicTroubleshootingProps {
  /** Render style: matches the surrounding mic controls toolbar. */
  compact?: boolean;
  className?: string;
}

/** The troubleshooting dialog alone — for callers that provide their own trigger (e.g. a menu item). */
export const MicTroubleshootingDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [didReset, setDidReset] = useState(false);

  const handleResetMicSettings = () => {
    try {
      MIC_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      /* ignore storage errors */
    }
    setDidReset(true);
    // Reload so the session re-initialises the mic from a clean state.
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='z-[99999999] !flex max-h-[100dvh] flex-col sm:max-h-[85vh] sm:max-w-lg'>
        <DialogHeader className='shrink-0'>
          <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 text-emerald-400'>
            <Mic className='h-6 w-6' />
          </div>
          <DialogTitle className='text-center text-xl'>
            Microphone Troubleshooting
          </DialogTitle>
          <DialogDescription className='pt-1 text-center leading-relaxed text-zinc-400'>
            If the app can&apos;t hear your guitar or detects the wrong notes,
            work through these steps. Most issues come from browser permissions
            or another app using the mic.
          </DialogDescription>
        </DialogHeader>

        <ul className='mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1'>
          {TIPS.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <li
                key={idx}
                className='flex gap-3 rounded-lg bg-zinc-900/60 p-3'>
                <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-300'>
                  <Icon className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-zinc-100'>
                    {tip.title}
                  </p>
                  <p className='text-xs leading-relaxed text-zinc-400'>
                    {tip.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <DialogFooter className='flex shrink-0 flex-col gap-2 pt-4 sm:flex-col sm:gap-2'>
          <Button
            onClick={handleResetMicSettings}
            disabled={didReset}
            variant='destructive'
            className='w-full font-bold'>
            <RotateCcw className='mr-2 h-4 w-4' />
            {didReset ? "Resetting…" : "Reset mic settings & reload"}
          </Button>
          <p className='text-center text-[10px] text-zinc-500'>
            Clears this app&apos;s saved calibration and mic preferences, then
            reloads the page.
          </p>
          <Button
            variant='ghost'
            onClick={() => onOpenChange(false)}
            className='w-full text-zinc-500 hover:text-zinc-300'>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const MicTroubleshooting = ({
  compact = false,
  className,
}: MicTroubleshootingProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {compact ? (
        <RippleButton
          onClick={() => setIsOpen(true)}
          title='Microphone troubleshooting'
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-all hover:text-white active:scale-90",
            className,
          )}>
          <Bug className='h-3 w-3' />
        </RippleButton>
      ) : (
        <RippleButton
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 transition-colors hover:text-zinc-200",
            className,
          )}>
          <Bug className='h-3.5 w-3.5' />
          Mic not working?
        </RippleButton>
      )}

      <MicTroubleshootingDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
