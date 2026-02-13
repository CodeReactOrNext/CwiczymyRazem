# 🎸 System Praktyki Skal - Kompletny System

## ✅ Co zostało stworzone

Zbudowałem kompletny system do konfigurowalnej praktyki skal z dynamicznym generowaniem tablatur.

### 📁 Struktura plików

```
src/feature/exercisePlan/
├── scales/
│   ├── scaleDefinitions.ts          # Definicje skal (Major, Minor, Modes)
│   ├── fretboardMapper.ts           # Mapowanie nut na gryf
│   ├── patternGenerators.ts         # Generatory wzorów ćwiczeń
│   ├── scaleExerciseGenerator.ts    # Główny generator
│   ├── README.md                     # Dokumentacja techniczna
│   └── INTEGRATION_EXAMPLE.tsx       # Przykłady integracji
├── views/PracticeSession/components/
│   └── ScaleSelectionDialog.tsx     # Dialog z dropdownami
└── data/exerises/scalePractice/
    └── scalePractice.ts             # Entry point exercise
```

## 🎯 Funkcjonalności

### 1. Wybór Skali
- **Podstawowe:** Major, Minor, Minor Pentatonic, Major Pentatonic
- **Mody:** Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian
- **Root notes:** C, C#, D, D#, E, F, F#, G, G#, A, A#, B

### 2. Wzory Ćwiczeń
- **Ascending** - W górę po skali
- **Descending** - W dół po skali
- **Up & Down** - W górę i z powrotem
- **3-Note Sequence** - Sekwencje 1-2-3, 2-3-4, 3-4-5...
- **4-Note Sequence** - Sekwencje 1-2-3-4, 2-3-4-5...

### 3. Pozycje na Gryfie
- 12 pozycji (1-12)
- Każda pozycja pokrywa 5 progów
- Pozycja 1 = progi 0-4, Pozycja 5 = progi 4-8, etc.

### 4. Dynamiczne Generowanie
- Tablatura generowana automatycznie
- Instrukcje dostosowane do skali i wzoru
- Tempo dostosowane do trudności
- Unikalne ID dla każdej kombinacji

## 🚀 Jak używać

### Dla użytkownika (UI):

1. Wybierz exercise "Scale Practice (Configurable)" w challenges
2. Pojawi się dialog z opcjami:
   - **Root Note** - wybierz nutę bazową
   - **Scale Type** - wybierz typ skali (z opisem)
   - **Pattern** - wybierz wzór ćwiczenia
   - **Position** - wybierz pozycję na gryfie
3. Kliknij "Rozpocznij ćwiczenie"
4. System automatycznie wygeneruje tablaturę

### Dla programisty (API):

```typescript
import { generateScaleExercise } from 'feature/exercisePlan/scales/scaleExerciseGenerator';

const exercise = generateScaleExercise({
  rootNote: 'A',
  scaleType: 'minor_pentatonic',
  patternType: 'ascending',
  position: 1
});

// exercise.tablature zawiera pełną, wygenerowaną tablaturę
// exercise.instructions zawiera dostosowane instrukcje
// exercise.tips zawiera wskazówki dla danej skali
```

## 🔧 Integracja z istniejącym kodem

### Krok 1: Wykryj configurable exercise

W pliku gdzie startujesz sesję praktyki (np. `PracticeSession.tsx`):

```typescript
import { ScaleSelectionDialog } from './components/ScaleSelectionDialog';

const [showScaleDialog, setShowScaleDialog] = useState(false);
const [currentExercise, setCurrentExercise] = useState(initialExercise);

useEffect(() => {
  if (initialExercise.id === 'scale_practice_configurable') {
    setShowScaleDialog(true);
  }
}, [initialExercise]);

const handleScaleGenerated = (generatedExercise: Exercise) => {
  setCurrentExercise(generatedExercise);
  setShowScaleDialog(false);
};
```

### Krok 2: Dodaj dialog do render

```tsx
<ScaleSelectionDialog
  isOpen={showScaleDialog}
  onClose={() => setShowScaleDialog(false)}
  onExerciseGenerated={handleScaleGenerated}
/>
```

### Krok 3: Użyj wygenerowanego exercise

```tsx
{currentExercise.tablature && (
  <TablatureViewer tablature={currentExercise.tablature} />
)}
```

Pełne przykłady znajdziesz w pliku: `src/feature/exercisePlan/scales/INTEGRATION_EXAMPLE.tsx`

## 📊 Gdzie jest używane

### 1. Exercise Agregat
```typescript
// src/feature/exercisePlan/data/exercisesAgregat.ts
import { scalePracticeExercise } from "...";
// Dodane do listy ćwiczeń
```

### 2. Challenges
```typescript
// src/feature/challenges/.../staticChallenges.ts
// Challenge: "Interval Map Discovery" (pentatonic_5_days)
exercises: [scalePracticeExercise]
```

## 🎓 Przykłady użycia

### Przykład 1: A Minor Pentatonic, Position 1
Najbardziej podstawowa skala dla początkujących

