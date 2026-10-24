import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { Flame, Mail, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

interface EmailConsentModalProps {
  isOpen: boolean;
  /** A Google sign-up from today hears "before you start", not "we never asked". */
  isNewAccount: boolean;
  onAnswer: (granted: boolean) => void;
  /** Closed without an answer — asked again on the next visit. */
  onClose: () => void;
}

// Same order, icons and colours as the toggles in Settings.
const EMAILS = [
  {
    key: "streakReminders",
    icon: Flame,
    iconClass: "bg-orange-500/10 text-orange-500",
  },
  {
    key: "seasonUpdates",
    icon: Trophy,
    iconClass: "bg-cyan-500/10 text-cyan-500",
  },
  {
    key: "productUpdates",
    icon: Sparkles,
    iconClass: "bg-zinc-800/60 text-zinc-400",
  },
] as const;

export const EmailConsentModal = ({
  isOpen,
  isNewAccount,
  onAnswer,
  onClose,
}: EmailConsentModalProps) => {
  const { t } = useTranslation("settings");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Above the mobile bottom nav (z-[100]), which would cover the buttons. */}
      <DialogContent
        overlayClassName='z-[120]'
        className='z-[120] border-none bg-zinc-950 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-zinc-100 shadow-none [align-content:safe_center] sm:max-w-md sm:p-8'>
        <div className='flex flex-col gap-6'>
          <div className='flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/10'>
            <Mail className='h-5 w-5 text-cyan-400' />
          </div>

          <div className='space-y-3'>
            <DialogTitle className='font-sans text-xl font-semibold leading-snug text-zinc-100'>
              {t("email_consent.title")}
            </DialogTitle>
            <DialogDescription className='space-y-2 text-sm leading-relaxed text-zinc-400'>
              <span className='block'>
                {t(
                  isNewAccount
                    ? "email_consent.intro_new"
                    : "email_consent.intro",
                )}
              </span>
              <span className='block'>{t("email_consent.privacy")}</span>
            </DialogDescription>
          </div>

          <div className='space-y-4'>
            <p className='text-sm font-medium text-zinc-200'>
              {t("email_consent.list_label")}
            </p>
            <ul className='space-y-4'>
              {EMAILS.map(({ key, icon: Icon, iconClass }) => (
                <li key={key} className='flex items-start gap-3'>
                  <div className={cn("shrink-0 rounded p-2", iconClass)}>
                    <Icon className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-zinc-200'>
                      {t(`email_notifications.options.${key}.title`)}
                    </p>
                    <p className='text-sm text-zinc-400'>
                      {t(`email_notifications.options.${key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className='text-xs leading-relaxed text-zinc-400'>
            <Interpolate
              text={t("email_consent.change_later")}
              values={{
                settings: (
                  <Link
                    href='/settings?tab=notifications'
                    onClick={onClose}
                    className='text-zinc-200 underline underline-offset-2 transition-colors hover:text-white'>
                    {t("email_consent.settings_link")}
                  </Link>
                ),
              }}
            />
          </p>

          <div className='flex flex-col gap-3 sm:flex-row-reverse sm:gap-2'>
            <Button
              size='lg'
              onClick={() => onAnswer(true)}
              className='h-12 px-4 font-semibold sm:h-10 sm:flex-1'>
              {t("email_consent.accept")}
            </Button>
            <Button
              size='lg'
              variant='secondary'
              onClick={() => onAnswer(false)}
              className='h-12 px-4 font-semibold sm:h-10 sm:flex-1'>
              {t("email_consent.decline")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
