export interface Player {
  id: string;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  totalGames: number;
  createdAt: Date;
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

export interface EloCalculationResult {
  newPlayer1Elo: number;
  newPlayer2Elo: number;
  player1Change: number;
  player2Change: number;
}
