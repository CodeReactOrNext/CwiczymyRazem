/**
 * INTEGRATION EXAMPLE
 *
 * Ten plik pokazuje jak zintegrować ScaleSelectionDialog
 * z istniejącym flow PracticeSession.
 *
 * Skopiuj odpowiednie fragmenty do swojego komponentu.
 */

import { useState, useEffect } from 'react';
import { ScaleSelectionDialog } from '../views/PracticeSession/components/ScaleSelectionDialog';
import type { Exercise } from '../types/exercise.types';

// ============================================
// PRZYKŁAD 1: Integracja w PracticeSession
// ============================================

interface PracticeSessionProps {
  initialExercise: Exercise;
}

export function PracticeSessionWithScales({ initialExercise }: PracticeSessionProps) {
  const [showScaleDialog, setShowScaleDialog] = useState(false);
  const [exercise, setExercise] = useState(initialExercise);

  // Wykryj czy to configurable scale exercise
  useEffect(() => {
    if (initialExercise.id === 'scale_practice_configurable') {
      setShowScaleDialog(true);
    } else {
      setExercise(initialExercise);
    }
  }, [initialExercise]);

  const handleScaleGenerated = (generatedExercise: Exercise) => {
    setExercise(generatedExercise);
    setShowScaleDialog(false);
    // Możesz tutaj dodać tracking/analytics
    console.log('Generated scale exercise:', generatedExercise.title);
  };

  const handleDialogClose = () => {
    setShowScaleDialog(false);
    // Opcjonalnie: powrót do wyboru ćwiczeń
  };

  return (
    <div>
      {/* Dialog wyboru skali */}
      <ScaleSelectionDialog
        isOpen={showScaleDialog}
        onClose={handleDialogClose}
        onExerciseGenerated={handleScaleGenerated}
      />

      {/* Normalny UI sesji praktyki */}
      {!showScaleDialog && (
        <div>
          <h1>{exercise.title}</h1>
          <p>{exercise.description}</p>

          {/* Twój istniejący UI - TablatureViewer, Timer, etc. */}
          {exercise.tablature && (
            <div>Tutaj tablatura...</div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// PRZYKŁAD 2: Standalone Scale Practice Page
// ============================================

export function ScalePracticePage() {
  const [showDialog, setShowDialog] = useState(true);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  const handleExerciseGenerated = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setShowDialog(false);
  };

  const handleReset = () => {
    setCurrentExercise(null);
    setShowDialog(true);
  };

  return (
    <div className="container mx-auto p-6">
      <ScaleSelectionDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onExerciseGenerated={handleExerciseGenerated}
      />

      {currentExercise && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{currentExercise.title}</h1>
            <button onClick={handleReset}>
              Zmień konfigurację
            </button>
          </div>

          <div className="space-y-4">
            <p>{currentExercise.description}</p>

            {/* Instructions */}
            <div>
              <h2>Instrukcje:</h2>
              <ul>
                {currentExercise.instructions.map((instr, i) => (
                  <li key={i}>{instr}</li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div>
              <h2>Wskazówki:</h2>
              <ul>
                {currentExercise.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* Tablature */}
            {currentExercise.tablature && (
              <div>
                <h2>Tablatura:</h2>
                {/* Twój TablatureViewer component */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PRZYKŁAD 3: Hook dla Scale Selection
// ============================================

export function useScaleExercise(initialExercise: Exercise) {
  const [showDialog, setShowDialog] = useState(false);
  const [exercise, setExercise] = useState(initialExercise);

  useEffect(() => {
    if (initialExercise.id === 'scale_practice_configurable') {
      setShowDialog(true);
    }
  }, [initialExercise]);

  const handleGenerated = (generated: Exercise) => {
    setExercise(generated);
    setShowDialog(false);
  };

  return {
    showScaleDialog: showDialog,
    currentExercise: exercise,
    handleScaleGenerated: handleGenerated,
    closeDialog: () => setShowDialog(false),
  };
}

// Użycie w komponencie:
// const { showScaleDialog, currentExercise, handleScaleGenerated, closeDialog } = useScaleExercise(exercise);

// ============================================
// PRZYKŁAD 4: Programowe generowanie (bez UI)
// ============================================

import { generateScaleExercise } from './scaleExerciseGenerator';

export function programmaticGeneration() {
  // Wygeneruj konkretną skalę bez dialogu
  const exercise = generateScaleExercise({
    rootNote: 'A',
    scaleType: 'minor_pentatonic',
    patternType: 'ascending',
    position: 1
  });

  // Użyj bezpośrednio w sesji
  return exercise;
}

// ============================================
// PRZYKŁAD 5: Multi-exercise (wiele skal w jednej sesji)
// ============================================

export function MultiScalePractice() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(true);

  const handleAddExercise = (exercise: Exercise) => {
    setExercises([...exercises, exercise]);
  };

  const handleStartPractice = () => {
    if (exercises.length > 0) {
      setShowDialog(false);
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentExercise = exercises[currentIndex];

  return (
    <div>
      {showDialog ? (
        <div>
          <ScaleSelectionDialog
            isOpen={true}
            onClose={() => {}}
            onExerciseGenerated={handleAddExercise}
          />
          <div>
            <p>Dodano ćwiczeń: {exercises.length}</p>
            <button onClick={handleStartPractice}>
              Rozpocznij praktykę
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2>{currentExercise?.title}</h2>
          <p>Ćwiczenie {currentIndex + 1} z {exercises.length}</p>
          <button onClick={handleNext}>Następne ćwiczenie</button>
        </div>
      )}
    </div>
  );
}
