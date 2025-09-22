import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { clearLocalStorageData, getLocalStorageData, isDevelopment } from '../utils/apiService';
import { useApp } from '../context/AppContext';
import { GameResultDialog } from './GameResultDialog';

interface DebugMenuProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function DebugMenu({ isVisible, onToggle }: DebugMenuProps) {
  const { state } = useApp();
  const [localData, setLocalData] = useState(getLocalStorageData());
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testMatch, setTestMatch] = useState<any>(null);

  if (!isDevelopment) {
    return null;
  }

  const handleClearLocalStorage = () => {
    clearLocalStorageData();
    setLocalData(null);
    // Refresh the page to reload without localStorage data
    window.location.reload();
  };

  const refreshLocalData = () => {
    setLocalData(getLocalStorageData());
  };
  
  const openTestGameResultDialog = () => {
    // Create a test match with sample data
    if (state.players.length >= 2) {
      // Use existing players if available
      const player1 = state.players[0];
      const player2 = state.players[1];
      
      const testMatchData = {
        id: "test-match-id",
        player1,
        player2,
        status: 'completed',
        winner: player1,
        loser: player2,
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        endTime: new Date(),
        eloChanges: {
          player1Change: 15,
          player2Change: -15
        }
      };
      
      setTestMatch(testMatchData);
      setShowTestDialog(true);
    } else {
      // Create fake players if no players exist
      const player1 = {
        id: "test-player-1",
        name: "Test Player 1",
        elo: 1200,
        wins: 5,
        losses: 2,
        totalGames: 7,
        createdAt: new Date(),
        betsPlaced: 0,
        betsWon: 0,
        totalPointsEarned: 0,
        bettingPool: 100
      };
      
      const player2 = {
        id: "test-player-2",
        name: "Test Player 2",
        elo: 1150,
        wins: 2,
        losses: 5,
        totalGames: 7,
        createdAt: new Date(),
        betsPlaced: 0,
        betsWon: 0,
        totalPointsEarned: 0,
        bettingPool: 100
      };
      
      const testMatchData = {
        id: "test-match-id",
        player1,
        player2,
        status: 'completed',
        winner: player1,
        loser: player2,
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        endTime: new Date(),
        eloChanges: {
          player1Change: 15,
          player2Change: -15
        }
      };
      
      setTestMatch(testMatchData);
      setShowTestDialog(true);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button 
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="bg-yellow-100 hover:bg-yellow-200 border-yellow-400 text-yellow-800"
        >
          🛠️ Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80">
      {/* Test Game Result Dialog */}
      <GameResultDialog 
        isOpen={showTestDialog}
        onClose={() => setShowTestDialog(false)}
        match={testMatch}
        onRematch={() => {
          alert("Rematch requested in test mode");
          setShowTestDialog(false);
        }}
      />
      
      <Card className="border-yellow-400 bg-yellow-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-yellow-800">
                🛠️ Debug Menu
              </CardTitle>
              <CardDescription className="text-xs text-yellow-600">
                Development tools
              </CardDescription>
            </div>
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-yellow-600 hover:bg-yellow-200"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 text-xs">
          {/* Environment Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-yellow-800">Environment:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Development
              </Badge>
            </div>
            <div className="text-yellow-700">
              Storage: localStorage
            </div>
          </div>

          {/* Current State */}
          <div className="space-y-1">
            <div className="font-medium text-yellow-800">Current State:</div>
            <div className="text-yellow-700 space-y-0.5">
              <div>Players: {state.players.length}</div>
              <div>Matches: {state.matches.length}</div>
              <div>Bets: {state.bets.length}</div>
              {state.lastSaved && (
                <div>Last saved: {formatDate(state.lastSaved)}</div>
              )}
            </div>
          </div>

          {/* LocalStorage Info */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-yellow-800">LocalStorage:</span>
              <Button
                onClick={refreshLocalData}
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs text-yellow-600 hover:bg-yellow-200"
              >
                Refresh
              </Button>
            </div>
            <div className="text-yellow-700">
              {localData ? (
                <div className="space-y-0.5">
                  <div>✓ Data found</div>
                  <div>Players: {localData.players?.length || 0}</div>
                  <div>Matches: {localData.matches?.length || 0}</div>
                  <div>Bets: {localData.bets?.length || 0}</div>
                  {localData.lastSaved && (
                    <div>Saved: {formatDate(localData.lastSaved)}</div>
                  )}
                </div>
              ) : (
                <div>✗ No data found</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-yellow-200">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full h-7 text-xs"
                  disabled={!localData}
                >
                  Clear LocalStorage
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear LocalStorage Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all saved game data from your browser's local storage 
                    and refresh the page. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearLocalStorage}>
                    Clear & Refresh
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              onClick={() => window.location.reload()}
              variant="outline" 
              size="sm" 
              className="w-full h-7 text-xs"
            >
              Refresh Page
            </Button>
            
            <Button 
              onClick={openTestGameResultDialog}
              variant="outline" 
              size="sm" 
              className="w-full h-7 text-xs bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800"
            >
              Test Game Result Dialog
            </Button>
          </div>

          {/* Debug Info */}
          <div className="pt-2 border-t border-yellow-200 text-yellow-600">
            <div className="font-medium">Debug Info:</div>
            <div className="space-y-0.5 text-xs">
              <div>Mode: {import.meta.env.MODE}</div>
              <div>DEV: {import.meta.env.DEV ? 'true' : 'false'}</div>
              <div>Base URL: {import.meta.env.BASE_URL}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
