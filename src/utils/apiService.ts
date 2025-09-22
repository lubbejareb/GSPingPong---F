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

export const saveGameData = async (gameData: Omit<GameData, 'lastSaved'>): Promise<SaveResponse> => {
  try {
    const dataToSave: GameData = {
      ...gameData,
      lastSaved: new Date().toISOString()
    };

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
