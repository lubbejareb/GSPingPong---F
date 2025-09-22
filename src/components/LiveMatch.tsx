import { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { Target, AlertTriangle, Flag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { GameResultDialog } from './GameResultDialog';
import { WinnerSelectionDialog } from './WinnerSelectionDialog';
import type { Match } from '../types';
import { Button } from '@/components/ui/button';

export function LiveMatch() {
  const { state, dispatch } = useApp();
  const [showGameResult, setShowGameResult] = useState(false);
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [completedMatch, setCompletedMatch] = useState<Match | null>(null);

  const currentMatch = state.currentMatch;
  

  const handleCompleteMatch = (winnerId: string) => {
    if (currentMatch) {
      // Store match data before completing it
      const matchId = currentMatch.id;
      const matchCopy = {...currentMatch};
      
      // Complete the match
      dispatch({
        type: 'COMPLETE_MATCH',
        payload: { matchId, winnerId }
      });
      
      // Find the completed match after state update
      setTimeout(() => {
        // Look for the match in the updated state
        const completedMatchInState = state.matches.find(m => 
          m.id === matchId && m.status === 'completed'
        );
        
        if (completedMatchInState) {
          setCompletedMatch(completedMatchInState);
          setShowGameResult(true);
        } else {
          // If we can't find it, manually construct a completed match
          const player1 = state.players.find(p => p.id === matchCopy.player1.id) || matchCopy.player1;
          const player2 = state.players.find(p => p.id === matchCopy.player2.id) || matchCopy.player2;
          
          // Determine winner and loser
          const winner = winnerId === player1.id ? player1 : player2;
          const loser = winnerId === player1.id ? player2 : player1;
          
          // Calculate ELO changes (approximation)
          const player1IsWinner = winnerId === player1.id;
          const eloChange = Math.abs(player1.elo - matchCopy.player1.elo);
          
          const syntheticMatch = {
            ...matchCopy,
            status: 'completed' as const,
            player1,
            player2,
            winner,
            loser,
            endTime: new Date(),
            eloChanges: {
              player1Change: player1IsWinner ? eloChange : -eloChange,
              player2Change: player1IsWinner ? -eloChange : eloChange
            }
          };
          
          setCompletedMatch(syntheticMatch);
          setShowGameResult(true);
        }
      }, 200);
    }
  };
  
  // Effect to find the completed match in state after it's updated
  useEffect(() => {
    // Only look for completed matches if we don't already have one showing
    if (!showGameResult && completedMatch === null) {
      // Look for the most recently completed match
      const lastCompletedMatch = [...state.matches]
        .reverse()
        .find(m => m.status === 'completed' && m.endTime);
        
      // Show the result if the match was completed recently (within 5 seconds)
      if (lastCompletedMatch && 
          lastCompletedMatch.endTime && 
          (Date.now() - lastCompletedMatch.endTime.getTime() < 5000)) {
        setCompletedMatch(lastCompletedMatch);
        setShowGameResult(true);
      }
    }
  }, [state.matches, showGameResult, completedMatch]);

  const handleCancelMatch = () => {
    if (currentMatch && confirm('Are you sure you want to cancel this match?')) {
      dispatch({
        type: 'CANCEL_MATCH',
        payload: { matchId: currentMatch.id }
      });
    }
  };
  
  const handleRematch = () => {
    if (completedMatch) {
      // Create a new match with the same players
      dispatch({
        type: 'CREATE_MATCH',
        payload: { 
          player1Id: completedMatch.player1.id, 
          player2Id: completedMatch.player2.id 
        }
      });
      
      // Close the dialog
      setShowGameResult(false);
      setCompletedMatch(null);
      
      // Start the match immediately
      const newMatch = state.matches[state.matches.length - 1];
      if (newMatch) {
        dispatch({
          type: 'START_MATCH',
          payload: { matchId: newMatch.id }
        });
      }
    }
  };
  
  const handleGameFinished = () => {
    if (currentMatch) {
      setShowWinnerSelection(true);
    }
  };


  if (!currentMatch) {
    return (
      <Card className="border border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target size={40} className="text-slate-500" />
          </div>
          <CardTitle className="text-xl text-slate-700 mb-3">No Active Match</CardTitle>
          <CardDescription className="text-base text-slate-500 max-w-md mx-auto">
            Start a match from the Matchmaking section to begin live betting and real-time score tracking!
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  


  return (
    <div className="space-y-6">
      {/* Winner Selection Dialog */}
      <WinnerSelectionDialog
        isOpen={showWinnerSelection}
        onClose={() => setShowWinnerSelection(false)}
        match={currentMatch}
        onSelectWinner={handleCompleteMatch}
      />
      
      {/* Game Result Dialog */}
      <GameResultDialog 
        isOpen={showGameResult}
        onClose={() => {
          setShowGameResult(false);
          setCompletedMatch(null);
        }}
        match={completedMatch}
        onRematch={handleRematch}
      />
      
      {/* Live Match Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-lg">🏓</span>
              </div>
              <h2 className="text-2xl font-bold">Live Match</h2>
            </div>          
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-xl font-bold mb-1">{currentMatch.player1.name}</div>
              <div className="text-blue-100 mb-3">ELO: {currentMatch.player1.elo}</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-xl font-bold mb-1">{currentMatch.player2.name}</div>
              <div className="text-blue-100 mb-3">ELO: {currentMatch.player2.elo}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGameFinished}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white-700 font-medium border-2 shadow-lg  py-5 transition-all"
            >
              <Flag className="mr-2 h-5 w-5 text-white-600" />
              Game Finished
            </Button>
            <Button
              onClick={handleCancelMatch}
              className="flex-1 bg-red-400 hover:bg-red-600 text-white shadow-lg transition-all py-5"
            >
              <AlertTriangle className="mr-2 h-5 w-5" />
              Cancel Match
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
