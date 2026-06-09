'use client';

import { useState } from 'react';
import { IUser } from '@/models/User';
import { IMatch } from '@/models/Match';
import { IResult } from '@/models/Result';
import { IFood } from '@/models/Food';
import { LogOut, Settings, Trophy, List, BarChart3, Shield } from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import AdminPanel from '@/components/AdminPanel';
import Ranking from '@/components/Ranking';
import MatchList from '@/components/MatchList';
import { getMatchStatus } from '@/data/matches';

interface RoundTableProps {
  currentUser: IUser;
  users: IUser[];
  nextMatch: IMatch | null;
  results: Record<string, IResult>;
  foods: IFood[];
  onCollectFood: (foodId: string) => void;
  onLogout: () => void;
}

type Tab = 'table' | 'matches' | 'ranking';

export default function RoundTable({
  currentUser,
  users,
  nextMatch,
  results,
  foods,
  onCollectFood,
  onLogout,
}: RoundTableProps) {
  const [activeTab, setActiveTab] = useState<Tab>('table');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);

  const onlineUsers = users.filter(u => new Date(u.lastSeen) > new Date(Date.now() - 60000));
  const offlineUsers = users.filter(u => new Date(u.lastSeen) <= new Date(Date.now() - 60000));
  const allAroundUsers = [...onlineUsers, ...offlineUsers];

  const calculatePosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 42;
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    };
  };

  const handleSettingsTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount >= 5) {
      setShowAdmin(true);
      setAdminTapCount(0);
    }
    setTimeout(() => setAdminTapCount(0), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-[#050816]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xl">
              {currentUser.avatar}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{currentUser.name}</p>
              <p className="text-yellow-400 text-xs font-bold">R${currentUser.balance.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSettingsTap}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 text-white/30" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4 text-white/30" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {activeTab === 'table' && (
          <div className="animate-fade-in space-y-6">
            <div className="relative aspect-square">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-800 to-green-950 border-4 border-yellow-600 shadow-2xl">
                <div className="absolute inset-4 rounded-full border border-green-600/30"></div>
                <div className="absolute inset-12 rounded-full border border-green-600/20"></div>

                {allAroundUsers.map((user, index) => {
                  const pos = calculatePosition(index, allAroundUsers.length);
                  const isOnline = new Date(user.lastSeen) > new Date(Date.now() - 60000);
                  return (
                    <div
                      key={user._id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${isOnline ? '' : 'opacity-40'}`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-2xl shadow-lg">
                          {user.avatar}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050816] animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {foods.map((food) => (
                  <button
                    key={food._id}
                    onClick={() => onCollectFood(food._id)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 text-3xl animate-bounce cursor-pointer hover:scale-125 transition-transform"
                    style={{ left: `${food.x}%`, top: `${food.y}%` }}
                  >
                    {food.emoji}
                  </button>
                ))}

                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/5">
                  {nextMatch && (
                    <div className="card p-4 text-center">
                      <p className="text-white/50 text-xs mb-2">Próximo jogo</p>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl">{nextMatch.homeTeam}</span>
                        <span className="text-white/50">vs</span>
                        <span className="text-2xl">{nextMatch.awayTeam}</span>
                      </div>
                      {results[nextMatch.id] && (
                        <p className="text-yellow-400 font-bold text-xl">
                          {results[nextMatch.id].homeGoals} - {results[nextMatch.id].awayGoals}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {nextMatch && getMatchStatus(nextMatch as any) === 'open' && (
              <MatchCard
                match={nextMatch as any}
                userName={currentUser.name}
                userId={currentUser._id}
                currentUser={currentUser}
                result={results[nextMatch.id] || null}
              />
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="animate-fade-in">
            <MatchList
              matches={users as any}
              userName={currentUser.name}
              results={results}
            />
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="animate-fade-in">
            <div className="card p-3 mb-4 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-white/50">3 pts = Placar exato</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-white/50">1 pt = Vencedor certo</span>
              </div>
            </div>
            <Ranking users={users} results={results} currentUserName={currentUser.name} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050816]/95 backdrop-blur-md border-t border-white/10">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all duration-200 ${activeTab === 'table' ? 'text-yellow-400' : 'text-white/40 hover:text-white/60'}`}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-green-700"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Mesa</span>
            {activeTab === 'table' && <div className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5"></div>}
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all duration-200 ${activeTab === 'matches' ? 'text-yellow-400' : 'text-white/40 hover:text-white/60'}`}
          >
            <List className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Jogos</span>
            {activeTab === 'matches' && <div className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5"></div>}
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all duration-200 ${activeTab === 'ranking' ? 'text-yellow-400' : 'text-white/40 hover:text-white/60'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ranking</span>
            {activeTab === 'ranking' && <div className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5"></div>}
          </button>
        </div>
      </nav>

      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}
