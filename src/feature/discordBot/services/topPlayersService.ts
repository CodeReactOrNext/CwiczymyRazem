/**
 * Type definitions for top players functionality
 * Note: This file is kept for type definitions only.
 * The functionality has been replaced by using SeasonService.
 */

/**
 * Represents a player in the seasonal ranking
 */
export interface TopPlayerData {
  /** User identifier */
  uid: string;
  
  /** Display name of the player */
  displayName: string;
  
  /** Total points earned in the season */
  points: number;
  
  /** Player's current level */
  level: number;
  
  /** URL to player's avatar image */
  avatar?: string | null;
} 