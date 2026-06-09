'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Save, Trophy, TrendingUp, TrendingDown, DollarSign, Home, Utensils } from 'lucide-react';
import { IUser } from '@/models/User';
import { IBet } from '@/models/Bet';
import { IPrediction } from '@/models/Prediction';
import { Match } from '@/data/matches';
import { getFlag } from '@/data/flags';
import LoginScreen from '@/components/LoginScreen';
import { ALL_AVATARS } from '@/data/avatars';
import { calculatePredictionReward, getMatchStatus } from '@/lib/services/matchService';
import MatchCard from '@/components/MatchCard';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [bets, setBets] = useState<IBet[]>([]);
  const [predictions, setPredictions] = useState<IPrediction[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Get 5 random available avatars (including current user's)
  const getRandomAvailableAvatars = useMemo(() => {
    if (!currentUser || !users) return [];
    
    const usedAvatars = new Set(users.map(u => u.avatar));
    const availableAvatars = ALL_AVATARS.filter(a => !usedAvatars.has(a) || a === currentUser.avatar);
    
    // Remove duplicates (just in case)
    const uniqueAvailable = [...new Set(availableAvatars)];
    
    // Shuffle and pick 5
    const shuffled = [...uniqueAvailable].sort(() => Math.random() - 0.5);
    // Ensure current user's avatar is always present
    if (!shuffled.includes(currentUser.avatar)) {
      shuffled.unshift(currentUser.avatar);
    }
    // Remove duplicates one more time
    const finalList = [...new Set(shuffled)];
    return finalList.slice(0, 5);
  }, [currentUser, users]);

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (!savedUserId) {
      setLoading(false);
      return;
    }
    loadData(savedUserId);
  }, []);

  const loadData = async (userData: string | IUser) => {
    const userId = typeof userData === 'string' ? userData : userData._id;
    if (typeof userData !== 'string') {
      localStorage.setItem('userId', userId);
    }

    try {
      const [usersRes, betsRes, predictionsRes, matchesRes, resultsRes] = await Promise.all([
        fetch('/api/users'),
        fetch(`/api/bets?userId=${userId}`),
        fetch(`/api/predictions?userId=${userId}`),
        fetch('/api/matches'),
        fetch('/api/results'),
      ]);
      const usersData = await usersRes.json();
      const betsData = await betsRes.json();
      const predictionsData = await predictionsRes.json();
      const matchesData = await matchesRes.json();
      const resultsData = await resultsRes.json();

      const user = usersData.find((u: IUser) => u._id === userId);
      setCurrentUser(user);
      setEditName(user?.name || '');
      setEditAvatar(user?.avatar || '😀');
      setUsers(usersData);
      setBets(betsData);
      setPredictions(predictionsData);
      setMatches(matchesData);
      setResults(resultsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${currentUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, avatar: editAvatar }),
      });
      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    totalSpent: bets.reduce((sum, bet) => sum + bet.amount, 0),
    totalWon: bets.filter(b => b.won).reduce((sum, bet) => sum + bet.payout, 0),
    netProfit: bets.filter(b => b.won).reduce((sum, bet) => sum + bet.payout, 0) - bets.reduce((sum, bet) => sum + bet.amount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050816]">
        <LoginScreen onLogin={loadData} existingUsers={users} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816]">
      <header className="sticky top-0 z-40 bg-[#050816]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Ir para a Home"
          >
            <Home className="w-5 h-5 text-white/30" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        {/* Profile Info */}
        <div className="card p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
              <div className="text-5xl">{editAvatar}</div>
              <div className="flex gap-2 flex-wrap justify-center">
                {getRandomAvailableAvatars.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    onClick={() => setEditAvatar(emoji)}
                    className={`text-2xl p-2 rounded-lg ${editAvatar === emoji ? 'bg-yellow-500/30 border border-yellow-500' : 'hover:bg-white/10'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Nome</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-lg text-white font-semibold bg-white/10 hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg text-black font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Salvar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-5xl">{currentUser.avatar}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  {currentUser.name}
                  {currentUser.city && <span className="ml-2 text-sm text-white/40 font-normal">({currentUser.city})</span>}
                </h2>
                <p className="text-yellow-400 font-bold text-lg">N${currentUser.balance.toLocaleString()}</p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <Edit2 className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <DollarSign className="w-6 h-6 text-white/60 mx-auto mb-1" />
            <p className="text-xs text-white/40 mb-1">Saldo</p>
            <p className="text-lg font-bold text-yellow-400">N${currentUser.balance.toLocaleString()}</p>
          </div>
          <div className="card p-4 text-center">
            <Utensils className="w-6 h-6 text-white/60 mx-auto mb-1" />
            <p className="text-xs text-white/40 mb-1">Fominha Level</p>
            <p className="text-lg font-bold text-green-400">{currentUser.foodPoints}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <DollarSign className="w-6 h-6 text-white/60 mx-auto mb-1" />
            <p className="text-xs text-white/40 mb-1">Gasto</p>
            <p className="text-lg font-bold text-red-400">-N${stats.totalSpent.toLocaleString()}</p>
          </div>
          <div className="card p-4 text-center">
            <Trophy className="w-6 h-6 text-white/60 mx-auto mb-1" />
            <p className="text-xs text-white/40 mb-1">Ganho</p>
            <p className="text-lg font-bold text-green-400">+N${stats.totalWon.toLocaleString()}</p>
          </div>
          <div className="card p-4 text-center">
            {stats.netProfit >= 0 ? <TrendingUp className="w-6 h-6 text-white/60 mx-auto mb-1" /> : <TrendingDown className="w-6 h-6 text-white/60 mx-auto mb-1" />}
            <p className="text-xs text-white/40 mb-1">Lucro</p>
            <p className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.netProfit >= 0 ? '+' : ''}N${stats.netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Predictions List */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Meus Palpites (Bolão)</h3>
          {predictions.length === 0 ? (
            <div className="card p-6 text-center text-white/40">
              Nenhum palpite realizado
            </div>
          ) : (
            predictions.map(pred => {
              const match = matches.find(m => m.id === pred.matchId);
              const result = results[pred.matchId];
              const reward = result ? calculatePredictionReward(pred, result) : null;
              const status = match ? getMatchStatus(match) : 'closed';
              const isEditable = status === 'open';

              if (editingMatchId === pred.matchId && match) {
                return (
                  <div key={pred._id} className="space-y-2">
                    <MatchCard
                      match={match}
                      userName={currentUser.name}
                      userId={currentUser._id}
                      currentUser={currentUser}
                      result={result}
                    />
                    <button
                      onClick={() => {
                        setEditingMatchId(null);
                        loadData(currentUser._id);
                      }}
                      className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-white/10"
                    >
                      Fechar Edição
                    </button>
                  </div>
                );
              }
              
              return (
                <div key={pred._id} className="card p-4">
                  {match && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlag(match.team1)}</span>
                        <div className="flex flex-col">
                          <span className="text-white text-xs font-medium uppercase tracking-wider opacity-40">{match.group}</span>
                          <span className="text-white text-sm font-semibold">{match.team1}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                          <span className="text-white font-bold">{pred.homeGoals}</span>
                          <span className="text-white/20 text-xs">x</span>
                          <span className="text-white font-bold">{pred.awayGoals}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-white text-xs font-medium uppercase tracking-wider opacity-40 invisible">.</span>
                          <span className="text-white text-sm font-semibold">{match.team2}</span>
                        </div>
                        <span className="text-2xl">{getFlag(match.team2)}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {result && (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/40">Resultado:</span>
                              <span className="text-white/60 text-xs font-bold">{result.homeGoals}-{result.awayGoals}</span>
                            </div>
                            {reward && reward > 0 ? (
                              <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">GANHOU +N${reward}</span>
                            ) : (
                              <span className="bg-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">PERDEU</span>
                            )}
                          </>
                        )}
                        {!result && (
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-yellow-400/50 text-[10px] font-bold">AGUARDANDO</span>
                            {isEditable && (
                              <button
                                onClick={() => setEditingMatchId(pred.matchId)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] text-white font-bold transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                Editar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bets List */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Minhas Apostas (N$)</h3>
          {bets.length === 0 ? (
            <div className="card p-6 text-center text-white/40">
              Nenhuma aposta realizada
            </div>
          ) : (
            bets.map(bet => {
              const match = matches.find(m => m.id === bet.matchId);
              const result = results[bet.matchId];
              const status = match ? getMatchStatus(match) : 'closed';
              const isEditable = status === 'open';

              if (editingMatchId === bet.matchId && match) {
                return (
                  <div key={bet._id} className="space-y-2">
                    <MatchCard
                      match={match}
                      userName={currentUser.name}
                      userId={currentUser._id}
                      currentUser={currentUser}
                      result={result}
                    />
                    <button
                      onClick={() => {
                        setEditingMatchId(null);
                        loadData(currentUser._id);
                      }}
                      className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-bold hover:bg-white/10"
                    >
                      Fechar Edição
                    </button>
                  </div>
                );
              }

              return (
                <div key={bet._id} className="card p-4">
                  {match && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlag(match.team1)}</span>
                        <span className="text-white text-sm font-semibold">{match.team1}</span>
                        <span className="text-white/40 text-sm">x</span>
                        <span className="text-white text-sm font-semibold">{match.team2}</span>
                        <span className="text-2xl">{getFlag(match.team2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result && (
                          <span className="text-white/60 text-sm">{result.homeGoals}-{result.awayGoals}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">N${bet.amount.toLocaleString()}</span>
                      <span className="text-yellow-400 text-sm font-bold">@{bet.odd.toFixed(2)}x</span>
                      <span className="text-xs text-white/40">
                        {bet.outcome === 'home' ? (match?.team1 || 'Casa') : bet.outcome === 'draw' ? 'Empate' : (match?.team2 || 'Fora')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!bet.settled ? (
                        <div className="flex items-center gap-3">
                          <span className="text-yellow-400 text-xs font-bold">PENDENTE</span>
                          {isEditable && (
                            <button
                              onClick={() => setEditingMatchId(bet.matchId)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] text-white font-bold transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              Editar
                            </button>
                          )}
                        </div>
                      ) : bet.won ? (
                        <span className="text-green-400 text-xs font-bold">GANHOU +N${bet.payout.toLocaleString()}</span>
                      ) : (
                        <span className="text-red-400 text-xs font-bold">PERDEU</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
