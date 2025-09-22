import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Coins, Clock, Users, Target, Timer, AlertTriangle, Flag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GameResultDialog } from './GameResultDialog';
import { WinnerSelectionDialog } from './WinnerSelectionDialog';
import type { Match } from '../types';
import { Button } from '@/components/ui/button';

export function LiveMatch() {
  const { state, dispatch } = useApp();
  const [selectedBettor, setSelectedBettor] = useState('');
  const [betPoints, setBetPoints] = useState<number>(10);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [bettingTimeLeft, setBettingTimeLeft] = useState<number>(0);
  const [betError, setBetError] = useState('');
  const [showGameResult, setShowGameResult] = useState(false);
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [completedMatch, setCompletedMatch] = useState<Match | null>(null);
  
  const BETTING_WINDOW_SECONDS = 30; // 30 seconds

  const currentMatch = state.currentMatch;
  const matchBets = currentMatch ? state.bets.filter(bet => bet.matchId === currentMatch.id) : [];
  
  // Calculate betting time remaining
  useEffect(() => {
    if (!currentMatch?.startTime) {
      setBettingTimeLeft(0);
      return;
    }
    
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - currentMatch.startTime!.getTime()) / 1000);
      const remaining = Math.max(0, BETTING_WINDOW_SECONDS - elapsed);
      setBettingTimeLeft(remaining);
    };
    
    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [currentMatch?.startTime, BETTING_WINDOW_SECONDS]);
  
  const isBettingOpen = bettingTimeLeft > 0;

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

  const handlePlaceBet = (e: React.FormEvent) => {
    e.preventDefault();
    setBetError('');
    
    const MIN_BET = 10;
    const MAX_BET = 100;
    
    const selectedPlayer = state.players.find(p => p.id === selectedBettor);
    
    if (!selectedPlayer) {
      setBetError('Please select a player.');
      return;
    }
    
    if (!selectedWinner) {
      setBetError('Please select a predicted winner.');
      return;
    }
    
    if (betPoints < MIN_BET) {
      setBetError(`Minimum bet is ${MIN_BET} points.`);
      return;
    }
    
    if (betPoints > MAX_BET) {
      setBetError(`Maximum bet is ${MAX_BET} points.`);
      return;
    }
    
    if (betPoints > selectedPlayer.bettingPool) {
      setBetError(`Insufficient funds. You have ${selectedPlayer.bettingPool} points available.`);
      return;
    }
    
    if (!isBettingOpen) {
      setBetError('Betting window has closed.');
      return;
    }
    
    if (currentMatch) {
      dispatch({
        type: 'PLACE_BET',
        payload: {
          matchId: currentMatch.id,
          bettorId: selectedBettor,
          predictedWinnerId: selectedWinner,
          points: betPoints
        }
      });
      setSelectedBettor('');
      setBetPoints(10);
      setSelectedWinner('');
      setBetError('');
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

  const elapsedTime = currentMatch.startTime 
    ? Math.floor((Date.now() - currentMatch.startTime.getTime()) / 1000)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatBettingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalBetsPlayer1 = matchBets
    .filter(bet => bet.predictedWinnerId === currentMatch.player1.id)
    .reduce((sum, bet) => sum + bet.points, 0);

  const totalBetsPlayer2 = matchBets
    .filter(bet => bet.predictedWinnerId === currentMatch.player2.id)
    .reduce((sum, bet) => sum + bet.points, 0);

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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1">
                <Clock size={16} />
                <span className="font-mono text-lg font-semibold">{formatTime(elapsedTime)}</span>
              </div>
              <div className={`flex items-center gap-2 backdrop-blur-sm rounded-xl px-3 py-1 transition-colors ${
                isBettingOpen 
                  ? 'bg-green-500/30 text-green-100 animate-pulse' 
                  : 'bg-red-500/30 text-red-100'
              }`}>
                <Timer size={16} />
                <div className="text-center">
                  <div className="font-mono font-bold text-sm">
                    {isBettingOpen ? formatBettingTime(bettingTimeLeft) : 'CLOSED'}
                  </div>
                  <div className="text-xs opacity-90">
                    {isBettingOpen ? 'Betting Open' : 'Betting Closed'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-xl font-bold mb-1">{currentMatch.player1.name}</div>
              <div className="text-blue-100 mb-3">ELO: {currentMatch.player1.elo}</div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm py-0.5 px-3">
                {totalBetsPlayer1} betting points
              </Badge>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-xl font-bold mb-1">{currentMatch.player2.name}</div>
              <div className="text-blue-100 mb-3">ELO: {currentMatch.player2.elo}</div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm py-0.5 px-3">
                {totalBetsPlayer2} betting points
              </Badge>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGameFinished}
              className="flex-1 bg-white hover:bg-blue-50 text-blue-700 font-medium border-2 border-white shadow-lg shadow-blue-900/20 py-5 transition-all"
            >
              <Flag className="mr-2 h-5 w-5 text-blue-600" />
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

      {/* Live Betting */}
      <Card className={`border-0 shadow-none bg-transparent ${!isBettingOpen ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-2xl">
              <div className={`p-2 rounded-xl ${isBettingOpen 
                ? 'bg-gradient-to-br from-blue-400 to-indigo-500' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                <Coins className="text-white" size={24} />
              </div>
              Live Betting
            </div>
            {!isBettingOpen && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle size={12} />
                Betting Closed
              </Badge>
            )}
          </CardTitle>
          <CardDescription className={`text-base ${!isBettingOpen ? 'text-red-600' : ''}`}>
            {isBettingOpen 
              ? 'Place your bets on who you think will win this match' 
              : 'Betting is only available for the first 30 seconds after a match starts.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

        <Card className="border border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handlePlaceBet} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Select Player</label>
                  <Select value={selectedBettor} onValueChange={setSelectedBettor} required disabled={!isBettingOpen}>
                    <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Choose a player..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {state.players.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{player.name}</span>
                            <Badge variant="outline" className={`ml-2 text-xs ${
                              player.bettingPool < 10 ? 'bg-red-50 text-red-600 border-red-200' : 
                              player.bettingPool < 100 ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 
                              'bg-blue-50 text-blue-600 border-blue-200'
                            }`}>
                              Pool: {player.bettingPool}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">
                    Bet Points 
                    {selectedBettor && (
                      <span className="text-slate-500 font-normal">
                        (Available: {state.players.find(p => p.id === selectedBettor)?.bettingPool || 0})
                      </span>
                    )}
                  </label>
                  <Input
                    type="number"
                    value={betPoints}
                    onChange={(e) => setBetPoints(Number(e.target.value))}
                    min="10"
                    max={selectedBettor ? Math.min(100, state.players.find(p => p.id === selectedBettor)?.bettingPool || 0) : 100}
                    step="10"
                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                    disabled={!isBettingOpen}
                  />
                  <p className="text-xs text-slate-500">
                    Min: 10 points | Max: 100 points
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Predicted Winner</label>
                  <Select value={selectedWinner} onValueChange={setSelectedWinner} required disabled={!isBettingOpen}>
                    <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select winner..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value={currentMatch.player1.id}>{currentMatch.player1.name}</SelectItem>
                      <SelectItem value={currentMatch.player2.id}>{currentMatch.player2.name}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {betError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{betError}</p>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg text-white"
                disabled={!isBettingOpen}
              >
                <Coins className="mr-2 h-5 w-5" />
                Place Bet
              </Button>
            </form>
          </CardContent>
        </Card>
        </CardContent>
      </Card>

      {/* Current Bets */}
      {matchBets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-blue-500" />
              Current Bets ({matchBets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-2">
            {matchBets.map(bet => {
              const predictedPlayer = bet.predictedWinnerId === currentMatch.player1.id 
                ? currentMatch.player1 
                : currentMatch.player2;
              
              const bettorPlayer = state.players.find(p => p.id === bet.bettorId);
              
              return (
                <div key={bet.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <span className="font-medium">{bettorPlayer?.name || 'Unknown Player'}</span>
                    <span className="text-gray-600 ml-2">
                      bets on <span className="font-medium">{predictedPlayer.name}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="font-semibold text-blue-600">
                      {bet.points} points
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {bet.placedAt.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
