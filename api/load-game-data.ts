import { list } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // List blobs to find the latest game data file
    const { blobs } = await list();
    const gameDataBlob = blobs.find(blob => blob.pathname === 'pingpong-game-data.json');
    
    if (!gameDataBlob) {
      // No saved data exists yet
      return res.status(200).json({ 
        success: true, 
        data: null,
        message: 'No saved game data found'
      });
    }

    // Fetch the blob content
    const response = await fetch(gameDataBlob.url);
    const gameData = await response.json();
    
    return res.status(200).json({ 
      success: true, 
      data: gameData,
      lastModified: gameDataBlob.uploadedAt
    });
  } catch (error) {
    console.error('Error loading game data:', error);
    return res.status(500).json({ 
      error: 'Failed to load game data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
