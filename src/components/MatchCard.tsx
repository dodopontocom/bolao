import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Check, Save } from 'lucide-react';
import { Match, getMatchStatus } from '../data/matches';
import { getFlag } from '../data/flags';
import { Prediction, loadPrediction, savePrediction } from '../data/storage';
import Countdown from './Countdown';

interface MatchCardProps {
  match: Match;
  userName: string;
  result?: { score1: number; score2: number } | null;
  isFeatured?: boolean;
}

export default function MatchCard({ match, userName, result, isFeatured }: MatchCardProps) {
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const status = getMatchStatus(match);
  const isFinished = status === 'finished' || (result !== undefined && result !== null);
  const isClosed = status === 'closed' || isFinished;

  useEffect(() => {
    const existing = loadPrediction(match.id, userName);
    if (existing) {
      setScore1(existing.score1.toString());
      setScore2(existing.score2.toString());
      setSaved(true);
    }
  }, [match.id, userName]);

  const handleSave = useCallback(() => {
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    if (isNaN(s1) || isNaN(s2)) return;

    setSaving(true);
    const prediction: Prediction = {
      matchId: match.id,
      userName,
      score1: s1,
      score2: s2,
      timestamp: Date.now(),
    };
    savePrediction(prediction);

    setTimeout(() => {
      setSaved(true);
      setSaving(false);
    }, 300);
  }, [score1, score2, match.id, userName]);

  const formatDate = (date: string) => {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getPointsBadge = () => {
    if (!result) return null;
    const pred = loadPrediction(match.id, userName);
    if (!pred) return null;

    const predWinner = pred.score1 > pred.score2 ? 1 : pred.score1 < pred.score2 ? 2 : 0;
    const resultWinner = result.score1 > result.score2 ? 1 : result.score1 < result.score2 ? 2 : 0;

    if (pred.score1 === result.score1 && pred.score2 === result.score2) {
      return <span className="bg-gold-500 text-navy-950 text-xs font-bold px-2 py-0.5 rounded-full">+3</span>;
    }
    if (predWinner === resultWinner) {
      return <span className="bg-pitch-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">+1</span>;
    }
    return <span className="bg-red-500/30 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">0</span>;
  };

  return (
    <div className={`card p-4 animate-slide-up ${isFeatured ? 'border-gold-500/30 shadow-lg shadow-gold-500/5' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        {match.group && (
          <span className="text-xs font-bold text-gold-400 uppercase tracking-wider">
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
              <span className="text-4xl font-display font-bold text-white">{result.score1}</span>
              <span className="text-lg font-display text-white/30">x</span>
              <span className="text-4xl font-display font-bold text-white">{result.score2}</span>
            </div>
          ) : isClosed ? (
            <div className="flex items-center gap-3">
              <span className="text-4xl font-display font-bold text-white/30">{score1 || '-'}</span>
              <span className="text-lg font-display text-white/20">x</span>
              <span className="text-4xl font-display font-bold text-white/30">{score2 || '-'}</span>
            </div>
          ) : (
            <>
              <input
                type="number"
                min="0"
                max="99"
                value={score1}
                onChange={(e) => { setScore1(e.target.value); setSaved(false); }}
                className="score-input"
                placeholder="-"
              />
              <span className="text-xl font-display text-white/20">x</span>
              <input
                type="number"
                min="0"
                max="99"
                value={score2}
                onChange={(e) => { setScore2(e.target.value); setSaved(false); }}
                className="score-input"
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

        {!isClosed && !isFinished && (
          <button
            onClick={handleSave}
            disabled={score1 === '' || score2 === '' || saving || saved}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200
              ${saved
                ? 'bg-pitch-500/20 text-pitch-400 border border-pitch-500/30'
                : 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 hover:from-gold-400 hover:to-gold-500 active:scale-95'
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
        )}
      </div>
    </div>
  );
}
