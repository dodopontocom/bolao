'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { IUser } from '@/models/User';
import { Match } from '@/data/matches';
import { IResult } from '@/models/Result';
import { IFood } from '@/models/Food';
import { IChat } from '@/models/Chat';
import { getFlag } from '@/data/flags';
import { LogOut, Settings, Trophy, List, BarChart3, User, Home, Send, HelpCircle, Utensils } from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import AdminPanel from '@/components/AdminPanel';
import Ranking from '@/components/Ranking';
import MatchList from '@/components/MatchList';
import Countdown from '@/components/Countdown';
import Tutorial from '@/components/Tutorial';
import { getMatchStatus, getNow } from '@/lib/services/matchService';

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
  activeTab,
  setActiveTab,
  showAdmin,
  setShowAdmin,
  showTutorial,
  setShowTutorial,
}: any) {
  const router = useRouter();
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [movingToFood, setMovingToFood] = useState<{ id: string, x: number, y: number } | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [activeJargonUserId, setActiveJargonUserId] = useState<string | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Filter matches for "today" (simulated or real)
  const todayMatches = useMemo(() => {
    const now = getNow();
    
    // Get date string in SP timezone: "YYYY-MM-DD"
    const spDateStr = new Date(now).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    
    return matches.filter(m => {
      const mDate = m.matchDate || new Date(m.date).getTime();
      const mDateStr = new Date(mDate).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      return mDateStr === spDateStr;
    }).sort((a, b) => (a.matchDate || 0) - (b.matchDate || 0));
  }, [matches]);

  // Rotate center match if there are multiple matches today
  useEffect(() => {
    if (todayMatches.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentMatchIndex(prev => (prev + 1) % todayMatches.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [todayMatches.length]);

  const activeCenterMatch = todayMatches[currentMatchIndex] || nextMatch;

  // Check for first time tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  }, []);

  // Hide jargon after 3 seconds
  useEffect(() => {
    if (activeJargonUserId) {
      const timer = setTimeout(() => {
        setActiveJargonUserId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeJargonUserId]);

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
    <div className="flex flex-col">
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

            <div className="relative aspect-square perspective-[1000px]">
              {/* Table Surface with 3D Effect */}
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-br from-green-800 to-green-950 border-4 border-yellow-600 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-0 transition-transform duration-700"
                style={{ transform: 'rotateX(30deg) translateY(10px)' }}
              >
                <div className="absolute inset-4 rounded-full border border-green-600/30"></div>
                <div className="absolute inset-12 rounded-full border border-green-600/20"></div>
                {/* 3D Reflection */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
              </div>

              {/* Match Info (Center) - Floating above table */}
              <div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/5 z-10 pointer-events-none transition-transform duration-700"
                style={{ transform: 'translate3d(-50%, -60%, 50px)' }}
              >
                {activeCenterMatch && (
                  <div className="card p-4 text-center border-none bg-transparent animate-fade-in" key={`${activeCenterMatch.id}-${activeCenterMatch.team1}-${activeCenterMatch.team2}`}>
                    <p className="text-white/50 text-[10px] mb-1">
                      {todayMatches.length > 1 ? `Jogo ${currentMatchIndex + 1} de ${todayMatches.length}` : 'Próximo jogo'}
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xl drop-shadow-lg">{getFlag(activeCenterMatch.team1)}</span>
                      <span className="text-white/30">vs</span>
                      <span className="text-xl drop-shadow-lg">{getFlag(activeCenterMatch.team2)}</span>
                    </div>
                    <div className="flex justify-center">
                      <Countdown matchDate={activeCenterMatch.matchDate} />
                    </div>
                  </div>
                )}
              </div>

              {/* Users Around the Table */}
              <div className="absolute inset-0 z-30 pointer-events-none" style={{ perspective: '1000px' }}>
                {allAroundUsers.map((user, index) => {
                  const isCurrent = user._id === currentUser._id;
                  const pos = isCurrent ? avatarPos : calculateBasePosition(index, allAroundUsers.length);
                  const isOnline = new Date(user.lastSeen) > new Date(Date.now() - 60000);
                  const userChat = chats.find(c => c.userId === user._id);
                  const isJargonActive = activeJargonUserId === user._id;

                  return (
                    <div
                      key={user._id}
                      className={`absolute flex flex-col items-center gap-1 transition-all duration-1000 ease-in-out pointer-events-auto ${isOnline ? '' : 'opacity-40'} ${isCurrent ? 'z-50' : 'z-40'}`}
                      style={{ 
                        left: `${pos.x}%`, 
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%) rotateX(-15deg) translateZ(20px)'
                      }}
                    >
                      {(userChat || (isJargonActive && user.jargon)) && (
                        <div className="absolute bottom-full mb-2 bg-white text-black text-[10px] font-bold py-1 px-2 rounded-lg shadow-2xl whitespace-nowrap animate-bounce z-50 ring-2 ring-black/5">
                          {isJargonActive && user.jargon ? user.jargon : userChat?.message}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
                        </div>
                      )}
                      <div className="relative group">
                        <button
                          onClick={() => user.jargon && setActiveJargonUserId(user._id)}
                          className={`w-12 h-12 rounded-full bg-white/10 border-2 flex items-center justify-center text-2xl shadow-2xl transition-all duration-300 ${isCurrent ? 'border-yellow-400 scale-110 shadow-yellow-400/40 ring-4 ring-yellow-400/20' : 'border-white/20 hover:scale-110 hover:border-white/40'}`}
                        >
                          {user.avatar}
                          {user.correctPredictions > 0 && (
                            <div className="absolute -top-2 -left-2 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-black shadow-lg flex items-center justify-center min-w-[20px] z-10">
                              {user.correctPredictions}
                            </div>
                          )}
                        </button>
                        {isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050816] animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                        )}
                        {/* Shadow for 3D effect */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/40 blur-sm rounded-full -z-10 group-hover:w-10 transition-all"></div>
                      </div>
                      <span className="text-white font-bold text-[10px] text-center w-24 truncate drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full mt-1 border border-white/5">
                        {user.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Food on the Table */}
              <div className="absolute inset-0 z-20" style={{ transform: 'rotateX(30deg) translateY(10px)', transformStyle: 'preserve-3d' }}>
                {foods.map((food) => (
                  <button
                    key={food._id}
                    onClick={() => handleCollectClick(food)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 text-3xl animate-bounce cursor-pointer hover:scale-125 transition-transform z-10"
                    style={{ left: `${food.x}%`, top: `${food.y}%`, transform: 'translate3d(-50%, -50%, 30px) rotateX(-30deg)' }}
                  >
                    <span className="drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">{food.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {canClaim && (
              <button
                onClick={handleClaimMoney}
                className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-4 rounded-2xl animate-pulse shadow-lg shadow-green-500/20 flex items-center justify-center gap-3"
              >
                <Trophy className="w-5 h-5" />
                RESGATAR N$1.000 (FOMINHA LEVEL {currentUser.foodPoints})
              </button>
            )}

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

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  {todayMatches.length > 0 ? 'Jogos de Hoje' : 'Próximo Jogo'}
                </h3>
              </div>
              
              {todayMatches.length > 0 ? (
                todayMatches.map(match => (
                  <MatchCard
                    key={`${match.id}-${match.team1}-${match.team2}`}
                    match={match as any}
                    userName={currentUser.name}
                    userId={currentUser._id}
                    currentUser={currentUser}
                    result={results[match.id] || null}
                  />
                ))
              ) : (
                nextMatch && (
                  <MatchCard
                    match={nextMatch as any}
                    userName={currentUser.name}
                    userId={currentUser._id}
                    currentUser={currentUser}
                    result={results[nextMatch.id] || null}
                  />
                )
              )}
            </div>
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
    </div>
  );
}
