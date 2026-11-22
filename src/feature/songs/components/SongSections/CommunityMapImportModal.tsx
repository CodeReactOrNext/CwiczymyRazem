import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "assets/components/ui/alert-dialog";
import type { SongSectionMap } from "feature/songs/types/songSectionMap.type";
import { useTranslation } from "hooks/useTranslation";
import { Sparkles } from "lucide-react";

interface CommunityMapImportModalProps {
  map: SongSectionMap | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
}

export const CommunityMapImportModal = ({
  map,
  open,
  onOpenChange,
  onImport,
}: CommunityMapImportModalProps) => {
  const { t } = useTranslation("timer");

  if (!map) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-cyan-400' />
            <AlertDialogTitle className='font-display text-zinc-50'>
              {t("community_map.banner_title")}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className='leading-relaxed text-zinc-400'>
            {t("community_map.banner_description", {
              count: map.contributorCount,
            })}
          </AlertDialogDescription>
          <p className='text-xs leading-relaxed text-zinc-500'>
            {t("community_map.explainer")}
          </p>
          <p className='text-xs leading-relaxed text-zinc-500'>
            {t("community_map.disclaimer")}
          </p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("community_map.not_now")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onImport();
              onOpenChange(false);
            }}>
            {t("community_map.import")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
