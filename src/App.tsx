import { useState } from 'react';
import { AuthForm } from './components/Auth/AuthForm';
import { GamePage } from './pages/GamePage';
import { Leaderboard } from './components/Leaderboard/Leaderboard';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

type Page = 'game' | 'leaderboard' | 'settings';

function App() {
  const { user, profile, loading } = useSupabaseAuth();
  const [currentPage, setCurrentPage] = useState<Page>('game');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthForm onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="App">
      {currentPage === 'game' ? (
        <GamePage 
          onNavigateToLeaderboard={() => setCurrentPage('leaderboard')}
          onNavigateToSettings={() => setCurrentPage('settings')}
        />
      ) : currentPage === 'leaderboard' ? (
        <div>
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setCurrentPage('game')}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-200"
            >
              ← Back to Game
            </button>
          </div>
          <Leaderboard />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 flex items-center justify-center">
          <div className="text-white text-xl">Settings page coming soon...</div>
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setCurrentPage('game')}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-200"
            >
              ← Back to Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;