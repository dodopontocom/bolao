'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IUser } from '@/models/User';
import { Match } from '@/data/matches';
import { IResult } from '@/models/Result';
import { IFood } from '@/models/Food';
import { IChat } from '@/models/Chat';
import { getFlag } from '@/data/flags';
import { LogOut, Settings, Trophy, List, BarChart3, User, Home, Send, HelpCircle } from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import AdminPanel from '@/components/AdminPanel';
import Ranking from '@/components/Ranking';
import MatchList from '@/components/MatchList';
import Countdown from '@/components/Countdown';
import Tutorial from '@/components/Tutorial';
import { getMatchStatus } from '@/lib/services/matchService';

interface RoundTableProps {
  currentUser: IUser;
  users: IUser[];
  matches: Match[];
  nextMatch: Match | null;
  results: Record<string, IResult>;
  foods: IFood[];
  chats: IChat[];
  onSendMessage: (message: string) => void;
  onCollectFood: (foodId: string) => void;
  onLogout: () => void;
}

type Tab = 'table' | 'matches' | 'ranking';

export default function RoundTable({
  currentUser,
  users,
  matches,
  nextMatch,
  results,
  foods,
  chats,
  onSendMessage,
  onCollectFood,
  onLogout,
}: RoundTableProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('table');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [movingToFood, setMovingToFood] = useState<{ id: string, x: number, y: number } | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check for first time tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  }, []);

  const calculateBasePosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 42;
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    };
  };

  const allAroundUsers = useMemo(() => [...users].sort((a, b) => a._id.localeCompare(b._id)), [users]);
  const currentUserIndex = useMemo(() => allAroundUsers.findIndex(u => u._id === currentUser._id), [allAroundUsers, currentUser._id]);
  
  const basePos = useMemo(() => calculateBasePosition(currentUserIndex, allAroundUsers.length), [currentUserIndex, allAroundUsers.length]);

  const [avatarPos, setAvatarPos] = useState(basePos);

  // Update base position if users change, but only if not busy
  useEffect(() => {
    if (!movingToFood && !isReturning) {
      setAvatarPos(basePos);
    }
  }, [basePos, movingToFood, isReturning]);

  const handleCollectClick = (food: IFood) => {
    if (movingToFood) return;
    setMovingToFood({ id: food._id, x: food.x, y: food.y });
    setAvatarPos({ x: food.x, y: food.y });

    // Wait for animation, then collect
    setTimeout(() => {
      onCollectFood(food._id);
      onSendMessage('glup! 😋');
      setIsReturning(true);
      setMovingToFood(null);
      setAvatarPos(basePos);
      
      setTimeout(() => {
        setIsReturning(false);
      }, 1000);
    }, 1000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleClaimMoney = async () => {
    if (!nextMatch || currentUser.foodPoints < 10) return;
    
    try {
      const res = await fetch(`/api/users/${currentUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claimFood', matchId: nextMatch.id }),
      });
      
      if (res.ok) {
        onSendMessage('troquei food points por grana! 🤑');
      }
    } catch (error) {
      console.error('Failed to claim money:', error);
    }
  };

  const canClaim = nextMatch && currentUser.foodPoints >= 10 && currentUser.lastClaimedMatchId !== nextMatch.id;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-[#050816]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 hover:bg-white/5 transition-colors p-1 -ml-1 rounded-lg"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xl">
              {currentUser.avatar}
            </div>
            <div className="text-left">
              <p className="text-white font-medium text-sm">
                {currentUser.name}
                {currentUser.city && <span className="ml-2 text-[10px] text-white/40 font-normal">({currentUser.city})</span>}
              </p>
              <p className="text-yellow-400 text-xs font-bold">N${currentUser.balance.toLocaleString()}</p>
            </div>
          </button>

          {canClaim && (
            <button
              onClick={handleClaimMoney}
              className="bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-3 py-2 rounded-xl animate-pulse shadow-lg shadow-green-500/20 flex items-center gap-2"
            >
              <Trophy className="w-3 h-3" />
              RESGATAR N$1.000
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('table')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Ir para a Mesa"
            >
              <Home className={`w-4 h-4 ${activeTab === 'table' ? 'text-yellow-400' : 'text-white/30'}`} />
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <User className="w-4 h-4 text-white/30" />
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Como funciona?"
            >
              <HelpCircle className="w-4 h-4 text-white/30" />
            </button>
            <button
              onClick={() => {
                const newCount = adminTapCount + 1;
                setAdminTapCount(newCount);
                if (newCount >= 5) {
                  setShowAdmin(true);
                  setAdminTapCount(0);
                }
                setTimeout(() => setAdminTapCount(0), 3000);
              }}
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
            <div className="flex items-center justify-start gap-3 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  Online agora ({users.filter(u => new Date(u.lastSeen) > new Date(Date.now() - 60000)).length})
                </span>
              </div>
            </div>

            <div className="relative aspect-square">
              {/* Table Surface */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-800 to-green-950 border-4 border-yellow-600 shadow-2xl overflow-hidden z-0">
                <div className="absolute inset-4 rounded-full border border-green-600/30"></div>
                <div className="absolute inset-12 rounded-full border border-green-600/20"></div>
              </div>

              {/* Match Info (Center) */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/5 z-10 pointer-events-none">
                {nextMatch && (
                  <div className="card p-4 text-center border-none bg-transparent">
                    <p className="text-white/50 text-[10px] mb-1">Próximo jogo</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xl">{getFlag(nextMatch.team1)}</span>
                      <span className="text-white/30">vs</span>
                      <span className="text-xl">{getFlag(nextMatch.team2)}</span>
                    </div>
                    <div className="flex justify-center">
                      <Countdown matchDate={nextMatch.matchDate} />
                    </div>
                  </div>
                )}
              </div>

              {/* Users Around the Table */}
              <div className="absolute inset-0 z-30 pointer-events-none">
                {allAroundUsers.map((user, index) => {
                  const isCurrent = user._id === currentUser._id;
                  const pos = isCurrent ? avatarPos : calculateBasePosition(index, allAroundUsers.length);
                  const isOnline = new Date(user.lastSeen) > new Date(Date.now() - 60000);
                  const userChat = chats.find(c => c.userId === user._id);

                  return (
                    <div
                      key={user._id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-all duration-1000 ease-in-out pointer-events-auto ${isOnline ? '' : 'opacity-40'} ${isCurrent ? 'z-50' : 'z-40'}`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      {userChat && (
                        <div className="absolute bottom-full mb-2 bg-white text-black text-[10px] font-bold py-1 px-2 rounded-lg shadow-xl whitespace-nowrap animate-bounce z-50 ring-2 ring-black/5">
                          {userChat.message}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
                        </div>
                      )}
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full bg-white/10 border-2 flex items-center justify-center text-2xl shadow-lg ${isCurrent ? 'border-yellow-400 scale-110 shadow-yellow-400/20' : 'border-white/20'}`}>
                          {user.avatar}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050816] animate-pulse"></div>
                        )}
                      </div>
                      <span className="text-white/80 text-[10px] font-medium text-center w-20 truncate">{user.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Food on the Table */}
              <div className="absolute inset-0 z-20">
                {foods.map((food) => (
                  <button
                    key={food._id}
                    onClick={() => handleCollectClick(food)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 text-3xl animate-bounce cursor-pointer hover:scale-125 transition-transform z-10"
                    style={{ left: `${food.x}%`, top: `${food.y}%` }}
                  >
                    {food.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Mande um salve..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-400"
              />
              <button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

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
              matches={matches}
              userName={currentUser.name}
              userId={currentUser._id}
              currentUser={currentUser}
              results={results}
            />
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="animate-fade-in">
            <Ranking users={users} results={results} currentUserName={currentUser.name} />
          </div>
        )}
      </main>

      <Tutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

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