```typescript
generateScaleExercise({
  rootNote: 'A',
  scaleType: 'minor_pentatonic',
  patternType: 'ascending',
  position: 1
});
```

### Przykład 2: C Major, Position 5, Sequences
Bardziej zaawansowane ćwiczenie

```typescript
generateScaleExercise({
  rootNote: 'C',
  scaleType: 'major',
  patternType: 'sequence_3_notes',
  position: 5
});
```

### Przykład 3: D Dorian, Position 7
Jazz/fusion sound

```typescript
generateScaleExercise({
  rootNote: 'D',
  scaleType: 'dorian',
  patternType: 'ascending_descending',
  position: 7
});
```

## 🔮 Możliwe rozszerzenia

### Łatwe do dodania:
- Więcej skal (Harmonic Minor, Melodic Minor, Diminished, Whole Tone)
- Więcej wzorów (Intervals: fifths, sixths, octaves)
- Zapisywanie ulubionych konfiguracji
- Historia ostatnio ćwiczonych skal

### Zaawansowane:
- CAGED system visualization
- Audio playback preview
- Auto-detection of played notes (compare with expected)
- Progress tracking per scale/position
- Recommendation system (which scales to practice next)

## 📝 Dodawanie nowych skal

### 1. Dodaj typ w `scaleDefinitions.ts`:
```typescript
export type ScaleType =
  | 'major'
  | 'harmonic_minor'; // NOWY TYP

export const scaleDefinitions: Record<ScaleType, ScaleDefinition> = {
  // ... existing
  harmonic_minor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: 'Minor with raised 7th. Exotic, classical sound.'
  }
};
```

### 2. Automatycznie pojawi się w UI!
Dialog automatycznie wykryje nową skalę i doda ją do listy wyboru.

## 📝 Dodawanie nowych wzorów

### 1. Dodaj typ w `patternGenerators.ts`:
```typescript
export type PatternType =
  | 'ascending'
  | 'intervals_fifths'; // NOWY WZÓR
```

### 2. Dodaj funkcję generatora:
```typescript
function generateIntervalFifths(positions: FretPosition[], noteDuration: number): TablatureBeat[] {
  const beats: TablatureBeat[] = [];
  for (let i = 0; i < positions.length - 4; i++) {
    beats.push({
      duration: noteDuration,
      notes: [{ string: positions[i].string, fret: positions[i].fret }]
    });
    beats.push({
      duration: noteDuration,
      notes: [{ string: positions[i + 4].string, fret: positions[i + 4].fret }]
    });
  }
  return beats;
}
```

### 3. Dodaj do switch w `generatePattern()`:
```typescript
case 'intervals_fifths':
  beats = generateIntervalFifths(positions, noteDuration);
  break;
```

### 4. Dodaj nazwę w `getPatternName()`:
```typescript
const names: Record<PatternType, string> = {
  // ... existing
  intervals_fifths: 'Fifths (kwinty)'
};
```

## 🎯 Kluczowe zalety systemu

1. **Dynamiczne generowanie** - Nie musisz ręcznie tworzyć tablatur
2. **Skalowalne** - Łatwo dodawać nowe skale i wzory
3. **Elastyczne** - Może być używane w challenges lub standalone
4. **User-friendly** - Prosty dialog z dropdownami
5. **Type-safe** - Pełne wsparcie TypeScript

## 🐛 Testowanie

### Test 1: Podstawowe generowanie
```typescript
const exercise = generateScaleExercise({
  rootNote: 'C',
  scaleType: 'major',
  patternType: 'ascending',
  position: 1
});

console.log(exercise.title); // "C Major (Ionian) - Ascending (w górę)"
console.log(exercise.tablature.length); // Powinno być kilka measure
```

### Test 2: Dialog UI
1. Otwórz challenge z `scalePracticeExercise`
2. Sprawdź czy dialog się pojawia
3. Wybierz różne opcje i zobacz czy tablatura się generuje

### Test 3: Różne kombinacje
Przetestuj różne kombinacje root note / scale / pattern / position.

## 📞 Support

Jeśli masz pytania lub problemy:
1. Sprawdź `README.md` w folderze `scales/`
2. Zobacz przykłady w `INTEGRATION_EXAMPLE.tsx`
3. Zweryfikuj że wszystkie importy są poprawne

## ✨ Podsumowanie

System jest **gotowy do użycia**!

Główne komponenty:
- ✅ Backend: Generatory skal, wzorów i tablatur
- ✅ Frontend: Dialog z dropdownami
- ✅ Integration: Exercise dodane do agregatu i challenges
- ✅ Documentation: Pełna dokumentacja i przykłady

Możesz teraz:
1. Używać w challenges (już dodane do `pentatonic_5_days`)
2. Używać standalone (stwórz dedykowaną stronę)
3. Rozszerzać o nowe skale i wzory
4. Dostosować UI do własnych potrzeb

**Enjoy practicing scales!** 🎸🎵
