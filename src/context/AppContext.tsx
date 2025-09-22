import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Player, Match, Bet } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateEloChange, updatePlayerStats, createPlayer } from '../utils/eloSystem';

interface AppState {
  players: Player[];
  matches: Match[];
  bets: Bet[];
  currentMatch: Match | null;
}

type AppAction =
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'DELETE_PLAYER'; payload: { playerId: string } }
  | { type: 'CREATE_MATCH'; payload: { player1Id: string; player2Id: string } }
  | { type: 'START_MATCH'; payload: { matchId: string } }
  | { type: 'COMPLETE_MATCH'; payload: { matchId: string; winnerId: string } }
  | { type: 'CANCEL_MATCH'; payload: { matchId: string } }
  | { type: 'PLACE_BET'; payload: { matchId: string; bettorId: string; predictedWinnerId: string; points: number } }
  | { type: 'SET_CURRENT_MATCH'; payload: { match: Match | null } };

const initialState: AppState = {
  players: [],
  matches: [],
  bets: [],
  currentMatch: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_PLAYER': {
      const playerName = action.payload.name.trim();
      
      // Check for duplicate names (case-insensitive)
      const existingPlayer = state.players.find(p => 
        p.name.toLowerCase() === playerName.toLowerCase()
      );
      
      if (existingPlayer) {
        // Return state unchanged if player name already exists
        return state;
      }
      
      const newPlayer = createPlayer(playerName, uuidv4());
      return {
        ...state,
        players: [...state.players, newPlayer],
      };
    }

    case 'DELETE_PLAYER': {
      const playerId = action.payload.playerId;
      
      // Cancel all pending matches involving this player
      const updatedMatches = state.matches.map(match => {
        if ((match.player1.id === playerId || match.player2.id === playerId) && 
            (match.status === 'pending' || match.status === 'in-progress')) {
          return { ...match, status: 'cancelled' as const };
        }
        return match;
      });

      // Cancel all active bets related to matches involving this player
      const updatedBets = state.bets.map(bet => {
        const relatedMatch = updatedMatches.find(m => m.id === bet.matchId);
        if (relatedMatch && 
            (relatedMatch.player1.id === playerId || relatedMatch.player2.id === playerId) && 
            bet.status === 'active') {
          return { ...bet, status: 'cancelled' as const };
        }
        return bet;
      });

      // Clear current match if it involves the deleted player
      const newCurrentMatch = state.currentMatch && 
        (state.currentMatch.player1.id === playerId || state.currentMatch.player2.id === playerId) 
        ? null 
        : state.currentMatch;

      return {
        ...state,
        players: state.players.filter(p => p.id !== playerId),
        matches: updatedMatches,
        bets: updatedBets,
        currentMatch: newCurrentMatch,
      };
    }

    case 'CREATE_MATCH': {
      const player1 = state.players.find(p => p.id === action.payload.player1Id);
      const player2 = state.players.find(p => p.id === action.payload.player2Id);
      
      if (!player1 || !player2) return state;

      const newMatch: Match = {
        id: uuidv4(),
        player1,
        player2,
        status: 'pending',
      };

      return {
        ...state,
        matches: [...state.matches, newMatch],
      };
    }

    case 'START_MATCH': {
      const match = state.matches.find(m => m.id === action.payload.matchId);
      if (!match) return state;

      const updatedMatch = {
        ...match,
        status: 'in-progress' as const,
        startTime: new Date(),
      };

      return {
        ...state,
        matches: state.matches.map(m => m.id === action.payload.matchId ? updatedMatch : m),
        currentMatch: updatedMatch,
      };
    }

    case 'COMPLETE_MATCH': {
      const match = state.matches.find(m => m.id === action.payload.matchId);
      if (!match) return state;

      const winner = match.player1.id === action.payload.winnerId ? match.player1 : match.player2;
      const loser = match.player1.id === action.payload.winnerId ? match.player2 : match.player1;
      
      const eloResult = calculateEloChange(match.player1, match.player2, match.player1.id === action.payload.winnerId);
      
      const updatedPlayer1 = updatePlayerStats(match.player1, match.player1.id === action.payload.winnerId, eloResult.player1Change);
      const updatedPlayer2 = updatePlayerStats(match.player2, match.player2.id === action.payload.winnerId, eloResult.player2Change);

      const completedMatch = {
        ...match,
        status: 'completed' as const,
        winner,
        loser,
        endTime: new Date(),
        eloChanges: {
          player1Change: eloResult.player1Change,
          player2Change: eloResult.player2Change,
        },
      };

      // Update bets and calculate winnings
      const updatedBets = state.bets.map(bet => {
        if (bet.matchId === action.payload.matchId) {
          const won = bet.predictedWinnerId === action.payload.winnerId;
          // For winning bets, return original bet + winnings (total payout)
          const pointsEarned = won ? Math.round(bet.points * bet.odds) : 0;
          return {
            ...bet,
            status: won ? 'won' as const : 'lost' as const,
            pointsEarned,
          };
        }
        return bet;
      });

      // Update betting stats for all bettors
      const playersWithUpdatedBetting = state.players.map(player => {
        // Start with the base player (or updated match player if applicable)
        let basePlayer = player;
        if (player.id === match.player1.id) basePlayer = updatedPlayer1;
        if (player.id === match.player2.id) basePlayer = updatedPlayer2;
        
        // Update betting stats for bettors
        const playerBets = updatedBets.filter(bet => bet.bettorId === player.id && bet.matchId === action.payload.matchId);
        if (playerBets.length > 0) {
          const newWins = playerBets.filter(bet => bet.status === 'won').length;
          const newPoints = playerBets.reduce((total, bet) => total + (bet.pointsEarned || 0), 0);
          
          return {
            ...basePlayer,
            betsWon: basePlayer.betsWon + newWins,
            totalPointsEarned: basePlayer.totalPointsEarned + newPoints,
            bettingPool: basePlayer.bettingPool + newPoints, // Add winnings back to betting pool
          };
        }
        
        return basePlayer;
      });

      return {
        ...state,
        players: playersWithUpdatedBetting,
        matches: state.matches.map(m => m.id === action.payload.matchId ? completedMatch : m),
        bets: updatedBets,
        currentMatch: state.currentMatch?.id === action.payload.matchId ? null : state.currentMatch,
      };
    }

    case 'CANCEL_MATCH': {
      return {
        ...state,
        matches: state.matches.map(m => 
          m.id === action.payload.matchId ? { ...m, status: 'cancelled' as const } : m
        ),
        currentMatch: state.currentMatch?.id === action.payload.matchId ? null : state.currentMatch,
      };
    }

    case 'PLACE_BET': {
      const match = state.matches.find(m => m.id === action.payload.matchId);
      if (!match || match.status !== 'in-progress') return state;

      // Find the bettor player
      const bettorPlayer = state.players.find(p => p.id === action.payload.bettorId);
      if (!bettorPlayer) return state;

      // Validate betting constraints
      const MAX_BET = 100;
      const betAmount = action.payload.points;
      
      if (betAmount > MAX_BET) return state; // Exceeds max bet limit
      if (betAmount > bettorPlayer.bettingPool) return state; // Insufficient funds

      // Calculate simple odds based on ELO difference (simplified)
      const eloDiff = Math.abs(match.player1.elo - match.player2.elo);
      const baseOdds = 1.5 + (eloDiff / 400); // Simple odds calculation

      const newBet: Bet = {
        id: uuidv4(),
        matchId: action.payload.matchId,
        bettorId: action.payload.bettorId,
        predictedWinnerId: action.payload.predictedWinnerId,
        points: betAmount,
        odds: baseOdds,
        status: 'active',
        placedAt: new Date(),
      };

      // Update bettor's betting stats and deduct bet amount from pool
      const updatedBettor = {
        ...bettorPlayer,
        betsPlaced: bettorPlayer.betsPlaced + 1,
        bettingPool: bettorPlayer.bettingPool - betAmount,
      };

      return {
        ...state,
        players: state.players.map(p => p.id === action.payload.bettorId ? updatedBettor : p),
        bets: [...state.bets, newBet],
      };
    }

    case 'SET_CURRENT_MATCH': {
      return {
        ...state,
        currentMatch: action.payload.match,
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
