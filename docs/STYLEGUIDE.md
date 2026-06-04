# Style & Design Guide (dla AI)

> Cel: żeby AI generowało style **spójne z istniejącym kodem**, a nie "poprawne ogólnie".
> Ten plik opisuje, jak realnie wyglądają style w tym projekcie — co jest konwencją, a co długiem technicznym.
> Lokalizacja źródeł: `tailwind.config.js`, `src/styles/globals.css`, `src/assets/components/ui/*`, `src/assets/lib/utils.ts`.

---

## 0. ZASADY NADRZĘDNE (najważniejsze — mają pierwszeństwo)

> Te reguły są wiążące. Jeśli cokolwiek niżej w tym pliku im przeczy, **wygrywają te zasady**.

1. **Border radius — tylko dwie wartości:** `rounded-lg` (8px) dla dużych elementów (karty, panele, przyciski, modale, inputy) i `rounded` (4px) dla małych (badge, tag, chip, mały przycisk ikonowy, kwadracik). Nie używaj `rounded-md/xl/2xl/3xl/sm`. `rounded-full` dozwolone tylko dla okręgów (avatary, kropki, pille).
   > Uwaga: w configu `--radius` = `0.5rem` (8px), więc `rounded-lg` = 8px, a `rounded-sm` = `calc(8px - 4px)` = 4px. Dla "małych" preferuj jednak czyste `rounded` (4px) dla jednoznaczności.
2. **Bez cieni.** Nie używaj `shadow-*` (`shadow`, `shadow-md`, `shadow-dark-*`, `shadow-accent-*` itd.). Cień tylko dla naprawdę wyjątkowych elementów (np. element unoszący się nad treścią) — i wtedy świadomie.
3. **Bez borderów.** Nie używaj `border-*` do oddzielania/ramkowania. Hierarchię buduj **tłem** (`bg-zinc-900/40` vs `bg-zinc-800/40`) i **odstępami**.
4. **Separacja = większy odstęp, nie linia.** Zamiast `border-t`, `divide-*`, `<Separator/>` czy linii — rozdziel elementy większym `gap`/`space-y`/`mt`/`py`. Nie dodawaj linii rozdzielających.
5. **Kontrast tekst/tło zawsze poprawny.** Tekst musi być czytelny na swoim tle (cel: WCAG AA). Na ciemnym tle tekst główny `text-zinc-100/200`, opisowy `text-zinc-400`; nie schodź z ważnym tekstem do `zinc-600/700` na ciemnym tle.
6. **Buttony mają micro-interaction na `hover` i `focus`.** Każdy przycisk musi widocznie reagować — subtelna zmiana tła/jasności + wyraźny stan `focus-visible`. Brak "martwych" przycisków bez reakcji.
7. **Hover zawsze minimalistyczny — bez transformacji rozmiaru.** Żadnych `hover:scale-*`, `hover:size-*`, powiększania. Dozwolone: delikatna zmiana tła/koloru/opacity (`transition-background` / `transition-colors`). (Klik = `click-behavior` to osobny, świadomy efekt.)
8. **Nie powielaj informacji tekstem — użyj ikony.** Jeśli label tylko powtarza to, co już widać, zostaw samą ikonę (`lucide`). Tekst tylko gdy wnosi nową informację. Dla samodzielnych ikon dodaj `aria-label`.
9. **Nie używaj koloru bez potrzeby.** Kolor = znaczenie (patrz sekcja 4: cyan/amber/orange/emerald/purple mają role). Domyślnie neutralne `zinc`. Akcent stosuj oszczędnie, tam gdzie coś faktycznie znaczy.
10. **Ikony domyślnie szare.** Ikony zwykle `text-zinc-400` (lub `zinc-500`). Kolor ikony tylko gdy niesie znaczenie (stan/waluta/akcja) — wtedy zgodnie z paletą semantyczną.
11. **Nigdy `uppercase`.** Nie używaj `uppercase` (ani `text-transform: uppercase`). Teksty zostawiaj w naturalnej wielkości liter. Stary kod z `uppercase` zamieniaj przy okazji.
12. **Mobile — tylko jeden poziom kart.** Na mobile **nie zagnieżdżaj kart**: żadnej karty z tłem wewnątrz innej karty z tłem (żadnych "podwójnych kart"). Wewnętrzne sekcje rozdzielaj odstępami, nie kolejnym tłem.
13. **Mobile — wszystko w karcie.** Na mobile każda treść/sekcja musi być zamknięta w jakiejś karcie (kontenerze z tłem). Nie zostawiaj treści "luzem" na gołym tle strony. Łącznie z #12: na mobile dokładnie **jeden** poziom karty wokół treści.

