# Dashboard Layout Components

Spójny system komponentów do tworzenia eleganckich dashboardów.

## DashboardContainer

Główny kontener dla całej strony dashboard.

```tsx
import { DashboardContainer } from 'components/Layout';

<DashboardContainer>
  {/* Twoje sekcje */}
</DashboardContainer>
```

**Props:**
- `children: ReactNode` - zawartość
- `className?: string` - dodatkowe klasy CSS

**Funkcje:**
- Automatyczne animacje wejścia/wyjścia
- Responsywny padding
- Spójne tło i zaokrąglenia

## DashboardSection

Komponent sekcji z nagłówkiem, ikoną i zawartością.

```tsx
import { DashboardSection } from 'components/Layout';

<DashboardSection
  title="Statystyki"
  subtitle="Twój postęp w nauce"
  color="cyan"
  compact
  action={<button>Akcja</button>}
>
  {/* Zawartość sekcji */}
</DashboardSection>
```

**Props:**
- `title: string` - tytuł sekcji
- `subtitle?: string` - opcjonalny podtytuł
- `color: SectionColor` - kolor sekcji (cyan, yellow, green, violet, purple, blue, red)
- `children: ReactNode` - zawartość sekcji
- `action?: ReactNode` - opcjonalna akcja w prawym górnym rogu
- `compact?: boolean` - kompaktowy tryb (mniejszy padding)
- `className?: string` - dodatkowe klasy CSS

**Kolory:**
- `cyan` - niebieski (statystyki)
- `yellow` - żółty (osiągnięcia)
- `green` - zielony (plan ćwiczeń)
- `violet` - fioletowy (aktywność)
- `purple` - różowo-fioletowy (piosenki)
- `blue` - niebieski (inne)
- `red` - czerwony (błędy/ostrzeżenia)

## StatsCard

Kompaktowa karta do wyświetlania statystyk.

```tsx
import { StatsCard } from 'components/Cards';

<StatsCard
  title="Sesje"
  value={42}
  subtitle="w tym miesiącu"
  icon={<Icon />}
  trend={{ value: 15, isPositive: true }}
  compact
/>
```

**Props:**
- `title: string` - tytuł karty
- `value: string | number` - główna wartość
- `subtitle?: string` - opcjonalny podtytuł
- `icon?: ReactNode` - opcjonalna ikona
- `trend?: { value: number, isPositive: boolean }` - trend ze strzałką
- `compact?: boolean` - kompaktowy tryb
- `className?: string` - dodatkowe klasy CSS

## Przykład użycia

```tsx
import { DashboardContainer, DashboardSection } from 'components/Layout';
import { StatsCard } from 'components/Cards';

const MyDashboard = () => (
  <DashboardContainer>
    <DashboardSection
      title="Statystyki"
      subtitle="Twój postęp"
      color="cyan"
      compact
    >
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="Sesje"
          value={42}
          icon={<SessionIcon />}
          compact
        />
        <StatsCard
          title="Punkty"
          value={1250}
          trend={{ value: 15, isPositive: true }}
          compact
        />
      </div>
    </DashboardSection>
  </DashboardContainer>
);
```

## Zalety

- **Spójność** - jednolity wygląd na wszystkich stronach
- **Responsywność** - automatyczne dostosowanie do ekranu
- **Elegancja** - subtelne animacje i efekty
- **Kompaktowość** - optymalne wykorzystanie przestrzeni
- **Reużywalność** - łatwe użycie w różnych kontekstach
- **Hierarchia kolorów** - przemyślany system kolorów

