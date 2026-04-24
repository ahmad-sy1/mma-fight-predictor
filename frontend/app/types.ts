export interface Fighter {
  name: string
  record: string
  wins: number
  losses: number
  winRate: number
  age: number
  heightCms: number
  reachCms: number
  stance: string
  weightClass: string
  avgSigStr: number
  avgTD: number
  // Extended stats
  winStreak: number
  loseStreak: number
  longestWinStreak: number
  koWins: number
  subWins: number
  decWins: number
  totalRounds: number
  titleBouts: number
  sigStrAcc: number
  tdAcc: number
  avgSubAtt: number
  corner?: 'red' | 'blue'
}

export interface ModelInfo {
  accuracy: number
  total_fights: number
  feature_count: number
}

export interface PredictionFactor {
  label: string
  sub: string
  delta: number
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
  venue: string
  card: string
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
