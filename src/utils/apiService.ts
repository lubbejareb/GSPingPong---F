import type { Player, Match } from '../types';

export interface GameData {
  players: Player[];
  matches: Match[];
  lastSaved: string;
}

// Rate limiting configuration
const SAVE_THROTTLE_MS = 60000; // 1 minute between saves

// PRIORITY SAVE FEATURE:
// The saveGameData function now accepts a 'priority' parameter.
// Priority saves bypass client-side throttling and server-side rate limiting
// to ensure immediate persistence of critical data like match completions.
let lastSaveTime = 0;
let pendingSaveData: GameData | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export interface SaveResponse {
  success: boolean;
  url?: string;
  savedAt?: string;
  error?: string;
  throttled?: boolean;
  priority?: boolean;
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

export const saveGameData = async (gameData: Omit<GameData, 'lastSaved'>, priority: boolean = false): Promise<SaveResponse> => {
  try {
    console.log('🔄 Save operation initiated');
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

    // Store the latest data to be saved
    pendingSaveData = dataToSave;
    
    // If this is a priority save, bypass throttling
    if (priority) {
      console.log('🚨 Priority save - bypassing throttling');
      return await executeSave(dataToSave, true);
    }
    
    // If we're within the throttle window, schedule a save for later
    const now = Date.now();
    const timeUntilNextSave = Math.max(0, SAVE_THROTTLE_MS - (now - lastSaveTime));
    
    if (timeUntilNextSave > 0) {
      console.log(`⏱️ Save throttled. Next save in ${Math.round(timeUntilNextSave/1000)}s`);
      // Clear any existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // Return early with a success response but indicate it's pending
      const pendingResponse: SaveResponse = {
        success: true,
        savedAt: dataToSave.lastSaved,
        // Add a note that this is throttled (won't be visible to user)
        url: 'throttled'
      };
      
      // Schedule the actual save
      saveTimeout = setTimeout(() => {
        console.log('⏰ Executing delayed save operation');
        executeSave(dataToSave, false);
      }, timeUntilNextSave);
      
      return pendingResponse;
    }
    
    // If we're outside the throttle window, save immediately
    console.log('💾 Executing immediate save operation');
    return await executeSave(dataToSave, false);
  } catch (error) {
    console.error('Error saving game data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to execute the actual save operation
const executeSave = async (dataToSave: GameData, priority: boolean = false): Promise<SaveResponse> => {
  try {
    console.log('📤 Sending save request to server...');
    const response = await fetch('/api/save-game-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameData: dataToSave, priority }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to save game data');
    }

    // Update the last save time
    lastSaveTime = Date.now();
    pendingSaveData = null;
    
    console.log('✅ Save completed successfully', {
      savedAt: result.savedAt,
      throttled: result.throttled,
      priority: result.priority,
      timestamp: new Date().toLocaleTimeString()
    });
    
    return result;
  } catch (error) {
    console.error('Error executing save:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Cache the loaded data to reduce API calls
let cachedGameData: LoadResponse | null = null;
let lastLoadTime = 0;
const LOAD_CACHE_MS = 30000; // 30 seconds cache

export const loadGameData = async (forceRefresh = false): Promise<LoadResponse> => {
  try {
    // Check if we have pending save data that hasn't been persisted yet
    if (pendingSaveData && !forceRefresh) {
      return {
        success: true,
        data: pendingSaveData,
        message: 'Data loaded from pending save'
      };
    }
    
    // Check if we have cached data that's still fresh
    const now = Date.now();
    if (cachedGameData && !forceRefresh && (now - lastLoadTime < LOAD_CACHE_MS)) {
      return cachedGameData;
    }
    
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
    
    // Cache the result
    cachedGameData = result;
    lastLoadTime = now;

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

// Force a save operation immediately, bypassing throttling
export const forceSaveGameData = async (gameData: Omit<GameData, 'lastSaved'>): Promise<SaveResponse> => {
  console.log('🔴 Force save operation initiated - using priority save');
  return await saveGameData(gameData, true);
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
