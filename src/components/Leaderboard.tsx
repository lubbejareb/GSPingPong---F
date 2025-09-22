import { useApp } from '../hooks/useApp';
import { Trophy, TrendingUp, Medal, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Leaderboard() {
  const { state } = useApp();

  const sortedPlayers = [...state.players].sort((a, b) => b.elo - a.elo);
  const completedMatches = state.matches.filter(m => m.status === 'completed');
  const recentMatches = completedMatches.slice(-5).reverse();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Award className="text-orange-500" size={24} />;
      default:
        return <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex items-center justify-center">#{rank}</div>;
    }
  };


  if (state.players.length === 0) {
    return (
      <Card className="border border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy size={40} className="text-slate-500" />
          </div>
          <CardTitle className="text-xl text-slate-700 mb-3">No Players Yet</CardTitle>
          <CardDescription className="text-base text-slate-500">
            Add some players to see the leaderboard and competition rankings!
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Leaderboard */}
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
              <Trophy className="text-white" size={24} />
            </div>
            Leaderboard
          </CardTitle>
          <CardDescription className="text-base">
            Player rankings based on ELO rating and match performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

        <div className="space-y-4">
          {sortedPlayers.map((player, index) => {
            const rank = index + 1;
            const winRate = player.totalGames > 0 ? (player.wins / player.totalGames * 100) : 0;
            
            return (
              <Card 
                key={player.id} 
                className={`hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200 border border-slate-200/60 bg-white/80 backdrop-blur-sm group ${rank <= 3 ? 'ring-2 ring-yellow-200/50' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        {getRankIcon(rank)}
                        {rank <= 3 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">★</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-xl text-slate-800">{player.name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">ELO:</span>
                            <Badge variant="outline" className="font-semibold text-blue-600 border-blue-200 bg-blue-50 text-base">
                              {player.elo}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Games:</span>
                            <span className="font-medium text-slate-700">{player.totalGames}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">W/L:</span>
                            <span className="font-medium text-slate-700">{player.wins}/{player.losses}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="secondary" 
                        className={`text-lg font-bold py-2 px-4 ${
                          winRate >= 70 ? 'bg-green-100 text-green-700' : 
                          winRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'
                        }`}
                      >
                        {winRate.toFixed(1)}%
                      </Badge>
                      <div className="text-sm text-slate-500 mt-2">Win Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </CardContent>
      </Card>


      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-green-500" />
              Recent Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMatches.map(match => (
                <Card key={match.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className={`font-semibold ${match.winner?.id === match.player1.id ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {match.player1.name}
                        </div>
                        <Badge variant={match.eloChanges?.player1Change && match.eloChanges.player1Change > 0 ? 'default' : 'destructive'} className="text-xs">
                          {match.eloChanges?.player1Change && match.eloChanges.player1Change > 0 ? '+' : ''}
                          {match.eloChanges?.player1Change}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground font-bold">vs</div>
                      <div className="text-center">
                        <div className={`font-semibold ${match.winner?.id === match.player2.id ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {match.player2.name}
                        </div>
                        <Badge variant={match.eloChanges?.player2Change && match.eloChanges.player2Change > 0 ? 'default' : 'destructive'} className="text-xs">
                          {match.eloChanges?.player2Change && match.eloChanges.player2Change > 0 ? '+' : ''}
                          {match.eloChanges?.player2Change}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{match.endTime?.toLocaleDateString()}</div>
                      <div>{match.endTime?.toLocaleTimeString()}</div>
                    </div>
                  </div>
                  {match.winner && (
                    <div className="mt-3 text-center">
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Trophy className="mr-1 h-3 w-3" />
                        {match.winner.name} wins!
                      </Badge>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center border border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="text-white" size={24} />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{state.players.length}</div>
            <CardDescription className="text-base font-medium">Total Players</CardDescription>
          </CardContent>
        </Card>
        <Card className="text-center border border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">{completedMatches.length}</div>
            <CardDescription className="text-base font-medium">Matches Played</CardDescription>
          </CardContent>
        </Card>
        <Card className="text-center border border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award className="text-white" size={24} />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {sortedPlayers.length > 0 ? sortedPlayers[0].elo : 0}
            </div>
            <CardDescription className="text-base font-medium">Highest ELO</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
