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
      <AlertDialogContent className="bg-white border border-slate-200/60 shadow-xl shadow-slate-200/20 backdrop-blur-sm max-w-md">
        <div className="absolute top-3 right-3">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-3xl text-slate-800 mb-6 flex flex-col items-center justify-center pt-2">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-2 mb-3 shadow-lg shadow-blue-500/20">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <span className="font-bold tracking-wide">Select Winner</span>
          </AlertDialogTitle>
          
          <div className="space-y-6 py-2">
            <p className="text-center text-slate-600 text-lg font-medium">Who won this match?</p>
            
            <div className="grid grid-cols-1 gap-5">
              {/* Player 1 Button */}
              <Button 
                onClick={() => onSelectWinner(match.player1.id)}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200 shadow-lg shadow-blue-100/20 transition-all py-8 rounded-xl"
              >
                <div className="flex flex-col items-center w-full">
                  <span className="text-2xl font-semibold text-blue-600">{match.player1.name}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-slate-500">
                      ELO: {match.player1.elo}
                    </span>
                  </div>
                </div>
              </Button>
              
              {/* Player 2 Button */}
              <Button 
                onClick={() => onSelectWinner(match.player2.id)}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200 shadow-lg shadow-blue-100/20 transition-all py-8 rounded-xl"
              >
                <div className="flex flex-col items-center w-full">
                  <span className="text-2xl font-semibold text-blue-600">{match.player2.name}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-slate-500">
                      ELO: {match.player2.elo}
                    </span>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center pb-4 pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200 font-medium px-8"
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
