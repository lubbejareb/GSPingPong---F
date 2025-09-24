import React, { createContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Player, Match } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { calculateEloChange, updatePlayerStats, createPlayer } from '../utils/eloSystem';
import { saveGameData, loadGameData, forceSaveGameData, type GameData } from '../utils/apiService';

interface AppState {
  players: Player[];
  matches: Match[];
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
  | { type: 'SET_CURRENT_MATCH'; payload: { match: Match | null } }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_SAVING'; payload: { isSaving: boolean } }
  | { type: 'LOAD_DATA_SUCCESS'; payload: { data: GameData } }
  | { type: 'SAVE_DATA_SUCCESS'; payload: { savedAt: string } }
  | { type: 'SET_ERROR'; payload: { error: string | null } };

const initialState: AppState = {
  players: [],
  matches: [],
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


      // Clear current match if it involves the deleted player
      const newCurrentMatch = state.currentMatch && 
        (state.currentMatch.player1.id === playerId || state.currentMatch.player2.id === playerId) 
        ? null 
        : state.currentMatch;

      return {
        ...state,
        players: state.players.filter(p => p.id !== playerId),
        matches: updatedMatches,
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

      const playersWithUpdatedStats = state.players.map(player => {
        if (player.id === match.player1.id) return updatedPlayer1;
        if (player.id === match.player2.id) return updatedPlayer2;
        return player;
      });

      return {
        ...state,
        players: playersWithUpdatedStats,
        matches: state.matches.map(m => m.id === action.payload.matchId ? completedMatch : m),
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
    console.log('💾 Save data requested from AppContext');
    dispatch({ type: 'SET_SAVING', payload: { isSaving: true } });
    
      try {
        console.log('📁 Saving data with:', {
          players: state.players.length,
          matches: state.matches.length
        });
        
        const result = await saveGameData({
          players: state.players,
          matches: state.matches
        });
      
      if (result.success && result.savedAt) {
        console.log('✅ Save successful in AppContext', {
          savedAt: result.savedAt,
          isThrottled: result.url === 'throttled'
        });
        dispatch({ type: 'SAVE_DATA_SUCCESS', payload: { savedAt: result.savedAt } });
      } else {
        console.error('❌ Save failed in AppContext', result);
        throw new Error(result.error || 'Failed to save data');
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { error: error instanceof Error ? error.message : 'Failed to save data' }
      });
    }
  }, [state.players, state.matches]);

  // Auto-save when matches are completed
  useEffect(() => {
    const lastMatch = state.matches[state.matches.length - 1];
    if (lastMatch && lastMatch.status === 'completed') {
      // Only auto-save if we're not already saving and there's no error
      if (!state.isSaving && !state.error) {
        console.log('🏆 Auto-saving after match completion');
        saveData();
      }
    }
  }, [state.matches, state.isSaving, state.error, saveData]);
  
  // Force save on component unmount to ensure data is persisted
  useEffect(() => {
    return () => {
      // Check if we have unsaved changes
      if (state.players.length > 0 || state.matches.length > 0) {
        console.log('🔴 Force saving on app unmount');
        forceSaveGameData({
          players: state.players,
          matches: state.matches
        }).catch(error => console.error('Error during force save on unmount:', error));
      }
    };
  }, [state.players, state.matches]);

  return (
    <AppContext.Provider value={{ state, dispatch, saveData }}>
      {children}
    </AppContext.Provider>
  );
}

export { AppContext };