'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Check, Save, DollarSign } from 'lucide-react';
import { Match, getMatchStatus } from '@/data/matches';
import { getFlag } from '@/data/flags';
import Countdown from '@/components/Countdown';
import { IUser } from '@/models/User';

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

  const status = getMatchStatus(match);
  const isFinished = status === 'finished' || (result?.finished);
  const isClosed = status === 'closed' || isFinished;

  useEffect(() => {
    fetch(`/api/predictions?userId=${userId}&matchId=${match.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setScore1(data[0].homeGoals.toString());
          setScore2(data[0].awayGoals.toString());
          setSaved(true);
        }
      });

    fetch(`/api/bets?userId=${userId}&matchId=${match.id}`)
      .then(res => res.json())
      .then(data => setBets(data));
  }, [match.id, userId]);

  const calculateOdds = () => {
    const totalBets = bets.length;
    const homeBets = bets.filter(b => b.outcome === 'home').length;
    const drawBets = bets.filter(b => b.outcome === 'draw').length;
    const awayBets = bets.filter(b => b.outcome === 'away').length;

    const homeOdd = homeBets > 0 ? Math.max(1.1, (totalBets || 1) / homeBets).toFixed(2) : '2.00';
    const drawOdd = drawBets > 0 ? Math.max(1.1, (totalBets || 1) / drawBets).toFixed(2) : '2.00';
    const awayOdd = awayBets > 0 ? Math.max(1.1, (totalBets || 1) / awayBets).toFixed(2) : '2.00';

    return { home: homeOdd, draw: drawOdd, away: awayOdd };
  };

  const odds = calculateOdds();

  const handleSave = useCallback(async () => {
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    if (isNaN(s1) || isNaN(s2)) return;

    setSaving(true);
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
      console.error('Failed to save prediction:', err);
    } finally {
      setSaving(false);
    }
  }, [score1, score2, match.id, userId]);

  const handlePlaceBet = async () => {
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!currentUser || currentUser.balance < amount) return;

    setBetting(true);
    try {
      const odd = parseFloat(odds[betOutcome]);
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
      const newBet = await res.json();
      setBets(prev => [...prev, newBet]);
    } catch (err) {
      console.error('Failed to place bet:', err);
    } finally {
      setBetting(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getPointsBadge = () => {
    if (!result) return null;
    if (!score1 || !score2) return null;

    const predWinner = parseInt(score1) > parseInt(score2) ? 1 : parseInt(score1) < parseInt(score2) ? 2 : 0;
    const resultWinner = result.homeGoals > result.awayGoals ? 1 : result.homeGoals < result.awayGoals ? 2 : 0;

    if (parseInt(score1) === result.homeGoals && parseInt(score2) === result.awayGoals) {
      return <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">+3</span>;
    }
    if (predWinner === resultWinner) {
      return <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">+1</span>;
    }
    return <span className="bg-red-500/30 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">0</span>;
  };

  const userBet = bets.find(b => b.userId?._id === userId || b.userId === userId);

  return (
    <div className={`card p-4 animate-slide-up ${isFeatured ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/5' : ''}`}>
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
          <span className="text-sm font-semibold text-center truncate w-full">{match.team1}</span>
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
                type="number"
                min="0"
                max="99"
                value={score1}
                onChange={(e) => { setScore1(e.target.value); setSaved(false); }}
                className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-bold focus:outline-none focus:border-yellow-400"
                placeholder="-"
              />
              <span className="text-xl text-white/20">x</span>
              <input
                type="number"
                min="0"
                max="99"
                value={score2}
                onChange={(e) => { setScore2(e.target.value); setSaved(false); }}
                className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-bold focus:outline-none focus:border-yellow-400"
                placeholder="-"
              />
            </>
          )}
          {getPointsBadge()}
        </div>

        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <span className="text-3xl">{getFlag(match.team2)}</span>
          <span className="text-sm font-semibold text-center truncate w-full">{match.team2}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(match.date)} {match.time.replace(/UTC[+-]?\d+/, '').trim()}
          </span>
          {!isFinished && <Countdown targetDate={match.date} matchTime={match.time} />}
        </div>

        <div className="flex items-center gap-2">
          {!isClosed && !isFinished && (
            <>
              <button
                onClick={() => setShowBetting(!showBetting)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
              >
                <DollarSign className="w-3 h-3" />
                Apostar
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

      {showBetting && !isClosed && !isFinished && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          {userBet ? (
            <div className="text-center text-white/60 text-sm">
              Você já apostou R${userBet.amount} em {userBet.outcome} ({userBet.odd}x)
            </div>
          ) : (
            <>
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
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                  placeholder="Valor"
                />
                <button
                  onClick={handlePlaceBet}
                  disabled={betting || !currentUser || currentUser.balance < parseInt(betAmount)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg"
                >
                  Apostar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
