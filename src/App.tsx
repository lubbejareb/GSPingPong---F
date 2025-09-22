import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { PlayerManagement } from './components/PlayerManagement';
import { Matchmaking } from './components/Matchmaking';
import { LiveMatch } from './components/LiveMatch';
import { Leaderboard } from './components/Leaderboard';
import { DebugMenu } from './components/DebugMenu';
import { isDevelopment } from './utils/apiService';

function App() {
  const [activeTab, setActiveTab] = useState('players');
  const [debugMenuVisible, setDebugMenuVisible] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'players':
        return <PlayerManagement />;
      case 'matchmaking':
        return <Matchmaking />;
      case 'live':
        return <LiveMatch />;
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return <PlayerManagement />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-3 py-4 lg:py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl mb-3 shadow-lg">
              <span className="text-xl">🏓</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
              GS Ping Pong
            </h1>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Professional ping pong matchmaking, ranking, and live betting platform
            </p>
          </div>

          {/* Navigation */}
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 lg:p-6">
              {renderContent()}
            </div>
          </div>
        </div>
        
        {/* Debug Menu - Only in development */}
        {isDevelopment && (
          <DebugMenu 
            isVisible={debugMenuVisible} 
            onToggle={() => setDebugMenuVisible(!debugMenuVisible)} 
          />
        )}
      </div>
    </AppProvider>
  );
}

export default App;
