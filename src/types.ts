export interface Shooter {
  id: string;
  name: string;
  rank: string;
  number: string;
  team: string;
}

export interface Stage {
  id: string;
  name: string;
  date: string;
  rounds: number;
  targets: number;
  image?: string | null;
}

export interface TargetScore {
  target: number;
  A: number;
  C: number;
  D: number;
  M: number;
  NS: number;
}

export interface ShooterScore {
  shooterId: string;
  stageId: string; // matches stage name
  time: string;
  procedurals: number;
  totalScore: number;
  hitFactor: number;
  scores: TargetScore[];
}

export type PageId =
  | 'home'
  | 'enter-scores'
  | 'stage-detail'
  | 'add-score'
  | 'build-stages'
  | 'add-stage'
  | 'edit-shooters'
  | 'add-shooter'
  | 'view-results'
  | 'shooting-details';

export interface ScorePoints {
  A: number;
  C: number;
  D: number;
  M: number;
  NS: number;
}

export const SCORING_POINTS: ScorePoints = {
  A: 5,
  C: 4,
  D: 2,
  M: 0,
  NS: -5,
};
