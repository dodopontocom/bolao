import { useState, useEffect, useCallback } from 'react';
import { Trophy, List, BarChart3, LogOut, Shield, Settings } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import NextMatch from './components/NextMatch';
import MatchCard from './components/MatchCard';
import MatchList from './components/MatchList';
import Ranking from './components/Ranking';
import AdminPanel from './components/AdminPanel';
import { Match, fetchMatches, getMatchStatus } from './data/matches';
import {
  saveUser, loadUser, clearUser,
  loadAllPredictions, loadAllResults,
  calculateScores, isAdmin, toggleAdmin,
  getUniqueUsers,
} from './data/storage';
import { UserScore, MatchResult } from './data/storage';

type Tab = 'next' | 'matches' | 'ranking';

export default function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const [scores, setScores] = useState<UserScore[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('next');
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminTapCount, setAdminTapCount] = useState(0);

  useEffect(() => {
    const saved = loadUser();
    if (saved) setUserName(saved);
  }, []);

  useEffect(() => {
    fetchMatches().then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const refreshData = useCallback(() => {
    const allResults = loadAllResults();
    setResults(allResults);
    const allPredictions = loadAllPredictions();
    setScores(calculateScores(allPredictions, allResults));
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleLogin = (name: string) => {
    saveUser(name);
    setUserName(name);
    refreshData();
  };

  const handleLogout = () => {
    clearUser();
    setUserName(null);
  };

  const handleSettingsTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount >= 5) {
      toggleAdmin();
      setAdminTapCount(0);
      setShowAdmin(isAdmin() ? false : true);
    }
    setTimeout(() => setAdminTapCount(0), 3000);
  };

  if (!userName) {
    const existingUsers = getUniqueUsers(loadAllPredictions());
    return <LoginScreen onLogin={handleLogin} existingUsers={existingUsers} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
        <span className="text-white/40 text-sm">Carregando jogos...</span>
      </div>
    );
  }

  const upcomingMatches = matches
    .filter((m) => m.group && getMatchStatus(m) !== 'finished')
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

  const nextMatch = upcomingMatches[0] || null;
  const remainingUpcoming = upcomingMatches.slice(1);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'next', label: 'Proximo', icon: <Trophy className="w-5 h-5" /> },
    { key: 'matches', label: 'Jogos', icon: <List className="w-5 h-5" /> },
    { key: 'ranking', label: 'Ranking', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <header className="sticky top-0 z-40 bg-navy-950/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-white tracking-tight">
              BOLAO <span className="text-gold-400">2026</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pitch-500 to-pitch-700 flex items-center justify-center font-display font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white/80 max-w-[100px] truncate">{userName}</span>
            </div>
            <button
              onClick={handleSettingsTap}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 text-white/30" />
            </button>
            {isAdmin() && (
              <button
                onClick={() => setShowAdmin(true)}
                className="p-2 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 transition-colors"
              >
                <Shield className="w-4 h-4 text-gold-400" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4 text-white/30" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {activeTab === 'next' && (
          <div className="space-y-6 animate-fade-in">
            {nextMatch && (
              <NextMatch
                match={nextMatch}
                userName={userName}
                result={results[nextMatch.id] || null}
              />
            )}

            {nextMatch && getMatchStatus(nextMatch) === 'open' && (
              <div className="animate-slide-up">
                <MatchCard
                  match={nextMatch}
                  userName={userName}
                  result={results[nextMatch.id] || null}
                  isFeatured
                />
              </div>
            )}

            {remainingUpcoming.length > 0 && (
              <div>
                <h3 className="font-display text-sm font-bold text-white/50 uppercase tracking-widest mb-3">
                  Proximos Jogos
                </h3>
                <div className="space-y-3">
                  {remainingUpcoming.slice(0, 5).map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      userName={userName}
                      result={results[match.id] || null}
                    />
                  ))}
                </div>
              </div>
            )}

            {!nextMatch && (
              <div className="text-center py-16 text-white/30">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Todos os jogos ja foram disputados!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="animate-fade-in">
            <MatchList
              matches={matches}
              userName={userName}
              results={results}
            />
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="animate-fade-in">
            <div className="card p-3 mb-4 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold-500" />
                <span className="text-white/50">3 pts = Placar exato</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pitch-500" />
                <span className="text-white/50">1 pt = Vencedor certo</span>
              </div>
            </div>
            <Ranking scores={scores} currentUser={userName} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-navy-950/95 backdrop-blur-md border-t border-white/10">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all duration-200
                ${activeTab === tab.key ? 'text-gold-400' : 'text-white/40 hover:text-white/60'}`}
            >
              {tab.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              {activeTab === tab.key && (
                <div className="w-1 h-1 rounded-full bg-gold-400 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {showAdmin && isAdmin() && (
        <AdminPanel
          matches={matches}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}