---

## 1. Stack

- **Next.js 16** (głównie `pages/`, częściowo `app/`), **React 19**, TypeScript.
- **Tailwind CSS** (config: `tailwind.config.js`, CSS: `src/styles/globals.css`).
- **shadcn/ui** — styl `new-york`, base color `neutral`, `cssVariables: true`. Komponenty bazowe w `src/assets/components/ui/`.
- **Radix UI** — prymitywy pod komponenty (dialog, select, tabs, tooltip, dropdown...).
- **CVA** (`class-variance-authority`) — warianty komponentów.
- **framer-motion** — animacje (używane w ~70 plikach).
- Ikony: **`lucide-react`** (domyślne, zgodne z shadcn) + `react-icons` (legacy).
- Formatowanie: `prettier-plugin-tailwindcss` **automatycznie sortuje klasy** — nie układaj klas ręcznie "na siłę".

---

## 2. Złota zasada: zawsze `cn()`

Każdy `className` łączony warunkowo / z propsem `className` przechodzi przez `cn()`:

```ts
import { cn } from "assets/lib/utils"; // clsx + tailwind-merge
```

```tsx
<div className={cn("rounded-lg bg-zinc-800/40 p-4", isActive && "ring-1 ring-cyan-500/50", className)} />
```

`cn()` = `twMerge(clsx(...))`, więc **późniejsza klasa wygrywa konflikt** (`p-4 ... p-6` → `p-6`). Dzięki temu propsy `className` z zewnątrz mogą nadpisywać domyślne style komponentu — projektuj komponenty tak, by `className` był na końcu `cn()`.

---

## 3. Tryb: tylko ciemny

Aplikacja jest **dark-only**. Nie ma trybu jasnego do utrzymywania.

- `body`: tło `#09090b` (`bg-zinc-950`), tekst `#f5f5f5`, font Inter, `darkMode: 'class'`.
- Motyw `dark-theme` (z `tailwindcss-themer`) jest aktywny globalnie.
- **Nie pisz** wariantów `dark:` ani jasnych domyślnych — od razu projektuj na ciemnym tle.

---

## 4. Kolory — co REALNIE stosować

W repo współistnieją trzy palety. Trzeci punkt to ten, którego faktycznie używamy w nowym kodzie.

To aplikacja **gamifikowana** — kolory niosą znaczenie (waluty, nagrody, statystyki), nie są tylko dekoracją. Trzymaj się przypisanych ról.

### ✅ Paleta wiodąca (używaj tej w nowym kodzie)
Baza: neutrale **`zinc-*`**. Akcenty semantyczne: **`cyan`** (brand/gemy/level), **`amber`** (Fame/nagrody), **`orange`** (streak/energia), **`emerald`** (sukces), **`purple/violet`** (rzadkie/specjalne).

**Neutrale (struktura, tło, tekst):**

