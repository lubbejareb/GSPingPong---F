import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gameData = req.body;
    
    if (!gameData) {
      return res.status(400).json({ error: 'No game data provided' });
    }

    // Save the game data as JSON to Vercel Blob
    const blob = await put('pingpong-game-data.json', JSON.stringify(gameData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });

    return res.status(200).json({ 
      success: true, 
      url: blob.url,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving game data:', error);
    return res.status(500).json({ 
      error: 'Failed to save game data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
