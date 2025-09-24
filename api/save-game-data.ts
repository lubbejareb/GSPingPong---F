import { put, list } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Server-side rate limiting
const MIN_SAVE_INTERVAL_MS = 60000; // 1 minute

// PRIORITY SAVE FEATURE:
// Regular saves are throttled to prevent excessive Vercel Blob operations.
// Priority saves (e.g., match completions) bypass throttling to ensure
// immediate persistence of critical game data.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameData, priority } = req.body;
    
    if (!gameData) {
      return res.status(400).json({ error: 'No game data provided' });
    }
    
    // Check if this is a priority save (e.g., match completion)
    const isPrioritySave = priority === true;
    console.log(`📊 Save request received - Priority: ${isPrioritySave}`);
    
    // Check when the last save occurred (only apply throttling for non-priority saves)
    if (!isPrioritySave) {
      const { blobs } = await list();
      const gameDataBlob = blobs.find(blob => blob.pathname === 'pingpong-game-data.json');
      
      if (gameDataBlob) {
        const lastSaveTime = new Date(gameDataBlob.uploadedAt).getTime();
        const now = Date.now();
        const timeSinceLastSave = now - lastSaveTime;
        
        // If the last save was too recent, return success but don't actually save
        // This prevents excessive Vercel Blob operations
        if (timeSinceLastSave < MIN_SAVE_INTERVAL_MS) {
          console.log(`⏱️ Regular save throttled - ${Math.round((MIN_SAVE_INTERVAL_MS - timeSinceLastSave)/1000)}s remaining`);
          // Return success but indicate it was throttled
          return res.status(200).json({
            success: true,
            throttled: true,
            url: gameDataBlob.url,
            savedAt: gameDataBlob.uploadedAt,
            message: 'Save throttled to reduce API operations'
          });
        }
      }
    }

    // Ensure data structure is clean and consistent
    const cleanedData = {
      players: gameData.players || [],
      matches: gameData.matches || [],
      lastSaved: gameData.lastSaved || new Date().toISOString()
    };

    // Save the game data as JSON to Vercel Blob
    console.log(`💾 Executing ${isPrioritySave ? 'PRIORITY' : 'regular'} save to Vercel Blob`);
    const blob = await put('pingpong-game-data.json', JSON.stringify(cleanedData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });

    return res.status(200).json({ 
      success: true, 
      url: blob.url,
      savedAt: new Date().toISOString(),
      priority: isPrioritySave
    });
  } catch (error) {
    console.error('Error saving game data:', error);
    return res.status(500).json({ 
      error: 'Failed to save game data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
