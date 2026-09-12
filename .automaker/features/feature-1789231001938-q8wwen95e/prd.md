# PRD: Remove `uppercase` from GuitarCard.tsx

**Feature ID:** feature-1789231001938-q8wwen95e
**Date:** 2026-09-12
**Status:** Fix implemented, pending review

---

## 1. Problem

`src/feature/arsenal/components/GuitarInventory/GuitarCard.tsx` uses the Tailwind `uppercase` utility class in two places:

1. **Guitar brand label** (`guitar.brand` display) — `text-[10px] font-semibold uppercase leading-none tracking-wider`
2. **"New" badge** (recently acquired indicator) — `px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-black`

This directly violates **STYLEGUIDE.md rule #11** (line 24):

> "Nigdy `uppercase`. Nie uzywaj `uppercase` (ani `text-transform: uppercase`). Teksty zostawiaj w naturalnej wielkosci liter. Stary kod z `uppercase` zamieniaj przy okazji."

The rule is absolute — no exceptions are documented for badges, labels, card elements, or any other component type. The rule also explicitly instructs developers to fix old `uppercase` code when they encounter it.

---

## 2. Solution

Remove the `uppercase` class from both className strings. No other changes needed.

- **Brand label:** `text-[10px] font-semibold leading-none tracking-wider` — brand text displays in its natural case as stored in the data.
- **"New" badge:** `px-1.5 py-0.5 text-[8px] font-black tracking-widest text-black` — the source string is already `"New"` (capitalized), so it renders correctly as "New" instead of the previous forced "NEW".

The `tracking-wider` and `tracking-widest` classes are retained. These provide letter-spacing for visual distinction and are not `text-transform` — they do not violate the rule.

---

## 3. Scope

| In scope | Out of scope |
|---|---|
| Remove `uppercase` from GuitarCard.tsx (2 locations) | Other files that may use `uppercase` (separate issue) |
| Verify no visual regression in text rendering | Redesigning card layout or badge styling |

**Files modified:** 1 file — `src/feature/arsenal/components/GuitarInventory/GuitarCard.tsx`

**Risk:** Minimal. This is a CSS-only change removing a text transformation. No logic, data, or layout changes.

---

## 4. Acceptance Criteria

1. `GuitarCard.tsx` contains zero instances of the `uppercase` class.
2. The guitar brand label renders in its natural case (as stored in data).
3. The "New" badge renders as "New" (not "NEW").
4. All remaining styling (`tracking-wider`, `tracking-widest`, font weights, sizes) is preserved.
5. ESLint passes on the modified file with no new errors.
6. Full test suite (Vitest) passes with no regressions.
