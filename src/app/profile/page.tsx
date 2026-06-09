'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Save, Trophy, TrendingUp, TrendingDown, DollarSign, Home, Utensils, RefreshCw } from 'lucide-react';
import { IUser } from '@/models/User';
import { IBet } from '@/models/Bet';
import { IPrediction } from '@/models/Prediction';
import { Match } from '@/data/matches';
import { getFlag } from '@/data/flags';
import LoginScreen from '@/components/LoginScreen';
import { ALL_AVATARS } from '@/data/avatars';
import { calculatePredictionReward, getMatchStatus } from '@/lib/services/matchService';
import MatchCard from '@/components/MatchCard';
import Countdown from '@/components/Countdown';

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
  const [editCity, setEditCity] = useState('');
  const [editJargon, setEditJargon] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
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
      setEditCity(user?.city || '');
      setEditJargon(user?.jargon || '');
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
        body: JSON.stringify({
          name: editName,
          avatar: editAvatar,
          city: editCity,
          jargon: editJargon
        }),
      });
      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
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
    await loadData(currentUser._id);
    setRefreshing(false);
  };

  const totalSpent = bets.reduce((sum, bet) => sum + bet.amount, 0);
  
  // Calculate total won from both bets and predictions
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
    return <LoginScreen onLogin={loadData} existingUsers={users} />;
  }

  return (
    <div className="min-h-screen bg-[#050816] p-4 pb-32">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-white/10 rounded-full text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 hover:bg-white/10 rounded-full text-white"
          >
            <Edit2 className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="card p-6 mb-6">
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
                  <div className="flex gap-2">
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400"
                    >
                      <option value="">Escolha a cidade</option>
                      {PREDEFINED_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
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

          {/* Balance and Stats */}
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
            <div className="flex justify-between items-center pt-1">
              <span className="text-white/40 text-xs italic">Seu lucro/prejuízo total em relação aos 10.000 iniciais.</span>
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
              {/* Combine and sort by date or just list both */}
              {[...bets.map(b => ({ ...b, type: 'bet' })), ...predictions.map(p => ({ ...p, type: 'prediction' }))]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((item: any) => {
                  const match = matches.find((m) => m.id === item.matchId);
                  const result = results[item.matchId];
                  if (!match) return null;
                  
                  const isBet = item.type === 'bet';
                  const isFinished = !!result?.finished;

                  return (
                    <div key={item._id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getFlag(match.team1)}</span>
                          <span className="text-white font-medium">{match.team1}</span>
                          <span className="text-white/60">x</span>
                          <span className="text-white font-medium">{match.team2}</span>
                          <span className="text-2xl">{getFlag(match.team2)}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isBet ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {isBet ? 'Aposta' : 'Bolão'}
                        </span>
                      </div>

                      {!isFinished && (
                        <div className="flex justify-center py-2 mb-2 border-y border-white/5">
                          <Countdown matchDate={match.matchDate} />
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm">
                          {isBet ? (
                            <div className="flex flex-col">
                              <span className="text-white/60">
                                Palpite: <span className="text-white">{item.outcome === 'home' ? match.team1 : item.outcome === 'draw' ? 'Empate' : match.team2}</span>
                              </span>
                              <span className="text-white/40 text-xs">
                                N$ {item.amount.toLocaleString()} ({item.odd}x)
                              </span>
                            </div>
                          ) : (
                            <span className="text-white/60">
                              Placar: <span className="text-white">{item.homeGoals} x {item.awayGoals}</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="text-right">
                          {!isFinished ? (
                            <div className="flex flex-col items-end">
                              <span className="text-yellow-500/80 text-xs font-medium">Aguardando...</span>
                              {isBet && (
                                <span className="text-green-400/80 text-[10px] font-bold">
                                  Retorno: N$ {(item.amount * item.odd).toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              {isBet ? (
                                <span className={`text-sm font-bold ${item.won ? 'text-green-400' : 'text-red-400'}`}>
                                  {item.won ? `+ N$ ${item.payout.toLocaleString()}` : `- N$ ${item.amount.toLocaleString()}`}
                                </span>
                              ) : (
                                (() => {
                                  const reward = calculatePredictionReward(
                                    { homeGoals: item.homeGoals, awayGoals: item.awayGoals },
                                    { homeGoals: result.homeGoals, awayGoals: result.awayGoals }
                                  );
                                  return (
                                    <span className={`text-sm font-bold ${reward > 0 ? 'text-green-400' : 'text-white/30'}`}>
                                      {reward > 0 ? `+ N$ ${reward.toLocaleString()}` : 'Errou'}
                                    </span>
                                  );
                                })()
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
