import { Users, Swords, Play, Trophy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusIndicator } from './StatusIndicator';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'players', label: 'Players', icon: Users },
    { id: 'matchmaking', label: 'Matchmaking', icon: Swords },
    { id: 'live', label: 'Live Match', icon: Play },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div></div>
        <StatusIndicator />
      </div>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg rounded-xl p-1 h-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger 
              key={id} 
              value={id} 
              className="flex items-center gap-2 rounded-lg py-2 px-3 text-xs font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-100/80"
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
