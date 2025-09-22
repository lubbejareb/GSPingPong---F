import type { Player, Match, Bet } from '../types';

export interface GameData {
  players: Player[];
  matches: Match[];
  bets: Bet[];
  lastSaved: string;
}

export interface SaveResponse {
  success: boolean;
  url?: string;
  savedAt?: string;
  error?: string;
}

export interface LoadResponse {
  success: boolean;
  data: GameData | null;
  message?: string;
  lastModified?: string;
  error?: string;
}

// Environment detection
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
const STORAGE_KEY = 'pingpong-game-data';

export const saveGameData = async (gameData: Omit<GameData, 'lastSaved'>): Promise<SaveResponse> => {
  try {
    const dataToSave: GameData = {
      ...gameData,
      lastSaved: new Date().toISOString()
    };

    // Use localStorage in development mode
    if (isDevelopment) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('Game data saved to localStorage (development mode)');
      return {
        success: true,
        savedAt: dataToSave.lastSaved
      };
    }

    const response = await fetch('/api/save-game-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to save game data');
    }

    return result;
  } catch (error) {
    console.error('Error saving game data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const loadGameData = async (): Promise<LoadResponse> => {
  try {
    // Use localStorage in development mode
    if (isDevelopment) {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          console.log('Game data loaded from localStorage (development mode)');
          return {
            success: true,
            data,
            message: 'Data loaded from localStorage'
          };
        } catch (parseError) {
          console.error('Error parsing localStorage data:', parseError);
          // Clear corrupted data
          localStorage.removeItem(STORAGE_KEY);
          return {
            success: true,
            data: null,
            message: 'No valid saved data found in localStorage'
          };
        }
      } else {
        return {
          success: true,
          data: null,
          message: 'No saved data found in localStorage'
        };
      }
    }

    const response = await fetch('/api/load-game-data');
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to load game data');
    }

    return result;
  } catch (error) {
    console.error('Error loading game data:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Debug utilities for development
export const clearLocalStorageData = (): void => {
  if (isDevelopment) {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Local storage data cleared');
  }
};

export const getLocalStorageData = (): GameData | null => {
  if (isDevelopment) {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
        return null;
      }
    }
  }
  return null;
};

export { isDevelopment };
