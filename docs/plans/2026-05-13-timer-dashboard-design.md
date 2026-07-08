# Design Document: Modern Dashboard for PracticeModeSelector

**Date:** 2026-05-13
**Topic:** Redesigning PracticeModeSelector for improved readability and premium feel.

## Overview
The current PracticeModeSelector is a dense grid of 13 items. This design aims to transition it to a "Modern Dashboard" style with better spacing, visual depth, and clearer hierarchy.

## Design Goals
- Improve readability by increasing whitespace and using a card-based layout.
- Enhance the "premium" aesthetic using glassmorphism and subtle animations.
- Better utilization of screen width on desktop (3-column grid).

## Components & Styling

### 1. Grid Layout
- **Desktop:** 3-column grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Gap:** Increased from `gap-2` to `gap-4` or `gap-6`.

### 2. Card Design (`listItem` function)
- **Background:** `bg-white/[0.03]` with `backdrop-blur-sm`.
- **Border:** `border border-white/5`.
- **Hover State:**
    - `bg-white/[0.06]`
    - `border-white/20`
    - `scale-[1.02]` transition.
    - Subtle outer glow (shadow).
- **Padding:** Increased internal padding for better breathing room.

### 3. Iconography
- Icons contained within larger, rounded containers.
- Color mapping preserved but with more vibrant variants for better contrast.

### 4. Typography
- **Title:** `text-base` (up from `text-sm`), `font-bold`.
- **Description:** `text-xs` (up from `text-[11px]`), `text-zinc-400`.

## Implementation Steps
1. Update `colorMap` with refined colors if needed.
2. Refactor `listItem` helper in `PracticeModeSelector.tsx` to implement new card design.
3. Update the main grid container classes.
4. Ensure mobile responsiveness remains solid.

## Testing Criteria
- Visual audit: Ensure cards look "premium" and are easy to scan.
- Responsiveness: Check 1, 2, and 3 column layouts at different breakpoints.
- Interaction: Verify hover effects are smooth and performant.
