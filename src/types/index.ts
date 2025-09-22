export interface Player {
  id: string;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  totalGames: number;
  createdAt: Date;
  // Betting statistics
  betsPlaced: number;
  betsWon: number;
  totalPointsEarned: number;
  bettingPool: number; // Available points for betting
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  winner?: Player;
  loser?: Player;
  startTime?: Date;
  endTime?: Date;
  eloChanges?: {
    player1Change: number;
    player2Change: number;
  };
}

export interface Bet {
  id: string;
  matchId: string;
  bettorId: string; // player id who placed the bet
  predictedWinnerId: string; // player id of predicted winner
  points: number; // betting points instead of dollars
  odds: number;
  status: 'active' | 'won' | 'lost' | 'cancelled';
  placedAt: Date;
  pointsEarned?: number; // Points earned from winning bet
}

export interface EloCalculationResult {
  newPlayer1Elo: number;
  newPlayer2Elo: number;
  player1Change: number;
  player2Change: number;
}
