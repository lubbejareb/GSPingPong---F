import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import type { Player } from '../types';
import { UserPlus, Trash2, Trophy, Target, Lock, LogOut, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ADMIN_USERNAME = 'Admin';
const ADMIN_PASSWORD = 'pingpong321';

export function PlayerManagement() {
  const { state, dispatch } = useApp();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [addPlayerMessage, setAddPlayerMessage] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === ADMIN_USERNAME && loginPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
      setLoginUsername('');
      setLoginPassword('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    
    // Clear any previous messages
    setAddPlayerMessage('');
    
    // Input validation
    if (!trimmedName) {
      setAddPlayerMessage('Please enter a player name.');
      return;
    }
    
    if (trimmedName.length < 2) {
      setAddPlayerMessage('Player name must be at least 2 characters long.');
      return;
    }
    
    if (trimmedName.length > 30) {
      setAddPlayerMessage('Player name must be less than 30 characters long.');
      return;
    }
    
    // Check for invalid characters (basic sanitization)
    if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmedName)) {
      setAddPlayerMessage('Player name can only contain letters, numbers, spaces, hyphens, underscores, and periods.');
      return;
    }
    
    // Check for duplicate name before attempting to add
    const existingPlayer = state.players.find(p => 
      p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingPlayer) {
      setAddPlayerMessage('A player with this name already exists.');
      return;
    }
    
    dispatch({ type: 'ADD_PLAYER', payload: { name: trimmedName } });
    setNewPlayerName('');
    setAddPlayerMessage('Player added successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => setAddPlayerMessage(''), 3000);
  };

  const handleDeletePlayer = (playerId: string) => {
    dispatch({ type: 'DELETE_PLAYER', payload: { playerId } });
  };

  const sortedPlayers = [...state.players].sort((a, b) => b.elo - a.elo);

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
              <Trophy className="text-white" size={18} />
            </div>
            Player Management
          </div>
          {isAuthenticated && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-700 border-slate-300"
            >
              <LogOut className="mr-1 h-3 w-3" />
              Logout
            </Button>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          {isAuthenticated 
            ? "Add and manage players in your ping pong league" 
            : "View players and login as admin to manage them"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

      {/* Admin Login Toggle Button */}
      {!isAuthenticated && (
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLoginForm(!showLoginForm)}
            className="flex items-center gap-2 text-gray-300 border-gray-200 hover:bg-gray-100 w-full justify-between"
          >
            <div className="flex items-center gap-1">
              <Lock size={14} />
              <span>Admin Access</span>
            </div>
            {showLoginForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      )}

      {/* Admin Login Form */}
      {!isAuthenticated && showLoginForm && (
        <Card className="border border-gray-200 shadow-sm bg-white-50/50 backdrop-blur-sm mb-4">
          <CardContent className="p-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Lock size={12} />
                  Admin Login Required
                </label>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Username"
                    className="border-gray-200 focus:border-gray-500 focus:ring-amber-500/20"
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Password"
                      className="border-gray-200 focus:border-gray-500 focus:ring-amber-500/20 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-slate-500 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                  </div>
                </div>
                {loginError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {loginError}
                  </p>
                )}
                <Button type="submit" size="sm" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:bg-green-600">
                  <Lock className="mr-1 h-3 w-3" />
                  Login as Admin
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Player Form - Only show if authenticated */}
      {isAuthenticated && (
        <Card className="border border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-4">
              <form onSubmit={handleAddPlayer} className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="playerName" className="text-xs font-medium text-slate-700">
                    Add New Player
                  </label>
                  <div className="flex gap-2">
                  <Input
                    id="playerName"
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name..."
                    className="flex-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                    <Button type="submit" size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md text-white">
                      <UserPlus className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                </div>
                {addPlayerMessage && (
                  <p className={`text-xs p-2 rounded border ${
                    addPlayerMessage.includes('successfully') 
                      ? 'text-green-600 bg-green-50 border-green-200' 
                      : 'text-red-600 bg-red-50 border-red-200'
                  }`}>
                    {addPlayerMessage}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Players List */}
      {state.players.length === 0 ? (
        <Card className="border border-dashed border-slate-300 bg-slate-50/50">
          <CardContent className="text-center py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target size={24} className="text-slate-500" />
            </div>
            <h3 className="text-base font-medium text-slate-700 mb-1">No players yet</h3>
            <p className="text-sm text-slate-500">
              {isAuthenticated ? "Add your first player to get started!" : "Login as admin to add players!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              rank={index + 1}
              onDelete={() => handleDeletePlayer(player.id)}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
      </CardContent>
    </Card>
  );
}

function PlayerCard({ player, rank, onDelete, isAuthenticated }: { 
  player: Player; 
  rank: number; 
  onDelete: () => void;
  isAuthenticated: boolean;
}) {
  const winRate = player.totalGames > 0 ? (player.wins / player.totalGames * 100).toFixed(1) : '0.0';
  
  const getRankVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank === 2) return 'secondary';
    if (rank === 3) return 'outline';
    return 'outline';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-600';
    if (rank === 3) return 'text-orange-600';
    return 'text-blue-600';
  };

  return (
    <Card className="hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200 border border-slate-200/60 bg-white/80 backdrop-blur-sm group">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Badge 
              variant={getRankVariant(rank)} 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(rank)} border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-200`}
            >
              #{rank}
            </Badge>
            {rank <= 3 && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">★</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-slate-800">{player.name}</h3>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">ELO:</span>
                <Badge variant="outline" className="font-semibold text-blue-600 border-blue-200 bg-blue-50 text-xs px-2 py-0.5">
                  {player.elo}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">W/L:</span>
                <span className="font-medium text-slate-700">{player.wins}/{player.losses}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Win Rate:</span>
                <Badge variant="secondary" className="font-semibold text-green-600 bg-green-50 text-xs px-2 py-0.5">
                  {winRate}%
                </Badge>
              </div>
            </div>
          </div>
        </div>
        {isAuthenticated && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Trash2 size={18} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="text-red-600" size={20} />
                  </div>
                  Delete Player
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">{player.name}</span>?{" "}
                  This action cannot be undone and will permanently remove all their match history and statistics.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDelete} 
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Player
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
