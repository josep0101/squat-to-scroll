export enum AppScreen {
  HOME = 'HOME',
  DETECTION = 'DETECTION',
  SUCCESS = 'SUCCESS'
}

export interface ChallengeData {
  website: string;
  duration: number;
  squatsRequired: number;
}