import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Player, Match, Bet } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateEloChange, updatePlayerStats, createPlayer } from '../utils/eloSystem';
import { saveGameData, loadGameData, type GameData } from '../utils/apiService';

interface AppState {
  players: Player[];
  matches: Match[];
  bets: Bet[];
  currentMatch: Match | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: string | null;
  error: string | null;
}

type AppAction =
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'DELETE_PLAYER'; payload: { playerId: string } }
  | { type: 'CREATE_MATCH'; payload: { player1Id: string; player2Id: string } }
  | { type: 'START_MATCH'; payload: { matchId: string } }
  | { type: 'COMPLETE_MATCH'; payload: { matchId: string; winnerId: string } }
  | { type: 'CANCEL_MATCH'; payload: { matchId: string } }
  | { type: 'PLACE_BET'; payload: { matchId: string; bettorId: string; predictedWinnerId: string; points: number } }
  | { type: 'SET_CURRENT_MATCH'; payload: { match: Match | null } }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_SAVING'; payload: { isSaving: boolean } }
  | { type: 'LOAD_DATA_SUCCESS'; payload: { data: GameData } }
  | { type: 'SAVE_DATA_SUCCESS'; payload: { savedAt: string } }
  | { type: 'SET_ERROR'; payload: { error: string | null } };

const initialState: AppState = {
  players: [],
  matches: [],
  bets: [],
  currentMatch: null,
  isLoading: false,
  isSaving: false,
  lastSaved: null,
  error: null,
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

    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.payload.isLoading,
        error: null,
      };
    }

    case 'SET_SAVING': {
      return {
        ...state,
        isSaving: action.payload.isSaving,
        error: null,
      };
    }

    case 'LOAD_DATA_SUCCESS': {
      const { data } = action.payload;
      return {
        ...state,
        players: data.players || [],
        matches: data.matches || [],
        bets: data.bets || [],
        lastSaved: data.lastSaved || null,
        isLoading: false,
        error: null,
      };
    }

    case 'SAVE_DATA_SUCCESS': {
      return {
        ...state,
        lastSaved: action.payload.savedAt,
        isSaving: false,
        error: null,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
        isSaving: false,
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  saveData: () => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data on app initialization
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: true } });
      
      try {
        const result = await loadGameData();
        
        if (result.success && result.data) {
          // Convert date strings back to Date objects
          const processedData = {
            ...result.data,
            players: result.data.players.map(player => ({
              ...player,
              createdAt: new Date(player.createdAt)
            })),
            matches: result.data.matches.map(match => ({
              ...match,
              startTime: match.startTime ? new Date(match.startTime) : undefined,
              endTime: match.endTime ? new Date(match.endTime) : undefined,
              player1: {
                ...match.player1,
                createdAt: new Date(match.player1.createdAt)
              },
              player2: {
                ...match.player2,
                createdAt: new Date(match.player2.createdAt)
              }
            })),
            bets: result.data.bets.map(bet => ({
              ...bet,
              placedAt: new Date(bet.placedAt)
            }))
          };
          
          dispatch({ type: 'LOAD_DATA_SUCCESS', payload: { data: processedData } });
        } else {
          dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
      } catch (error) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: { error: error instanceof Error ? error.message : 'Failed to load data' }
        });
      }
    };

    loadInitialData();
  }, []);

  // Function to save data manually
  const saveData = useCallback(async () => {
    dispatch({ type: 'SET_SAVING', payload: { isSaving: true } });
    
    try {
      const result = await saveGameData({
        players: state.players,
        matches: state.matches,
        bets: state.bets
      });
      
      if (result.success && result.savedAt) {
        dispatch({ type: 'SAVE_DATA_SUCCESS', payload: { savedAt: result.savedAt } });
      } else {
        throw new Error(result.error || 'Failed to save data');
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { error: error instanceof Error ? error.message : 'Failed to save data' }
      });
    }
  }, [state.players, state.matches, state.bets]);

  // Auto-save when matches are completed
  useEffect(() => {
    const lastMatch = state.matches[state.matches.length - 1];
    if (lastMatch && lastMatch.status === 'completed') {
      // Only auto-save if we're not already saving and there's no error
      if (!state.isSaving && !state.error) {
        saveData();
      }
    }
  }, [state.matches, state.isSaving, state.error, saveData]);

  return (
    <AppContext.Provider value={{ state, dispatch, saveData }}>
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
