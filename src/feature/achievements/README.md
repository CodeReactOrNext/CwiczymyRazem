# Achievements Module

The Achievements Module is a data-driven system responsible for definition, validation, and display of user achievements. It separates business logic (validation rules) from UI representation using a registry pattern and logic factories.

## Core Interfaces

### `AchievementContext`

Provides the necessary data state required for any achievement validation rule.

- **Properties**
  - `statistics` (StatisticsDataInterface): Global user statistics (time, points, level).
  - `sessionResults` (ReportDataInterface): Data from the most recently submitted practice session (points, bonuses). 
  - `inputData` (ReportFormikInterface): Raw form data from the current report submission.
  - `songLists` (SongListInterface): Categorized lists of user songs (wantToLearn, learning, learned).

### `AchievementsDataInterface`

The configuration object for a single achievement definition.

- **Properties**
  - `id` (AchievementList): Unique string identifier.
  - `check` (AchievementCheck): Function returning `boolean` to determine if achievement is earned.
  - `getProgress` (Function): Optional. Returns `{ current: number, max: number, unit?: string }`.
  - `rarity` (string): One of `common`, `rare`, `veryRare`, `epic`.

- **Example**
```typescript
{
  id: "learned_100",
  rarity: "epic",
  check: (ctx) => ctx.songLists.learned.length >= 100,
  getProgress: (ctx) => ({
    current: ctx.songLists.learned.length,
    max: 100,
    unit: "songs"
  })
}
```

## Logic Factories: `AchievementRequirement`

To ensure DRY (Don't Repeat Yourself) logic, use the `AchievementRequirement` static class to generate common validation rules.

### `songCount(listName, min)`
Returns a check that validates if a specific song list reached a threshold.
```typescript
check: AchievementRequirement.songCount("learned", 50)
```

### `statThreshold(path, min)`
Returns a check for a specific numeric property in user statistics.
```typescript
check: AchievementRequirement.statThreshold("level", 10)
```

### `totalTimeThreshold(minMs)`
Calculates total practice time across all categories and compares against `minMs`.

## Engine: `AchievementsManager`

The `AchievementsManager` is the core engine that evaluates the entire registry against the current context.

- **Method**: `getNewlyEarned(oldStats, context)`
- **Returns**: `AchievementList[]` - An array of IDs for achievements earned in the current session that weren't already unlocked.

## Public API

The module exposes its public interface through the root `index.ts`. Always import from this file when using achievements in other parts of the application.

```typescript
import { 
  AchievementCard, 
  AchievementManager, 
  AchievementContext 
} from "feature/achievements";
```

## Directory Structure

- `src/feature/achievements/`
  - `data/`: Achievement definitions and rarity configurations.
  - `utils/`: Validation factories (`AchievementRequirement`) and the processing engine (`AchievementsManager`).
  - `components/`: Card layouts and holographic visual effects.
  - `types.ts`: Core TypeScript interfaces and Achievement ID union types.

## Workflow: Adding a New Achievement

1. **Define ID**: Add the unique string literal to `AchievementList` in `types.ts`.
2. **Implement Logic**: Create the definition in the appropriate category file under `data/categories/`.
3. **Register**: Ensure the new category is exported and spread into the main `achievementsData` registry in `data/achievementsData.tsx`.
4. **Localization**: Add the name and description keys to the `achievements.json` translation file.

