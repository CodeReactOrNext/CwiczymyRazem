import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, Check, Square, Volume2, X } from "lucide-react";

import { Strip } from "./SessionVerdict";

interface EarRiddleStripProps {
  isGuessed: boolean;
  isMicEnabled: boolean;
  isPlaying: boolean;
  onReplay: () => void;
  onGuessed: () => void;
  onNext: () => void;
}

/** A Play by Ear melody whose answer is up, over the session bar: solved by the
 *  mic, or revealed and left to the player to mark. */
export const EarRiddleStrip = ({ isGuessed, isMicEnabled, isPlaying, onReplay, onGuessed, onNext }: EarRiddleStripProps) => {
  const { t } = useTranslation("session");
  return (
    <Strip
      wrapDetail
      tone={isGuessed ? "good" : "plain"}
      title={isGuessed ? t("ear.correct") : t("ear.revealed")}
      detail={isGuessed ? (isMicEnabled ? t("ear.next_melody") : t("ear.tab_shows")) : t("ear.self_marked_note")}>
      <Button
        variant='secondary'
        size='lg'
        className='px-4'
        onClick={onReplay}
        aria-label={isPlaying ? t("quiz.stop") : t("ear.replay_melody")}>
        {isPlaying ? <Square /> : <Volume2 />}
      </Button>
      {isGuessed ? (
        <Button size='lg' onClick={onNext}>
          {t("ear.next_melody_key")} <ArrowRight />
        </Button>
      ) : (
        <>
          <Button variant='secondary' size='lg' className='px-4 sm:px-6' onClick={onNext}>
            <X /> {t("ear.missed_it")}
          </Button>
          <Button size='lg' className='px-4 sm:px-6' onClick={() => { onGuessed(); onNext(); }}>
            <Check /> <span>{t("ear.had_it")}&nbsp;+1</span>
          </Button>
        </>
      )}
    </Strip>
  );
};
