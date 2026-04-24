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
  corner?: 'red' | 'blue'
}

export interface PredictionFactor {
  label: string
  sub: string
  delta: number
}

export interface ModelInfo {
  accuracy: number
  total_fights: number
  feature_count: number
}

export interface PredictionResult {
  winner: {
    name: string
    record: string
    reachCms: number
    age: number
    stance: string
    corner: 'red' | 'blue'
  }
  loser: {
    name: string
    record: string
    reachCms: number
    age: number
    stance: string
  }
  confidence: number
  factors: PredictionFactor[]
  method: string
  round: string
}