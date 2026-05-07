export interface Fighter {
  name: string
  record: string
  wins: number
  losses: number
  winRate: number
  weightClass: string
  winStreak: number
  loseStreak: number
  longestWinStreak: number
  koWins: number
  subWins: number
  decWins: number
  titleBouts: number
  sigStrAcc: number
  tdAcc: number
  avgSigStr: number
  avgTD: number
  avgSubAtt: number
  avgCtrlSec: number
  avgKD: number
  recentWins: number
  age?: number
  heightCms?: number
  reachCms?: number
  stance?: string
  totalRounds?: number
  corner?: 'red' | 'blue'
}

export interface ModelInfo {
  accuracy: number
  total_fights: number
  feature_count: number
}

export interface PredictionFactor {
  label: string
  delta: number
  sub?: string
}

export interface PredictionResult {
  winner: Fighter & { corner: 'red' | 'blue' }
  loser: Fighter
  confidence: number
  factors: PredictionFactor[]
  method: string
  round: string
}

export interface UpcomingFight {
  event: string
  date: string
  location: string
  weightClass: string
  redFighter: string
  blueFighter: string
}

export interface UpcomingPrediction {
  fight: UpcomingFight
  redFighter: Fighter
  blueFighter: Fighter
  winnerCorner: 'red' | 'blue'
  confidence: number
  factors: PredictionFactor[]
}