| Rola | Klasy | Uwagi |
|---|---|---|
| Tło strony | `bg-zinc-950` | prawie czarne |
| Tło karty / panelu | `bg-zinc-900/40`, `bg-zinc-900/60`, `bg-zinc-800/40` | półprzezroczyste warstwy = głębia |
| Tło elementu hover | `bg-zinc-800`, `bg-zinc-800/50` | |
| Obramowania | `border-zinc-800`, `border-zinc-700` | subtelne |
| Tekst główny | `text-zinc-100` / `text-zinc-200` | |
| Tekst drugorzędny | `text-zinc-400` | **najczęstszy** kolor tekstu opisowego |
| Tekst wyciszony | `text-zinc-500`, `text-zinc-600` | |

**Akcenty semantyczne (każdy ma znaczenie):**

| Kolor | Znaczenie w aplikacji | Klasy | Przykłady z UI |
|---|---|---|---|
| **Cyan** | Brand / CTA / gemy 💎 / level / XP / aktywne elementy | `text-cyan-400`, `bg-cyan-500`, `bg-cyan-500/10`, `border-cyan-500/30` | licznik gemów, ring poziomu, aktywny element w menu, heatmapa aktywności, badge'y ćwiczeń |
| **Amber / gold** | Fame Points 🏆 / nagrody / waluta / osiągnięcia | `text-amber-400`, `bg-amber-500/10`, `text-amber-500`, `border-amber-500/20` | licznik „540" Fame, `+10` przy aktywnościach, Arsenal |
| **Orange** | Streak 🔥 / „Daily Practice" / energia / pilność | `text-orange-400`, `bg-orange-500/10`, `text-orange-500` | ikona ognia/streak, label „DAILY PRACTICE", akcenty hero |
| **Emerald** | Sukces / ukończone / pozytywny progres | `text-emerald-400`, `bg-emerald-500/10`, `border-emerald-500/20` | potwierdzenia, wzrost statystyk |
| **Purple / violet / indigo** | Rzadkie/epickie (osiągnięcia, tiery) / dekoracyjne gradienty | `text-purple-400`, `bg-purple-500/10`, `via-purple-600`, `from-violet-500` | gradient overlay hero, epickie achievementy, wyróżnione plany |

> Rzadkość osiągnięć ma własną skalę (`achievements` w themer): `common #fff`, `rare #b1f9ff`, `veryRare #ffe54c`, `epic`.

Wzorzec "aktywny / wyróżniony" element (powtarza się dla każdego akcentu — zmieniasz tylko kolor):
```
bg-cyan-500/10 border border-cyan-500/30 text-cyan-400      // brand/aktywny
bg-amber-500/10 border border-amber-500/20 text-amber-400   // nagroda/Fame
bg-emerald-500/10 border border-emerald-500/20 text-emerald-400  // sukces
```
Schemat: `bg-{kolor}-500/10` + `border-{kolor}-500/20..30` + `text-{kolor}-400`. To jest sygnatura wizualna tej aplikacji.

### ⚙️ Tokeny semantyczne z configu (dozwolone, częściowo wdrożone)
Zdefiniowane w `tailwind.config.js`, ale w praktyce rzadziej używane niż surowe `zinc/cyan/emerald`:
- `surface-base|elevated|pressed|disabled` — powierzchnie i ich stany.
- `state-success|warning|error|info` — kolory stanów.
- `dark-50 ... dark-950` — skala slate (zamiennik `zinc`).
- shadcn semantyczne: `background`, `foreground`, `card`, `muted`, `primary`, `secondary`, `accent`, `destructive`, `border`, `input`, `ring` (sterowane CSS vars).

