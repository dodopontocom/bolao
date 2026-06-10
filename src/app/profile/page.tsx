'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Save, Trophy, DollarSign, Utensils, RefreshCw, TrendingUp, BarChart3 } from 'lucide-react';
import { IUser } from '@/models/User';
import { getFlag } from '@/data/flags';
import LoginScreen from '@/components/LoginScreen';
import { ALL_AVATARS } from '@/data/avatars';
import { calculatePredictionReward } from '@/lib/services/matchService';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useApp } from '@/context/AppContext';

const PREDEFINED_CITIES = ['Pilar', 'Sorocaba', 'Piedade', 'Valinhos', 'Cocais'];
const JARGONS = [
  'Bora Hexa!',
  'Agora Vem!',
  'Tô confiante!',
  'Não sei não!',
  'iiih já era!',
  'Neymar!'
];

export default function ProfilePage() {
  const router = useRouter();
  const { 
    currentUser, users, matches, results, 
    loading, login, refreshData, activeTab, setActiveTab 
  } = useApp();
  
  const [bets, setBets] = useState<any[]>([]); // We still need to fetch bets/predictions for the user
  const [predictions, setPredictions] = useState<any[]>([]);
  const [fetchingUserDetails, setFetchingUserData] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editJargon, setEditJargon] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Initialize edit fields when user is loaded
  useEffect(() => {
    if (currentUser && !isEditing) {
      setEditName(currentUser.name || '');
      setEditAvatar(currentUser.avatar || '😀');
      setEditCity(currentUser.city || '');
      setEditJargon(currentUser.jargon || '');
    }
  }, [currentUser, isEditing]);

  // Track component mounting
  useEffect(() => {
    return () => setIsMounted(false);
  }, []);

  // Fetch user-specific bets and predictions
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser || fetchingUserDetails) return;
      setFetchingUserData(true);
      try {
        const [betsRes, predsRes] = await Promise.all([
          fetch(`/api/bets?userId=${currentUser._id}`),
          fetch(`/api/predictions?userId=${currentUser._id}`)
        ]);
        const betsData = await betsRes.json();
        const predsData = await predsRes.json();
        
        if (isMounted) {
          setBets(betsData);
          setPredictions(predsData);
        }
      } catch (err) {
        console.error('Failed to fetch user activity:', err);
      } finally {
        if (isMounted) {
          setFetchingUserData(false);
        }
      }
    };

    fetchUserData();
  }, [currentUser?._id, isMounted]);
  
  // Get 5 random available avatars (including current user's)
  const getRandomAvailableAvatars = useMemo(() => {
    if (!currentUser || !users) return [];
    const usedAvatars = new Set(users.map(u => u.avatar));
    const availableAvatars = ALL_AVATARS.filter(a => !usedAvatars.has(a) || a === currentUser.avatar);
    const uniqueAvailable = [...new Set(availableAvatars)];
    const shuffled = [...uniqueAvailable].sort(() => Math.random() - 0.5);
    if (!shuffled.includes(currentUser.avatar)) {
      shuffled.unshift(currentUser.avatar);
    }
    return [...new Set(shuffled)].slice(0, 5);
  }, [currentUser, users]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await fetch(`/api/users/${currentUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          avatar: editAvatar,
          city: editCity,
          jargon: editJargon
        }),
      });
      await refreshData();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (!currentUser) return;
    setRefreshing(true);
    await refreshData();
    const [betsRes, predsRes] = await Promise.all([
      fetch(`/api/bets?userId=${currentUser._id}`),
      fetch(`/api/predictions?userId=${currentUser._id}`)
    ]);
    setBets(await betsRes.json());
    setPredictions(await predsRes.json());
    setRefreshing(false);
  };

  const totalSpent = bets.reduce((sum, bet) => sum + bet.amount, 0);
  
  const totalWon = useMemo(() => {
    const betsWon = bets.filter(bet => bet.won).reduce((sum, bet) => sum + (bet.payout || 0), 0);
    const predictionsWon = predictions.reduce((sum, pred) => {
      const result = results[pred.matchId];
      if (!result?.finished) return sum;
      return sum + calculatePredictionReward(
        { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals },
        { homeGoals: result.homeGoals, awayGoals: result.awayGoals }
      );
    }, 0);
    return betsWon + predictionsWon + (currentUser?.totalFoodMoney || 0);
  }, [bets, predictions, results, currentUser?.totalFoodMoney]);

  const netProfit = totalWon - totalSpent;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={login} existingUsers={users} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050816]">
      <Header />

      <main className="flex-1 p-4 pb-32">
        <div className="max-w-md mx-auto">
          {/* Profile Card */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold text-white">Meu Perfil</h2>
               <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 hover:bg-white/10 rounded-full text-white"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center text-5xl">
                {currentUser.avatar}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-yellow-400"
                    />
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400"
                    >
                      <option value="">Escolha a cidade</option>
                      {PREDEFINED_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <select
                      value={editJargon}
                      onChange={(e) => setEditJargon(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400"
                    >
                      <option value="">Escolha o jargão</option>
                      {JARGONS.map(jargon => (
                        <option key={jargon} value={jargon}>{jargon}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold text-white">{currentUser.name}</h2>
                    {currentUser.city && (
                      <p className="text-white/60 text-sm">{currentUser.city}</p>
                    )}
                    {currentUser.jargon && (
                      <p className="text-yellow-400 text-sm mt-1">{currentUser.jargon}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {isEditing && (
              <div className="mb-4">
                <p className="text-white/60 text-sm mb-2">Avatar</p>
                <div className="flex gap-2 flex-wrap">
                  {getRandomAvailableAvatars.map((emoji, index) => (
                    <button
                      key={`${emoji}-${index}`}
                      onClick={() => setEditAvatar(emoji)}
                      className={`text-3xl p-2 rounded-lg ${editAvatar === emoji ? 'bg-yellow-500/30 border border-yellow-500' : 'hover:bg-white/10'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isEditing && (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-white/60 text-sm">Saldo</p>
                <p className="text-2xl font-bold text-yellow-400">
                  N$ {currentUser.balance.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-white/60 text-sm">Fominha Level</p>
                <div className="flex items-center justify-center gap-1">
                  <Utensils className="w-5 h-5 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">{currentUser.foodPoints || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Participation Stats Card */}
          <div className="card p-5 mb-4 bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-white/80 font-medium leading-relaxed">
                Você está participando do bolão em <span className="text-yellow-400 font-bold">{new Set([...bets.map(b => b.matchId), ...predictions.map(p => p.matchId)]).size}</span> Partidas de um total de <span className="text-white font-bold">{matches.length}</span> partidas.
              </p>
              <p className="text-white/60 italic font-medium leading-relaxed">
                ...e você acertou em <span className="text-green-400 font-bold">{currentUser.correctPredictions || 0}</span> palpites até o momento, continue assim!
              </p>
              <button 
                onClick={() => {
                  setActiveTab('matches');
                  router.push('/');
                }}
                className="w-fit mt-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                APOSTAR MAIS
              </button>
            </div>
          </div>

          {/* Evolution Chart Card */}
          <div className="card p-5 mb-6 border-white/5 bg-white/5">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Sua Performance & Futuro
            </h3>
            
            {(() => {
              const currentNow = typeof window !== 'undefined' ? (parseInt(localStorage.getItem('devTimeOffset') || '0') + Date.now()) : Date.now();
              
              // 1. Calculate Participation
              const participatedIds = new Set([...bets.map(b => b.matchId), ...predictions.map(p => p.matchId)]);
              
              // 2. Calculate Efficiency (only for matches that finished)
              const finishedMatchesUserParticipated = matches.filter(m => {
                const isFinished = !!results[m.id]?.finished;
                return isFinished && participatedIds.has(m.id);
              });
              
              const totalFinishedParticipated = finishedMatchesUserParticipated.length;
              const hits = currentUser.correctPredictions || 0;
              const misses = totalFinishedParticipated - hits;
              const efficiency = totalFinishedParticipated > 0 
                ? Math.round((hits / totalFinishedParticipated) * 100) 
                : 0;

              // 3. Calculate REAL Future Opportunities (Betting window still open)
              const futureMatches = matches.filter(m => {
                const mDate = m.matchDate || new Date(m.date).getTime();
                const bettingCloseTime = mDate - (2 * 60 * 1000); // 2 minutes before match
                return currentNow < bettingCloseTime;
              });
              
              const futureOpportunities = futureMatches.length;
              const futureParticipated = futureMatches.filter(m => participatedIds.has(m.id)).length;
              const futurePending = futureOpportunities - futureParticipated;

              return (
                <div className="space-y-5">
                  {/* Efficiency Bar (Success Rate) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/40 font-bold uppercase">Taxa de Acerto</span>
                        <span className="text-[9px] text-green-400/60 font-medium">Acertos no Bolão</span>
                      </div>
                      <span className="text-lg font-black text-green-400">{efficiency}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(efficiency, 2)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
                      <span className="text-green-400">{hits} ACERTOS</span>
                      <span className="text-red-400/60">{misses} ERROS</span>
                    </div>
                  </div>

                  {/* Future Opportunities */}
                  <div className="pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] text-white/40 font-bold uppercase">Próximos Passos</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="text-[9px] text-white/30 uppercase font-bold block mb-1">Ainda pode apostar</span>
                        <span className="text-white font-bold text-sm">{futurePending} jogos</span>
                      </div>
                      <div className="bg-yellow-500/5 rounded-xl p-3 border border-yellow-500/10">
                        <span className="text-[9px] text-yellow-500/50 uppercase font-bold block mb-1">Já garantidos</span>
                        <span className="text-yellow-400 font-bold text-sm">{futureParticipated} jogos</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/40 italic text-center leading-relaxed px-4">
                    {futurePending > 0 
                      ? `Você tem ${futurePending} chances de subir no ranking. Não deixe o tempo passar!`
                      : "Você já apostou em todos os jogos disponíveis. Boa sorte!"}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Financial Stats */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo Financeiro
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Total investido</span>
                <span className="text-red-400 font-medium">- N$ {totalSpent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Total recebido</span>
                <span className="text-green-400 font-medium">+ N$ {totalWon.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="text-white font-medium">Lucro / Prejuízo</span>
                <span className={`font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {netProfit >= 0 ? '+' : ''} N$ {netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Minhas Apostas & Palpites
              </h3>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 hover:bg-white/10 rounded-full text-white transition-all ${refreshing ? 'animate-spin opacity-50' : ''}`}
                title="Atualizar tudo"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            {bets.length === 0 && predictions.length === 0 ? (
              <p className="text-white/60 text-center py-4">Nenhuma atividade ainda</p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const grouped = new Map();
                  matches.forEach(m => {
                    const matchBets = bets.filter(b => b.matchId === m.id);
                    const matchPreds = predictions.filter(p => p.matchId === m.id);
                    if (matchBets.length > 0 || matchPreds.length > 0) {
                      const latestBetDate = matchBets.length > 0 
                        ? Math.max(...matchBets.map(b => new Date(b.createdAt).getTime())) 
                        : 0;
                      const latestPredDate = matchPreds.length > 0 
                        ? Math.max(...matchPreds.map(p => new Date(p.createdAt).getTime())) 
                        : 0;
                      
                      grouped.set(m.id, {
                        match: m,
                        bets: matchBets,
                        predictions: matchPreds,
                        latestDate: new Date(Math.max(latestBetDate, latestPredDate))
                      });
                    }
                  });

                  return Array.from(grouped.values())
                    .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime())
                    .map(({ match, bets: matchBets, predictions: matchPreds }) => {
                      const result = results[match.id];
                      const isFinished = !!result?.finished;

                      return (
                        <div key={match.id} className="bg-white/5 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getFlag(match.team1)}</span>
                              <span className="text-white font-medium text-sm">{match.team1}</span>
                              <span className="text-white/30 text-xs">x</span>
                              <span className="text-white font-medium text-sm">{match.team2}</span>
                              <span className="text-xl">{getFlag(match.team2)}</span>
                            </div>
                            {isFinished && (
                              <div className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-white">
                                {result.homeGoals} - {result.awayGoals}
                              </div>
                            )}
                          </div>

                          {matchBets.map(bet => (
                            <div key={bet._id} className="flex items-center justify-between text-xs">
                              <div className="flex flex-col">
                                <span className="text-white/40 font-bold uppercase text-[9px]">Aposta (N$)</span>
                                <span className="text-white font-medium">
                                  {bet.outcome === 'home' ? match.team1 : bet.outcome === 'draw' ? 'Empate' : match.team2}
                                </span>
                              </div>
                              <div className="text-right">
                                {!isFinished ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider">Retorno</span>
                                    <span className="text-green-400 font-bold">N$ {(bet.amount * bet.odd).toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <span className={`font-bold ${bet.won ? 'text-green-400' : 'text-red-400'}`}>
                                    {bet.won ? `+ N$ ${bet.payout.toLocaleString()}` : `- N$ ${bet.amount.toLocaleString()}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}

                          {matchPreds.map(pred => (
                            <div key={pred._id} className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                              <div className="flex flex-col">
                                <span className="text-white/40 font-bold uppercase text-[9px]">Placar (Bolão)</span>
                                <span className="text-white font-medium">{pred.homeGoals} x {pred.awayGoals}</span>
                              </div>
                              <div className="text-right">
                                {!isFinished ? (
                                  <span className="text-yellow-500/80 italic">Aguardando...</span>
                                ) : (
                                  (() => {
                                    const reward = calculatePredictionReward(
                                      { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals },
                                      { homeGoals: result.homeGoals, awayGoals: result.awayGoals }
                                    );
                                    return (
                                      <span className={`font-bold ${reward > 0 ? 'text-green-400' : 'text-white/20'}`}>
                                        {reward > 0 ? `+ N$ ${reward.toLocaleString()}` : '0'}
                                      </span>
                                    );
                                  })()
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    });
                })()}
              </div>
            )}
          </div>
        </div>
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
