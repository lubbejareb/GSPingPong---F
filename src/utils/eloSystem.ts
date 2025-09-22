import type { Player, EloCalculationResult } from '../types';

// ELO constants based on chess.com system
const K_FACTOR = 32; // Standard K-factor for rating changes
const DEFAULT_ELO = 1200; // Starting ELO rating

/**
 * Calculate expected score for a player based on ELO difference
 * Formula: 1 / (1 + 10^((opponentElo - playerElo) / 400))
 */
function calculateExpectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Calculate new ELO ratings after a match
 * Based on the standard ELO rating system used in chess
 */
export function calculateEloChange(
  player1: Player,
  player2: Player,
  player1Won: boolean
): EloCalculationResult {
  const player1Expected = calculateExpectedScore(player1.elo, player2.elo);
  const player2Expected = calculateExpectedScore(player2.elo, player1.elo);

  const player1Score = player1Won ? 1 : 0;
  const player2Score = player1Won ? 0 : 1;

  const player1Change = Math.round(K_FACTOR * (player1Score - player1Expected));
  const player2Change = Math.round(K_FACTOR * (player2Score - player2Expected));

  // Ensure ELO doesn't go below a minimum threshold
  const MIN_ELO = 100;
  const newPlayer1Elo = Math.max(MIN_ELO, player1.elo + player1Change);
  const newPlayer2Elo = Math.max(MIN_ELO, player2.elo + player2Change);

  return {
    newPlayer1Elo,
    newPlayer2Elo,
    player1Change,
    player2Change,
  };
}

/**
 * Get the probability of player1 winning against player2
 */
export function getWinProbability(player1Elo: number, player2Elo: number): number {
  return calculateExpectedScore(player1Elo, player2Elo);
}

/**
 * Create a new player with default ELO
 */
export function createPlayer(name: string, id: string): Player {
  const STARTING_BETTING_POOL = 2500;
  
  return {
    id,
    name,
    elo: DEFAULT_ELO,
    wins: 0,
    losses: 0,
    totalGames: 0,
    createdAt: new Date(),
    betsPlaced: 0,
    betsWon: 0,
    totalPointsEarned: 0,
    bettingPool: STARTING_BETTING_POOL,
  };
}

/**
 * Update player stats after a match
 */
export function updatePlayerStats(player: Player, won: boolean, eloChange: number): Player {
  const MIN_ELO = 100;
  return {
    ...player,
    elo: Math.max(MIN_ELO, player.elo + eloChange),
    wins: won ? player.wins + 1 : player.wins,
    losses: won ? player.losses : player.losses + 1,
    totalGames: player.totalGames + 1,
  };
}