> Jeśli rozbudowujesz komponent shadcn (`ui/*`), trzymaj się jego semantycznych tokenów (`bg-primary`, `text-muted-foreground` itd.). W kodzie feature/* używaj palety wiodącej (`zinc/cyan/emerald`).

### 🕸️ Paleta legacy (themer) — NIE używaj w nowym kodzie
`main`, `second`, `main-opposed`, `tertiary`, `error`, `achievements`, `mainText`, `secondText`, `link`. Występuje w starszych częściach (`bg-second-600`, scrollbar w globals). Zostawiaj przy edycji starego kodu, ale **nie wprowadzaj** w nowym.

---

## 5. Typografia

Rodziny z configu:
- `font-sans` / `font-body` → **Inter** (domyślny tekst).
- `font-display` / `font-jakarta` → **Plus Jakarta Sans** (nagłówki, akcenty).
- `font-teko` → **Teko** (przez `--font-teko`, do dużych liczb/timera).

Inter ma włączone `font-feature-settings: 'cv02','cv03','cv04','cv11'` (globalnie na `body`).

> ⚠️ **Dług/pułapka:** klasa `font-openSans` jest używana w ~30 plikach (m.in. `ui/button.tsx`, `ui/card.tsx`), ale **nie istnieje w `tailwind.config.js`** → nie robi nic (fallback do Inter). Nie dodawaj nowych `font-openSans`. Przy refaktorze zamieniaj na `font-sans`/`font-display`. Nie "naprawiaj" jej masowo bez ustalenia z właścicielem.

---

## 6. Promienie, cienie, spacing

> Reguluje to **zasada nadrzędna #1 i #2** — tu tylko doprecyzowanie.

**Border radius — tylko dwie wartości:**
- **`rounded-lg` = 8px** → duże elementy: karty, panele, przyciski, inputy, modale, okładki.
- **`rounded` = 4px** → małe elementy: badge, tag, chip, kwadracik heatmapy, mały ikonowy przycisk.
- **`rounded-full`** → tylko okręgi: avatary, kropki statusu, pille.
- ❌ Nie używaj `rounded-md / xl / 2xl / 3xl / sm` ani `radius-default / radius-premium`. Stary kod może je mieć — zamieniaj przy okazji.

**Cienie:** domyślnie **brak** (zasada #2). `shadow-*` tylko dla wyjątkowego, unoszącego się elementu — świadomie. Hierarchię rób tłem, nie cieniem.

**Spacing:** to główne narzędzie hierarchii i separacji (zamiast linii/borderów).
- Padding kart: `p-4` / `p-5` / `p-6`.
- Stosy: `gap-2/3/4`, większe rozdzielenie sekcji `gap-6/8`, `space-y-6`, `mt-8`.
- Trzymaj skalę 4px (Tailwind default).

---

## 7. Glassmorphism (charakterystyczny styl projektu)

Custom utilities z `tailwind.config.js`:
- `glass-card` → tło `rgba(24,24,27,.4)`.
- `glass-card-hover` → tło `rgba(24,24,27,.5)`.
- `blur-premium` → `backdrop-filter: blur(16px) saturate(180%)`.

Typowa "szklana" karta (zgodna z zasadami — bez cienia i bez borderu):
```tsx
<div className={cn(
  "group relative flex flex-col overflow-hidden rounded-lg glass-card p-5 transition-background",
  "hover:glass-card-hover"
)}>
  ...
</div>
```
> Stary `PublicSongCard` używa `hover:shadow-xl` i cienkiej linii-highlightu (`h-px bg-gradient-to-r ... via-white/10`) — to **łamie** zasady #2 i #4. W nowym kodzie nie powielaj tego; głębię daje samo `glass-card` + `hover:glass-card-hover`.

---

## 8. Gradienty

Często stosowane (kolejność popularności): `bg-gradient-to-br` > `bg-gradient-to-r` > `to-b` > `to-t` > `to-tr`.
- Dekoracyjne poświaty: gradienty cyan/emerald z niską przezroczystością.
- Animowany gradient tła: `animate-gradient` (keyframe `gradient`, 6s) + `bg-[position]`.
- Pływające poświaty: `animate-glow-float-1` / `animate-glow-float-2`.

---

## 9. Interakcje, tranzycje, animacje

- **Hover = minimalistyczny** (zasada #7): tylko zmiana tła/koloru/opacity przez **`transition-background`** lub `transition-colors`. ❌ Bez `hover:scale-*` i transformacji rozmiaru.
- **Buttony: zawsze micro-interaction** na hover i focus (zasada #6) — np. `hover:bg-...` + `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`. Żaden przycisk nie może być "martwy".
- Klik (skala): `click-behavior` (scale 98%, 100ms) / `click-behavior-second` (96%) — świadomy efekt naciśnięcia, nie hover.
- Animacje keyframe z configu: `accordion-down/up`, `ping-slow`, `skill-upgraded`, `gradient`, `glow-float-1/2`. Z globals: `shimmer`, `animate-shimmer`, `hover-animation`, `shake-animation`, `music-pulse`.
- Złożone/sekwencyjne animacje i wejścia → **framer-motion** (`motion.*`, `AnimatePresence`).
- Focus (z shadcn): `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`.
- Stany disabled: `disabled:pointer-events-none disabled:opacity-50`.

---

## 10. Komponenty: warianty przez CVA

Wzorzec z `ui/button.tsx` — używaj go, gdy komponent ma kilka wariantów wyglądu:

```ts
const xVariants = cva("bazowe-klasy", {
  variants: {
    variant: { default: "...", outline: "...", ghost: "..." },
    size:    { default: "h-9 px-4 py-2", sm: "h-8 px-3 text-xs", lg: "h-10 px-8", icon: "h-9 w-9" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```
- Komponent przyjmuje `VariantProps<typeof xVariants>` + `className`.
- Render: `className={cn(xVariants({ variant, size, className }))}`.
- Wsparcie `asChild` przez `@radix-ui/react-slot` (jak w Button), gdy chcemy renderować inny tag/Link.
- Komponenty bazowe to `React.forwardRef` z `displayName`.

Rozmiary przycisków: `default h-9`, `sm h-8`, `lg h-10`, `icon h-9 w-9`. Trzymaj się ich.

---

## 11. Responsywność

Customowe breakpointy (dodatkowe, mniejsze niż `sm`):
- `xxs` = 285px, `xs` = 350px, `xsm` = 500px, dalej domyślne `sm/md/lg/xl/2xl`.

Mobile-first: bazowe klasy = mobile, większe ekrany przez prefiksy. Ukrywanie scrollbara: `scrollbar-hide` / `no-scrollbar`.

---

## 12. Konwencje formatowania (Prettier)

Z `.prettierrc.json`:
- `singleQuote: false` (podwójne cudzysłowy w TS/JS), ale `jsxSingleQuote: true` (pojedyncze w atrybutach JSX).
- `semi: true`, `tabWidth: 2`, `bracketSameLine: true`.
- `prettier-plugin-tailwindcss` sortuje klasy automatycznie — **pisz klasy logicznie, nie martw się kolejnością**, formatter je poukłada.

---

## 13. Struktura plików stylów / komponentów

- `src/styles/globals.css` — reset, body, scrollbar, CSS vars (`:root`, `.dark`), `@layer` utilities/base, keyframes globalne, style AlphaTab.
- `tailwind.config.js` — paleta, fonty, cienie, animacje, custom utility plugins.
- `src/assets/components/ui/` — bazowe komponenty shadcn (alias `@/components/ui` → `assets/components/ui`).
- `src/assets/lib/utils.ts` — `cn()`.
- `src/design-system/` — `tokens/` i `utils/` (obecnie szkielet; docelowe miejsce na tokeny DS).
- `src/feature/<nazwa>/` — komponenty domenowe; tu żyje większość realnego UI.

Aliasy importów (z `components.json`): `components` → `assets/components`, `ui` → `assets/components/ui`, `lib` → `assets/lib`, `utils` → `assets/lib/utils`, `hooks` → `assets/hooks`.

---

## 14. Anatomia typowego ekranu (z dashboardu)

- **Sidebar** (lewy): ciemny, szara ikona `lucide` + label; aktywny element ma podświetlone **tło** + akcent cyan (kropka). Sekcje rozdzielone **większym odstępem** (nie linią).
- **Topbar**: streak 🔥 (orange), licznik gemów 💎 (cyan), licznik Fame 🏆 (amber/gold), akcje po prawej.
- **Hero / baner**: zdjęcie + ciemny gradient overlay (często z fioletem), label kategorii w akcencie (np. `text-orange-400 tracking-wide` — **bez `uppercase`**, zasada #11), duży nagłówek `font-display`, CTA, po prawej "stat" (ring poziomu = `react-circular-progressbar` w cyan).
- **Karty statystyk** (Daily Quests, This week): `glass-card` / `bg-zinc-900/40`, `rounded-lg`, nagłówek z ikoną, wiersze z progresem `x/y`. Bez borderu, bez cienia.
- **Liczniki / waluty**: ikona + liczba w kolorze roli (gemy cyan, Fame amber). `+N` przy zdarzeniach w akcencie (np. `+10` amber, `+3 💎` cyan).
- **Heatmapa aktywności**: siatka kwadracików `rounded` (4px), intensywność = odcień cyan (`bg-cyan-500/20` → `bg-cyan-400`), puste = `bg-zinc-800`.
- **Taby** (Activity/Chat/...): aktywny tab podświetlony tłem, ikona + label.
- **Feed aktywności**: wiersze-karty `rounded-lg bg-zinc-900/40`, avatar (kółko), tekst `text-zinc-400` + nazwy/wartości w akcentach, po prawej kolorowe **badge'y** `rounded` (Exercise/Plan = cyan, Score = blue/purple, rating ⭐ = amber). Wiersze oddzielone odstępem, nie linią.

## 15. Szybka checklista dla AI przy pisaniu stylów

> Najpierw **zasady nadrzędne (sekcja 0)** — poniżej skrót operacyjny.

1. Łączysz klasy → użyj `cn()`, `className` na końcu.
2. **Radius:** `rounded-lg` (8px) duże / `rounded` (4px) małe / `rounded-full` okręgi. Nic innego.
3. **Bez cieni, bez borderów.** Hierarchia i separacja = **tło + odstępy** (większy `gap`/`space-y`, nie linia).
4. Kolory: baza `zinc` + akcenty **semantyczne**: `cyan` (brand/gemy/level), `amber` (Fame/nagrody), `orange` (streak), `emerald` (sukces), `purple` (rzadkie/dekor). Kolor tylko gdy coś znaczy. Bez `dark:`, bez palety `main/second`.
5. Tekst: główny `zinc-100/200`, opisowy `zinc-400`, wyciszony `zinc-500`. **Zawsze poprawny kontrast** — ważnego tekstu nie spychaj do `zinc-600/700`.
6. **Ikony domyślnie szare** (`text-zinc-400`); kolor tylko gdy niesie znaczenie. Samodzielna ikona → `aria-label`.
7. **Nie powielaj labelem informacji** widocznej obok — zostaw samą ikonę.
8. Wyróżnienie/akcent (bez borderu) → `bg-{kolor}-500/10 + text-{kolor}-400` (ew. dla istniejących wzorców `border-{kolor}-500/20`).
9. **Hover minimalistyczny:** tylko tło/kolor/opacity (`transition-background`), **bez `scale`/transformacji rozmiaru**. Klik → `click-behavior`.
10. **Buttony:** widoczny micro-interaction na `hover` i `focus-visible` (ring) — żadnego "martwego" przycisku.
11. Warianty komponentu → CVA + `forwardRef` + `displayName`.
12. Fonty → `font-sans`/`font-display`/`font-teko`. **Nie** dodawaj `font-openSans` (nie istnieje w configu).
13. Złożone animacje → framer-motion; proste → klasy `animate-*` z configu.
14. Mobile-first, pamiętaj o `xxs/xs/xsm`. Na mobile: **wszystko w karcie** i **tylko jeden poziom karty** — nigdy karta w karcie.
15. **Nigdy `uppercase`.**
16. Wartości gamifikacji (gemy, Fame, level, streak) zawsze w przypisanym kolorze + ikona.
