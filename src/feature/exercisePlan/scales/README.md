# Scale Practice System - Documentation

System do konfigurowalnej praktyki skal z dynamicznym generowaniem tablatur.

## Struktura

### 1. Core Files

- **scaleDefinitions.ts** - Definicje skal (Major, Minor, Pentatonic, Mody)
- **fretboardMapper.ts** - Mapowanie nut na gryf gitary
- **patternGenerators.ts** - Generatory wzorów ćwiczeń (ascending, descending, sequences)
- **scaleExerciseGenerator.ts** - Główny generator łączący wszystko

### 2. UI Components

- **ScaleSelectionDialog.tsx** - Dialog z dropdownami do wyboru skali/wzoru/pozycji

### 3. Exercise Integration

- **scalePractice.ts** - Specjalne "entry point" ćwiczenie

## Jak to działa

### 1. Generowanie ćwiczenia

```typescript
import { generateScaleExercise } from 'feature/exercisePlan/scales/scaleExerciseGenerator';

const exercise = generateScaleExercise({
  rootNote: 'C',
  scaleType: 'major',
  patternType: 'ascending',
  position: 1
});

// exercise zawiera pełną tablaturę wygenerowaną dynamicznie
```

### 2. Dostępne opcje

**Root Notes:** C, C#, D, D#, E, F, F#, G, G#, A, A#, B

**Scale Types:**
- Basic: `major`, `minor`, `minor_pentatonic`, `major_pentatonic`
- Modes: `ionian`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `aeolian`, `locrian`

**Pattern Types:**
- `ascending` - W górę
- `descending` - W dół
- `ascending_descending` - W górę i w dół
- `sequence_3_notes` - Sekwencja 1-2-3, 2-3-4, 3-4-5...
- `sequence_4_notes` - Sekwencja 1-2-3-4, 2-3-4-5...

**Positions:** 1-12 (pozycja na gryfie, gdzie 1 = próg 0-4, 2 = próg 1-5, etc.)

## Integracja z UI

### Krok 1: Wykrywanie configurable exercise

W komponencie `PracticeSession.tsx` lub gdzie rozpoczynasz ćwiczenie, dodaj logikę:

```typescript
import { ScaleSelectionDialog } from './components/ScaleSelectionDialog';

function PracticeSession({ exercise }) {
  const [showScaleDialog, setShowScaleDialog] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(exercise);

  useEffect(() => {
    // Wykryj czy to configurable scale exercise
    if (exercise.id === 'scale_practice_configurable') {
      setShowScaleDialog(true);
    }
  }, [exercise]);

  const handleScaleGenerated = (generatedExercise: Exercise) => {
    setCurrentExercise(generatedExercise);
    // Kontynuuj normalny flow z wygenerowanym ćwiczeniem
  };

  return (
    <>
      <ScaleSelectionDialog
        isOpen={showScaleDialog}
        onClose={() => setShowScaleDialog(false)}
        onExerciseGenerated={handleScaleGenerated}
      />

      {/* Normalny UI sesji praktyki */}
      {currentExercise.tablature && (
        <TablatureViewer tablature={currentExercise.tablature} />
      )}
    </>
  );
}
```

### Krok 2: Dodanie do Challenge

Exercise `scalePracticeExercise` jest już dodane do:
- `exercisesAgregat.ts`
- `staticChallenges.ts` (challenge `pentatonic_5_days`)

## Rozszerzanie

### Dodanie nowej skali

W `scaleDefinitions.ts`:

```typescript
export type ScaleType =
  | 'existing_scales...'
  | 'harmonic_minor'; // dodaj nowy typ

export const scaleDefinitions: Record<ScaleType, ScaleDefinition> = {
  // ... existing scales
  harmonic_minor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: 'Minor scale with raised 7th. Exotic, classical sound.'
  }
};
```

### Dodanie nowego wzoru

W `patternGenerators.ts`:

```typescript
export type PatternType =
  | 'existing_patterns...'
  | 'intervals_sixths';

// Dodaj funkcję generatora
function generateIntervalSixths(positions: FretPosition[], noteDuration: number): TablatureBeat[] {
  // implementacja
}

// Dodaj do switcha w generatePattern()
```

## Przykłady użycia

### Przykład 1: C Major, pozycja 5, ascending

```typescript
const exercise = generateScaleExercise({
  rootNote: 'C',
  scaleType: 'major',
  patternType: 'ascending',
  position: 5
});
```

### Przykład 2: A Minor Pentatonic, pozycja 1, sequences

```typescript
const exercise = generateScaleExercise({
  rootNote: 'A',
  scaleType: 'minor_pentatonic',
  patternType: 'sequence_3_notes',
  position: 1
});
```

### Przykład 3: D Dorian, pozycja 7, up & down

```typescript
const exercise = generateScaleExercise({
  rootNote: 'D',
  scaleType: 'dorian',
  patternType: 'ascending_descending',
  position: 7
});
```

## Uwagi techniczne

- Tablatura generowana jest dynamicznie na podstawie pozycji i wzoru
- System automatycznie dzieli nuty na takty (4/4)
- Tempo dostosowuje się do trudności wzoru
- Każde ćwiczenie ma unikalne ID bazowane na konfiguracji
- Pozycje są mapowane do rzeczywistych progów na gryfie

## TODO / Future Enhancements

- [ ] Dodać więcej zaawansowanych skal (Harmonic Minor, Melodic Minor, etc.)
- [ ] Dodać pattern: intervals_fifths, intervals_octaves
- [ ] Dodać CAGED system visualization
- [ ] Dodać audio playback preview w dialogu
- [ ] Zapisywanie ulubionych konfiguracji użytkownika
- [ ] Historia ostatnio ćwiczonych skal
