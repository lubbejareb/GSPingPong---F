import { Trophy, ArrowRight, RotateCcw, X } from 'lucide-react';
import type { Match } from '../types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface GameResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onRematch: () => void;
}

export function GameResultDialog({ isOpen, onClose, match, onRematch }: GameResultDialogProps) {
  if (!match || !match.winner || !match.loser || !match.eloChanges) {
    return null;
  }

  const winner = match.winner;
  const loser = match.loser;
  const winnerEloChange = match.winner.id === match.player1.id 
    ? match.eloChanges.player1Change 
    : match.eloChanges.player2Change;
  const loserEloChange = match.loser.id === match.player1.id 
    ? match.eloChanges.player1Change 
    : match.eloChanges.player2Change;

  // Using a direct dialog approach
  if (!isOpen) {
    return null;
  }
  
  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-2 border-white/30 shadow-xl shadow-blue-900/50 max-w-md">
        <div className="absolute top-3 right-3">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-3xl text-white mb-6 flex flex-col items-center justify-center pt-2">
            <div className="bg-yellow-500 rounded-full p-2 mb-3 shadow-lg shadow-yellow-500/30">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <span className="font-bold tracking-wide">Match Results</span>
          </AlertDialogTitle>
          
          <div className="space-y-6 py-4">
            {/* Winner Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 shadow-lg shadow-blue-900/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="bg-yellow-500 rounded-full p-1.5 mr-2 shadow-md shadow-yellow-500/30">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-lg tracking-wide">Winner</span>
                </div>
                <div className="bg-green-500/30 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium border border-green-400/30">
                  +{winnerEloChange} ELO
                </div>
              </div>
              <div className="text-2xl font-bold">{winner.name}</div>
              <div className="text-sm text-blue-100 mt-1 font-medium">
                New ELO: {winner.elo} • W/L: {winner.wins}/{winner.losses}
              </div>
            </div>

            {/* Loser Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 shadow-lg shadow-blue-900/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="bg-blue-400/30 rounded-full p-1.5 mr-2">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-lg tracking-wide">Runner-up</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium">
                  {loserEloChange} ELO
                </div>
              </div>
              <div className="text-2xl font-bold">{loser.name}</div>
              <div className="text-sm text-blue-100 mt-1 font-medium">
                New ELO: {loser.elo} • W/L: {loser.wins}/{loser.losses}
              </div>
            </div>

            {/* Match Stats */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg py-3 px-4 border border-white/20">
              <p className="text-sm font-medium text-blue-100">
                Match duration: <span className="font-bold text-white">{match.startTime && match.endTime 
                  ? Math.floor((match.endTime.getTime() - match.startTime.getTime()) / 1000 / 60) + " min " +
                    Math.floor((match.endTime.getTime() - match.startTime.getTime()) / 1000 % 60) + " sec"
                  : "N/A"
                }</span>
              </p>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3 pb-4 pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-medium w-full sm:w-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button
            onClick={onRematch}
            className="bg-green-500 hover:bg-green-600 text-white border-green-400/30 font-medium w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Rematch
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
