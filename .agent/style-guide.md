# rock_app_style_guide

This document outlines the visual and stylistic preferences for developer agents working on the project. Follow these strictly to maintain consistency with the user's design philosophy.

## Layout & Containers
- **No Borders**: Avoid using borders on main containers, cards, and sections unless explicitly requested for a specific decorative effect.
- **Border Radius**: Use a consistent border radius of `8px`. In Tailwind CSS, this corresponds to the `rounded-lg` utility.
- **Shadows**: Don't use shadows on card, containers, etc. Only if I want or I want something creative.

## Typography & Voice
- **Human-Centric Copy**: Avoid "AI-sounding" marketing speak or overly grandiose descriptions (e.g., "Your musical evolution starts here", "Master your fate"). 
- **Direct & Functional**: Keep titles and descriptions practical, informative, and grounded in the app's functionality (e.g., "Daily Training", "Current Progress").

## Components
- **Buttons**: Use the project's standard `Button` component from `assets/components/ui/button`. Don't style them
- **Minimal Styling**: Avoid adding excessive custom styling to buttons like extreme letter-tracking (`tracking-[0.2em]`), heavy gradients, or complex hover animations unless they are part of the core design system.
- **Spacing**: Maintain clean, consistent padding.

## Colors
- Use the project's defined brand colors (e.g., `bg-main`, `text-main`) consistently.
