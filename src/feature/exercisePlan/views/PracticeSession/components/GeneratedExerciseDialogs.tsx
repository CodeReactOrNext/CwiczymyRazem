import { ChordSelectionDialog } from './ChordSelectionDialog';
import { ScaleSelectionDialog } from './ScaleSelectionDialog';

interface GeneratedExerciseDialogsProps {
  showScaleDialog: boolean;
  setShowScaleDialog: (show: boolean) => void;
  showChordDialog: boolean;
  setShowChordDialog: (show: boolean) => void;
  onExerciseGenerated: (exercise: any) => void;
}

export const GeneratedExerciseDialogs = ({
  showScaleDialog,
  setShowScaleDialog,
  showChordDialog,
  setShowChordDialog,
  onExerciseGenerated,
}: GeneratedExerciseDialogsProps) => {
  return (
    <>
      <ScaleSelectionDialog
        isOpen={showScaleDialog}
        onClose={() => setShowScaleDialog(false)}
        onExerciseGenerated={onExerciseGenerated}
      />
      <ChordSelectionDialog
        isOpen={showChordDialog}
        onClose={() => setShowChordDialog(false)}
        onExerciseGenerated={onExerciseGenerated}
      />
    </>
  );
};
