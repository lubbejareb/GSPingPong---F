import { Trophy, X } from 'lucide-react';
import type { Match } from '../types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface WinnerSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onSelectWinner: (winnerId: string) => void;
}

export function WinnerSelectionDialog({ 
  isOpen, 
  onClose, 
  match, 
  onSelectWinner 
}: WinnerSelectionDialogProps) {
  if (!match) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
            <span className="font-bold tracking-wide">Select Winner</span>
          </AlertDialogTitle>
          
          <div className="space-y-6 py-2">
            <p className="text-center text-white text-lg font-medium">Who won this match?</p>
            
            <div className="grid grid-cols-1 gap-5">
              {/* Player 1 Button */}
              <Button 
                onClick={() => onSelectWinner(match.player1.id)}
                className="bg-white hover:bg-blue-50 text-blue-700 border-2 border-white shadow-lg shadow-blue-900/20 transition-all py-8 rounded-xl"
              >
                <div className="flex flex-col items-center w-full">
                  <Trophy className="mb-2 h-8 w-8 text-yellow-500" />
                  <span className="text-2xl font-bold">{match.player1.name}</span>
                  <span className="text-sm text-blue-600 mt-1 font-medium">
                    Current ELO: {match.player1.elo}
                  </span>
                </div>
              </Button>
              
              {/* Player 2 Button */}
              <Button 
                onClick={() => onSelectWinner(match.player2.id)}
                className="bg-white hover:bg-blue-50 text-blue-700 border-2 border-white shadow-lg shadow-blue-900/20 transition-all py-8 rounded-xl"
              >
                <div className="flex flex-col items-center w-full">
                  <Trophy className="mb-2 h-8 w-8 text-yellow-500" />
                  <span className="text-2xl font-bold">{match.player2.name}</span>
                  <span className="text-sm text-blue-600 mt-1 font-medium">
                    Current ELO: {match.player2.elo}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center pb-4 pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-medium px-8"
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
