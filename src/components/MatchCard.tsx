'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Check, Save, DollarSign } from 'lucide-react';
import { Match } from '@/data/matches';
import { getFlag } from '@/data/flags';
import Countdown from '@/components/Countdown';
import { IUser } from '@/models/User';
import { getMatchStatus, calculatePredictionReward, calculateOdds } from '@/lib/services/matchService';

interface MatchCardProps {
  match: Match;
  userName: string;
  userId: string;
  currentUser?: IUser | null;
  result?: { homeGoals: number; awayGoals: number; finished: boolean } | null;
  isFeatured?: boolean;
}

export default function MatchCard({ match, userName, userId, currentUser, result, isFeatured }: MatchCardProps) {
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [betAmount, setBetAmount] = useState<string>('100');
  const [betOutcome, setBetOutcome] = useState<'home' | 'draw' | 'away'>('home');
  const [betting, setBetting] = useState(false);
  const [bets, setBets] = useState<any[]>([]);
  const [showBetting, setShowBetting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = getMatchStatus(match);
  const isFinished = status === 'finished' || (result?.finished);
  const isClosed = status === 'closed' || isFinished;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [predRes, betsRes] = await Promise.all([
          fetch(`/api/predictions?userId=${userId}&matchId=${match.id}`),
          fetch(`/api/bets?matchId=${match.id}`),
        ]);
        const preds = await predRes.json();
        const betsData = await betsRes.json();
        if (preds.length > 0) {
          setScore1(preds[0].homeGoals.toString());
          setScore2(preds[0].awayGoals.toString());
          setSaved(true);
        }
        setBets(betsData);

        const myBet = betsData.find((b: any) => (b.userId?._id === userId || b.userId === userId));
        if (myBet) {
          setBetAmount(myBet.amount.toString());
          setBetOutcome(myBet.outcome);
        }
      } catch (err) {
        setError('Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [match.id, userId]);

  const oddsRaw = calculateOdds(bets);
  const odds = {
    home: oddsRaw.home.toFixed(2),
    draw: oddsRaw.draw.toFixed(2),
    away: oddsRaw.away.toFixed(2),
  };

  const handleSave = useCallback(async () => {
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    if (isNaN(s1) || isNaN(s2)) return;

    setSaving(true);
    setError(null);
    try {
      await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          matchId: match.id,
          homeGoals: s1,
          awayGoals: s2,
        }),
      });
      setSaved(true);
    } catch (err) {
      setError('Falha ao salvar palpite');
    } finally {
      setSaving(false);
    }
  }, [score1, score2, match.id, userId]);

  const handlePlaceBet = async () => {
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const currentBetAmount = userBet?.amount || 0;
    if (!currentUser || (currentUser.balance + currentBetAmount) < amount) {
      setError('Saldo insuficiente');
      return;
    }

    setBetting(true);
    setError(null);
    try {
      const odd = oddsRaw[betOutcome];
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          matchId: match.id,
          amount,
          outcome: betOutcome,
          odd,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar aposta');
      }

      if (userBet) {
        setBets(prev => prev.map(b => (b.userId?._id === userId || b.userId === userId) ? data : b));
      } else {
        setBets(prev => [...prev, data]);
      }
      setShowBetting(false);
    } catch (err: any) {
      setError(err.message || 'Falha ao fazer aposta');
    } finally {
      setBetting(false);
    }
  };

  const formatMatchTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const getRewardBadge = () => {
    if (!result || !score1 || !score2) return null;
    const reward = calculatePredictionReward(
      { homeGoals: parseInt(score1), awayGoals: parseInt(score2) },
      result
    );
    if (reward === 1000) {
      return <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">+N$1k</span>;
    }
    if (reward === 300) {
      return <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">+N$300</span>;
    }
    return <span className="bg-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">0</span>;
  };

  const userBet = bets.find(b => (b.userId?._id === userId || b.userId === userId));

  if (loading) {
    return (
      <div className={`card p-4 ${isFeatured ? 'border-yellow-500/30' : ''}`}>
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-20 bg-white/10 rounded"></div>
            <div className="h-16 w-32 bg-white/10 rounded"></div>
            <div className="flex-1 h-20 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-4 animate-slide-up ${isFeatured ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/5' : ''}`}>
      {error && <div className="mb-3 text-red-400 text-sm">{error}</div>}
      <div className="flex items-center justify-between mb-3">
        {match.group && (
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
            {match.group}
          </span>
        )}
        <span className="text-xs text-white/40 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {match.ground}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <span className="text-3xl">{getFlag(match.team1)}</span>
          <span className="text-sm font-semibold text-center truncate w-full text-white">{match.team1}</span>
        </div>

        <div className="flex items-center gap-3">
          {isFinished && result ? (
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-white">{result.homeGoals}</span>
              <span className="text-lg text-white/30">x</span>
              <span className="text-4xl font-bold text-white">{result.awayGoals}</span>
            </div>
          ) : isClosed ? (
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-white/30">{score1 || '-'}</span>
              <span className="text-lg text-white/20">x</span>
              <span className="text-4xl font-bold text-white/30">{score2 || '-'}</span>
            </div>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={score1}
                onChange={(e) => { 
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setScore1(val); 
                  setSaved(false); 
                }}
                className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-bold focus:outline-none focus:border-yellow-400"
                placeholder="-"
              />
              <span className="text-xl text-white/20">x</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={score2}
                onChange={(e) => { 
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setScore2(val); 
                  setSaved(false); 
                }}
                className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-bold focus:outline-none focus:border-yellow-400"
                placeholder="-"
              />
            </>
          )}
          {getRewardBadge()}
        </div>

        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <span className="text-3xl">{getFlag(match.team2)}</span>
          <span className="text-sm font-semibold text-center truncate w-full text-white">{match.team2}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(match.matchDate)} {formatMatchTime(match.matchDate)}
          </span>
          {!isFinished && <Countdown matchDate={match.matchDate} />}
        </div>

        <div className="flex items-center gap-2">
          {!isClosed && !isFinished && (
            <>
              <button
                onClick={() => setShowBetting(!showBetting)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
              >
                <DollarSign className="w-3 h-3" />
                {userBet ? 'Alterar' : 'Apostar'}
              </button>
              <button
                onClick={handleSave}
                disabled={score1 === '' || score2 === '' || saving || saved}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
                  ${saved
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 active:scale-95'
                  }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Salvo
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {userBet && !showBetting && (
        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Sua Aposta</span>
            <span className="text-sm font-bold text-white">
              {userBet.outcome === 'home' ? match.team1 : userBet.outcome === 'draw' ? 'Empate' : match.team2}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Retorno</span>
            <span className="text-sm font-bold text-green-400">
              N$ {(userBet.amount * userBet.odd).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {showBetting && !isClosed && !isFinished && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setBetOutcome('home')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${betOutcome === 'home' ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {match.team1} ({odds.home}x)
            </button>
            <button
              onClick={() => setBetOutcome('draw')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${betOutcome === 'draw' ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Empate ({odds.draw}x)
            </button>
            <button
              onClick={() => setBetOutcome('away')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${betOutcome === 'away' ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {match.team2} ({odds.away}x)
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={betAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setBetAmount(val);
              }}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              placeholder="Valor"
            />
            <button
              onClick={handlePlaceBet}
              disabled={betting || !currentUser || (currentUser.balance + (userBet?.amount || 0)) < parseInt(betAmount)}
              className="px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg"
            >
              {userBet ? 'Atualizar' : 'Apostar'}
            </button>
          </div>
          {userBet && (
            <div className="text-center text-white/40 text-[10px]">
              Aposta atual: N${userBet.amount.toLocaleString()} em {userBet.outcome === 'home' ? match.team1 : userBet.outcome === 'draw' ? 'Empate' : match.team2} ({userBet.odd}x) → <span className="text-green-400 font-bold">Retorno: N${(userBet.amount * userBet.odd).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
