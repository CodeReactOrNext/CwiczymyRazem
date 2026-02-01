# Implementation Plan - Refine Exercise Hub Design

Refining the design of the Exercise Hub and Detail pages to align better with the brand, make them more compact, and improve navigation.

## Proposed Changes

### [Component] Exercise Hub Refinement

#### [MODIFY] [ExercisesHubView.tsx](file:///c:/cw/CwiczymyRazem/src/feature/exercisePlan/views/ExercisesHub/ExercisesHubView.tsx)
-   **Structure & Spacing**: Reduce vertical padding (e.g., from `py-24` to `py-16`) and margins to make the page more compact.
-   **Border Radius**: Change `rounded-2xl`/`rounded-3xl` to `rounded-lg` (8px).
-   **Typography**: Remove `uppercase` and `tracking-[0.2em]` from all headings and buttons. Use standard casing for a cleaner look.
-   **Colors**: Ensure the background is `bg-zinc-950` and the hero glow uses the `cyan-500`/`teal-500` palette rather than deep blue.
-   **Navigation**: Add a "Back to Home" link in the hero section for easier navigation.

### [Component] Exercise Detail Refinement

#### [MODIFY] [ExerciseDetailView.tsx](file:///c:/cw/CwiczymyRazem/src/feature/exercisePlan/views/ExerciseDetail/ExerciseDetailView.tsx)
-   **Layout**: Reduce spacing between sections.
-   **Border Radius**: Harmonize to `rounded-lg` (8px).
-   **Typography**: Remove `uppercase` from "Instructions", "Pro Tips", and "Target Skills".
-   **Skills Section**: Remove the "Tracked" badge from individual skills.
-   **CTA Redesign**: REPLACE the deep blue gradient box with a more premium, compact zinc box.
    -   Use `bg-zinc-900/50` with a subtle `white/10` border.
    -   Update the CTA button to `bg-white text-black` to match the landing page's primary actions.

### [Component] Preview Mode Refinement

#### [MODIFY] [ExerciseDetailView.tsx](file:///c:/cw/CwiczymyRazem/src/feature/exercisePlan/views/ExerciseDetail/ExerciseDetailView.tsx)
-   **Clarify Preview Status**: Replace the subtle "Preview Mode" text with a more explicit disclaimer/label.
-   **Call to Action Context**: Add text near the tablature/preview area explaining that **Interactive metronome, playback, and progress tracking** are available in the Full Practice Mode (after login).
-   **Conditional Layout**: If neither tablature nor image is available, provide a more helpful "missing content" UI that still encourages starting a session if possible (or explains why it's a "guided only" exercise).

### [Component] Polish & Global Links

#### [MODIFY] [translation files](file:///c:/cw/CwiczymyRazem/public/locales/)
- Add `phrasing` and `articulation` to `common:skills` in Polish and English locales.

#### [MODIFY] [ExerciseDetailView.tsx](file:///c:/cw/CwiczymyRazem/src/feature/exercisePlan/views/ExerciseDetail/ExerciseDetailView.tsx)
-   **Full Practice Link**: Add a link within the disclaimer to scroll down to the "Ready to Practice" section or navigate to the practice session if applicable.
-   **Compact Empty State**: Shrink the "Interactive session only" box (remove excessive padding/large icon) to be less invasive.

#### [MODIFY] [HeroSection.tsx](file:///c:/cw/CwiczymyRazem/src/feature/landing/components/HeroSection.tsx)
-   **Hub Navigation**: Add a prominent "Browse Exercises" button or link in the landing page hero to drive traffic to the programmatic SEO hub.

### [Component] UI Consistency

#### [MODIFY] [ExerciseCard.tsx](file:///c:/cw/CwiczymyRazem/src/feature/exercisePlan/components/ExerciseCard.tsx)
-   Update `radius-premium` usage or override with `rounded-lg`.
-   Ensure no `uppercase` transformations are applied to category labels or buttons in the hub context.

## Verification Plan

### Manual Verification
1.  **Visual Audit**:
    -   Open `/exercises` and verify that all elements have 8px corners.
    -   Check that text is NOT all caps in the hub and detail pages.
    -   Confirm that the "Tracked" badge is gone from the skills list.
2.  **Branding Check**:
    -   Ensure the "Ready to Practice" section in `/exercises/[slug]` is no longer blue but fits the zinc/white/cyan brand.
3.  **Navigation Check**:
    -   Verify the new "Back to Home" link works and takes the user to the landing page or dashboard.
4.  **Compactness**:
    -   Scroll through both pages to ensure they feel less "puffy" and more information-dense.
5. **Preview Clarity**: Confirm that a new user understands that the view is static and interactivity is locked behind the "Practice" button.
6. **Translations**: Verify `phrasing` and `articulation` display correctly.
7. **Landing Page**: Check that the Hub is accessible from the main page.
