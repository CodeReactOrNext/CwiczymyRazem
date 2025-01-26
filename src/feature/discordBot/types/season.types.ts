export interface SeasonPlayer {
  displayName: string;
  points: number;
}

export interface SeasonData {
  players: SeasonPlayer[];
  daysLeft: number;
}
