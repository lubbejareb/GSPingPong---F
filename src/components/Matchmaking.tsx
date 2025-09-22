import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { Swords, Play, Users, TrendingUp } from 'lucide-react';
import { getWinProbability } from '../utils/eloSystem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function Matchmaking() {
  const { state, dispatch } = useApp();
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>('');
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>('');

  const handleCreateMatch = () => {
    if (selectedPlayer1 && selectedPlayer2 && selectedPlayer1 !== selectedPlayer2) {
      dispatch({
        type: 'CREATE_MATCH',
        payload: { player1Id: selectedPlayer1, player2Id: selectedPlayer2 }
      });
      setSelectedPlayer1('');
      setSelectedPlayer2('');
    }
  };

  const handleStartMatch = (matchId: string) => {
    dispatch({ type: 'START_MATCH', payload: { matchId } });
  };

  const player1 = state.players.find(p => p.id === selectedPlayer1);
  const player2 = state.players.find(p => p.id === selectedPlayer2);

  const canCreateMatch = selectedPlayer1 && selectedPlayer2 && selectedPlayer1 !== selectedPlayer2;
  const winProbability = player1 && player2 ? getWinProbability(player1.elo, player2.elo) : null;

  const pendingMatches = state.matches.filter(m => m.status === 'pending');
  const activeMatches = state.matches.filter(m => m.status === 'in-progress');

  return (
    <div className="space-y-6">
      {/* Create Match */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Swords className="text-white" size={18} />
            </div>
            Create Match
          </CardTitle>
          <CardDescription className="text-sm">
            Select two players to create a new ping pong match
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        
        {/* No players message */}
        {state.players.length < 2 && (
          <Card className="border border-dashed border-amber-300 bg-amber-50/50">
            <CardContent className="text-center py-8">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-amber-600" />
              </div>
              <h3 className="text-base font-medium text-amber-700 mb-1">Need More Players</h3>
              <p className="text-sm text-amber-600">
                You need at least 2 players to create a match. Add more players from the Players tab.
              </p>
            </CardContent>
          </Card>
        )}

        {state.players.length >= 2 && (
          <>
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Player 1</label>
                    <Select value={selectedPlayer1} onValueChange={setSelectedPlayer1}>
                      <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select Player 1" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {state.players.map(player => (
                          <SelectItem 
                            key={player.id} 
                            value={player.id} 
                            disabled={player.id === selectedPlayer2}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{player.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {player.elo}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Player 2</label>
                    <Select value={selectedPlayer2} onValueChange={setSelectedPlayer2}>
                      <SelectTrigger className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select Player 2" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {state.players.map(player => (
                          <SelectItem 
                            key={player.id} 
                            value={player.id} 
                            disabled={player.id === selectedPlayer1}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{player.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {player.elo}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match Preview */}
            {canCreateMatch && player1 && player2 && winProbability !== null && (
              <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <TrendingUp size={18} className="text-white" />
                    </div>
                    Match Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-white rounded-xl border border-blue-200">
                      <div className="font-semibold text-lg text-slate-800">{player1.name}</div>
                      <div className="text-sm text-slate-600 mb-3">ELO: {player1.elo}</div>
                      <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 text-base py-1 px-3">
                        {(winProbability * 100).toFixed(1)}%
                      </Badge>
                      <div className="text-xs text-slate-500 mt-2">Win Probability</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl border border-slate-200">
                      <div className="font-semibold text-lg text-slate-800">{player2.name}</div>
                      <div className="text-sm text-slate-600 mb-3">ELO: {player2.elo}</div>
                      <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-base py-1 px-3">
                        {((1 - winProbability) * 100).toFixed(1)}%
                      </Badge>
                      <div className="text-xs text-slate-500 mt-2">Win Probability</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleCreateMatch}
              disabled={!canCreateMatch}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg py-3 text-base text-white"
            >
              <Swords className="mr-2 h-5 w-5" />
              Create Match
            </Button>
          </>
        )}
        </CardContent>
      </Card>

      {/* Pending Matches */}
      {pendingMatches.length > 0 && (
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Users className="text-white" size={20} />
              </div>
              Pending Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingMatches.map(match => (
                <Card key={match.id} className="border border-slate-200 bg-white hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-lg text-slate-800">
                          {match.player1.name} <span className="text-slate-500">vs</span> {match.player2.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          ELO: <Badge variant="outline" className="text-xs">{match.player1.elo}</Badge> vs <Badge variant="outline" className="text-xs">{match.player2.elo}</Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartMatch(match.id)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md text-white"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Match
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Matches */}
      {activeMatches.length > 0 && (
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Play className="text-white" size={20} />
              </div>
              Active Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeMatches.map(match => (
                <Card key={match.id} className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">🏓</span>
                      </div>
                      <div className="font-semibold text-lg text-blue-800">
                        {match.player1.name} <span className="text-blue-600">vs</span> {match.player2.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-blue-700">
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Match in progress
                      </Badge>
                      <span>Started: {match.startTime?.toLocaleTimeString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
