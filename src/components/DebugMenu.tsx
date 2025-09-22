import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { clearLocalStorageData, getLocalStorageData, isDevelopment } from '../utils/apiService';
import { useApp } from '../context/AppContext';

interface DebugMenuProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function DebugMenu({ isVisible, onToggle }: DebugMenuProps) {
  const { state } = useApp();
  const [localData, setLocalData] = useState(getLocalStorageData());

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
